// app/api/active-now/[brand]/route.ts
import { getGAClient } from "@/lib/ga4";
import GA4_PROPERTIES_RAW from "@/data/brand_ga4_properties.json";

// ---------------- Types ----------------
interface CacheEntry {
  value: number;
  timestamp: number;
}

// ---------------- Cache ----------------
const cacheMap: Record<string, Record<number, CacheEntry>> = {};
const jsonCache: { data?: Record<string, string>; fetchedAt?: number } = {};

const JSON_TTL = 10 * 60_000;
const DEFAULT_CACHE_DURATION =
  Number(process.env.ACTIVE_USERS_CACHE_MS) || 60_000;
const MIN_INTERVAL = 5_000;

// ---------------- Helpers ----------------
async function fetchGA4Properties(bypassCache: boolean) {
  const now = Date.now();

  if (
    !bypassCache &&
    jsonCache.data &&
    jsonCache.fetchedAt &&
    now - jsonCache.fetchedAt < JSON_TTL
  ) {
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

    // 🔒 Normalize all possible shapes
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
      "[GA4] Failed to fetch GA4 properties. Using local fallback.",
      err
    );
    return GA4_PROPERTIES_RAW as Record<string, string>;
  }
}

function resolvePropertyId(
  brand: string,
  map: Record<string, string>
): string {
  const fallback = process.env.GA4_PROPERTY_ID;
  if (!fallback) throw new Error("GA4_PROPERTY_ID missing");

  if (brand === "default") return fallback;

  if (!map[brand]) {
    console.warn(
      `[GA4] Brand "${brand}" not found. Using default property.`
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

    let intervalms = intervalParam
      ? Number(intervalParam)
      : DEFAULT_CACHE_DURATION;

    if (isNaN(intervalms) || intervalms < MIN_INTERVAL) {
      intervalms = MIN_INTERVAL;
    }

    if (!cacheMap[brand]) cacheMap[brand] = {};

    const cached = cacheMap[brand][intervalms];
    if (cached && now - cached.timestamp < intervalms) {
      console.log(
        `[GA4] Active-now (cache) for ${brand}: ${cached.value}`
      );
      return Response.json(
        { activeUsers: cached.value, cached: true },
        { status: 200 }
      );
    }

    // ---- Resolve GA4 Property ----
    const GA4_PROPS = await fetchGA4Properties(bypassCache);
    const propertyId = resolvePropertyId(brand, GA4_PROPS);

    const client = getGAClient();

    console.log(
      `[GA4] Fetching active-now for ${brand} using property ${propertyId}`
    );

    const [res] = await client.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [{ name: "activeUsers" }],
    });

    const value = Number(
      res?.totals?.[0]?.metricValues?.[0]?.value ??
        res?.rows?.[0]?.metricValues?.[0]?.value ??
        0
    );

    cacheMap[brand][intervalms] = {
      value,
      timestamp: now,
    };

    console.log(`[GA4] Active-now fetched for ${brand}: ${value}`);

    return Response.json(
      { activeUsers: value, cached: false },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    console.error("[GA4] Active-now error:", message);

    return Response.json({ error: message }, { status: 500 });
  }
}
  