// app/api/active-365-days/[brand]/route.ts
import { getGAClient } from "@/lib/ga4";
import GA4_PROPERTIES_RAW from "@/data/brand_ga4_properties.json";

// ---------------- Types ----------------
interface CacheEntry {
  value: number;
  timestamp: number;
}

// ---------------- Caches ----------------
const cacheMap: Record<string, Record<number, CacheEntry>> = {};
const jsonCache: { data?: Record<string, string>; fetchedAt?: number } = {};

const JSON_TTL = 10 * 60_000;           // 10 min
const DEFAULT_CACHE_DURATION = 60 * 60_000; // 1 hour
const MIN_INTERVAL = 60_000;            // 1 min

// ---------------- Helpers ----------------
async function fetchGA4Properties(bypassCache: boolean) {
  const now = Date.now();

  if (!bypassCache && jsonCache.data && jsonCache.fetchedAt && now - jsonCache.fetchedAt < JSON_TTL) {
    return jsonCache.data;
  }

  try {
    const res = await fetch(
      "https://realtime-ga4-rho.vercel.app/api/json-provider/dashboard-config/brand-ga4-properties" +
        (bypassCache ? "?cache=false" : ""),
      { cache: "no-store" }
    );

    if (!res.ok) throw new Error(res.statusText);

    const payload = await res.json();

    const data =
      typeof payload === "string"
        ? JSON.parse(payload)
        : typeof payload?.data === "string"
        ? JSON.parse(payload.data)
        : payload?.data ?? payload;

    if (!data || typeof data !== "object") {
      throw new Error("Invalid GA4 properties JSON");
    }

    jsonCache.data = data;
    jsonCache.fetchedAt = now;

    return data as Record<string, string>;
  } catch (err) {
    console.warn(
      "[GA4] Failed to fetch remote GA4 properties. Using local fallback.",
      err
    );
    return GA4_PROPERTIES_RAW as Record<string, string>;
  }
}

function resolvePropertyId(brand: string, map: Record<string, string>): string {
  const fallback = process.env.GA4_PROPERTY_ID;
  if (!fallback) throw new Error("GA4_PROPERTY_ID is not defined");

  if (brand === "default") return fallback;

  if (!map[brand]) {
    console.warn(
      `[GA4] Brand "${brand}" not found in GA4 properties. Using default property.`
    );
    return fallback;
  }

  return map[brand];
}

// ---------------- Handler ----------------
export async function GET(
  req: Request,
  { params }: { params: Promise<{ brand: string }> }
) {
  const { brand } = await params;
  const now = Date.now();

  try {
    const url = new URL(req.url);
    const bypassCache = url.searchParams.get("cache") === "false";
    const intervalParam = url.searchParams.get("intervalms");

    let intervalms = intervalParam ? Number(intervalParam) : DEFAULT_CACHE_DURATION;
    if (isNaN(intervalms) || intervalms < MIN_INTERVAL) intervalms = MIN_INTERVAL;

    if (!cacheMap[brand]) cacheMap[brand] = {};

    const cached = cacheMap[brand][intervalms];
    if (cached && now - cached.timestamp < intervalms) {
      console.log(`[GA4] ACTIVE LAST 365 DAYS (cache) for ${brand}: ${cached.value}`);
      return Response.json({ activeLast365Days: cached.value, cached: true }, { status: 200 });
    }

    // ---- Resolve GA4 property ----
    const GA4_PROPS = await fetchGA4Properties(bypassCache);
    const propertyId = resolvePropertyId(brand, GA4_PROPS);

    const client = getGAClient();
    console.log(`[GA4] Fetching ACTIVE LAST 365 DAYS for ${brand} using property ${propertyId}`);

    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "365daysAgo", endDate: "today" }],
      metrics: [{ name: "activeUsers" }],
    });

    const value = Number(response?.rows?.[0]?.metricValues?.[0]?.value ?? 0);

    cacheMap[brand][intervalms] = { value, timestamp: now };

    console.log(`[GA4] ACTIVE LAST 365 DAYS fetched for ${brand}: ${value}`);

    return Response.json({ activeLast365Days: value, cached: false }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[GA4] Active-365-days error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
