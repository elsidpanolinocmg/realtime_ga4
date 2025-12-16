// app/api/active-today/[brand]/route.ts
import { getGAClient } from "@/lib/ga4";

interface CacheEntry {
  value: number;
  timestamp: number;
}

// Cache per brand + interval
const cacheMap: Record<string, Record<number, CacheEntry>> = {};

const DEFAULT_CACHE_DURATION = 600000;

const MIN_INTERVAL = 60000;

function resolvePropertyId(brand: string): string {
  const fallback = process.env.GA4_PROPERTY_ID;
  if (!fallback) throw new Error("GA4_PROPERTY_ID is not defined");

  if (brand === "default") return fallback;

  const raw = process.env.GA4_PROPERTIES_JSON;
  if (!raw) return fallback;

  try {
    const map = JSON.parse(raw) as Record<string, string>;
    if (!map[brand]) {
      console.warn(
        `[GA4] Brand "${brand}" not found. Using default property.`
      );
      return fallback;
    }
    return map[brand];
  } catch (err) {
    console.error("[GA4] Failed to parse GA4_PROPERTIES_JSON", err);
    return fallback;
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ brand: string }> }
) {
  const { brand } = await params;
  const now = Date.now();

  try {
    const url = new URL(req.url);
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
        `[GA4] Returning cached ACTIVE TODAY for ${brand}: ${cached.value}`
      );
      return Response.json(
        { activeToday: cached.value, cached: true },
        { status: 200 }
      );
    }

    const propertyId = resolvePropertyId(brand);
    const client = getGAClient();
    const property = `properties/${propertyId}`;

    console.log(`[GA4] Fetching ACTIVE TODAY for ${brand}`);

    const [response] = await client.runReport({
      property,
      dateRanges: [{ startDate: "today", endDate: "today" }],
      metrics: [{ name: "activeUsers" }],
    });

    let value = 0;

    if (response.rows?.[0]?.metricValues?.[0]?.value) {
      value = Number(response.rows[0].metricValues[0].value);
    }

    cacheMap[brand][intervalms] = {
      value,
      timestamp: now,
    };

    console.log(`[GA4] Active TODAY for ${brand}: ${value}`);

    return Response.json(
      { activeToday: value, cached: false },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    console.error("GA4 API ERROR:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
