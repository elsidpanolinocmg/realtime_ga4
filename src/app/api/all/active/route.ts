// app/api/all/active/route.ts
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import BRAND_PROPERTIES_RAW from "@/data/brand_properties.json";
import GA4_PROPERTIES_RAW from "@/data/brand_ga4_properties.json";

// ---------------- Types ----------------
interface StringFilter {
  matchType:
    | "MATCH_TYPE_UNSPECIFIED"
    | "EXACT"
    | "CONTAINS"
    | "BEGINS_WITH"
    | "ENDS_WITH";
  value: string;
  caseSensitive?: boolean;
}

interface GA4Filter {
  fieldName: string;
  stringFilter: StringFilter;
}

interface GA4FilterExpression {
  filter: GA4Filter;
}

interface BrandProperty {
  name: string;
  image?: string;
  ga4_filter?: GA4Filter;
  group?: string;
}

interface BrandStats {
  now: number;
  today: number;
  "30": number;
  "365": number;
}

interface CacheEntry {
  data: Record<string, BrandStats>;
  timestamps: Record<string, number>;
}

// ---------------- Constants ----------------
const BRAND_PROPERTIES: Record<string, BrandProperty> =
  BRAND_PROPERTIES_RAW as Record<string, BrandProperty>;
const GA4_PROPS: Record<string, string> = GA4_PROPERTIES_RAW as Record<
  string,
  string
>;

const TTL_NOW = 60_000; // 1 minute
const TTL_TODAY = 5 * 60_000; // 5 minutes

// 30 and 365 will refresh at 12:00 PH/SG
function getNextMiddayTTL(): number {
  const now = new Date();
  const nextMidday = new Date(now);
  nextMidday.setHours(12, 0, 0, 0);
  if (now >= nextMidday) {
    nextMidday.setDate(nextMidday.getDate() + 1);
  }
  return nextMidday.getTime() - now.getTime();
}

const cache: CacheEntry = { data: {}, timestamps: {} };

// ---------------- Helpers ----------------
function isFresh(key: string, ttl: number): boolean {
  return Date.now() - (cache.timestamps[key] ?? 0) < ttl;
}

function buildGA4Filter(filter?: GA4Filter): GA4FilterExpression | undefined {
  if (!filter) return undefined;
  return {
    filter: {
      fieldName: filter.fieldName,
      stringFilter: {
        matchType: filter.stringFilter.matchType,
        value: filter.stringFilter.value,
        caseSensitive: filter.stringFilter.caseSensitive ?? false,
      },
    },
  };
}

// Fetch GA4 report
async function fetchGA4(
  client: BetaAnalyticsDataClient,
  brand: string,
  range: "today" | "30" | "365",
): Promise<number> {
  const request = {
    property: `properties/${GA4_PROPS[brand]}`,
    dateRanges:
      range === "today"
        ? [{ startDate: "today", endDate: "today" }]
        : range === "30"
          ? [{ startDate: "30daysAgo", endDate: "yesterday" }] // exclude today
          : [{ startDate: "365daysAgo", endDate: "yesterday" }], // exclude today
    metrics: [{ name: "activeUsers" }],
    dimensionFilter: buildGA4Filter(BRAND_PROPERTIES[brand]?.ga4_filter),
  };

  const [response] = await client.runReport(request);
  console.log(`[GA4 Fetch] ${brand} (${range}): fetched from GA4`);
  return Number(response.rows?.[0]?.metricValues?.[0]?.value ?? 0);
}

// Fetch GA4 realtime report or estimate
async function fetchRealtime(
  client: BetaAnalyticsDataClient,
  brand: string,
  todayValue: number,
): Promise<number> {
  if (BRAND_PROPERTIES[brand]?.ga4_filter) {
    const val = Math.max(1, Math.round(todayValue / 48));
    console.log(`[GA4 Realtime] ${brand}: estimated ${val}`);
    return val;
  } else {
    const [res] = await client.runRealtimeReport({
      property: `properties/${GA4_PROPS[brand]}`,
      metrics: [{ name: "activeUsers" }],
    });
    const val = Number(
      res.rows?.[0]?.metricValues?.[0]?.value ??
        Math.max(1, Math.round(todayValue / 48)),
    );
    console.log(`[GA4 Realtime] ${brand}: fetched ${val}`);
    return val;
  }
}

// ---------------- Handler ----------------
export async function GET(req: Request) {
  const url = new URL(req.url);
  const bypassCache = url.searchParams.get("cache") === "false";

  if (bypassCache) {
    console.log(`[Cache] Clearing all metric cache`);
    cache.data = {};
    cache.timestamps = {};
  }

  const client = new BetaAnalyticsDataClient({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON as string),
  });

  const brands = Object.keys(BRAND_PROPERTIES);

  await Promise.all(
    brands.map(async (brand) => {
      cache.data[brand] ??= { now: 0, today: 0, "30": 0, "365": 0 };

      // ---- TODAY ----
      if (!isFresh(`${brand}:today`, TTL_TODAY)) {
        cache.data[brand].today = await fetchGA4(client, brand, "today");
        cache.timestamps[`${brand}:today`] = Date.now();
      } else {
        console.log(`[Cache] ${brand}:today served from cache`);
      }

      // ---- 30 DAYS ----
      const ttl30 = getNextMiddayTTL();
      if (!isFresh(`${brand}:30`, ttl30)) {
        cache.data[brand]["30"] = await fetchGA4(client, brand, "30");
        cache.timestamps[`${brand}:30`] = Date.now();
      } else {
        console.log(`[Cache] ${brand}:30 served from cache`);
      }

      // ---- 365 DAYS ----
      const ttl365 = getNextMiddayTTL();
      if (!isFresh(`${brand}:365`, ttl365)) {
        cache.data[brand]["365"] = await fetchGA4(client, brand, "365");
        cache.timestamps[`${brand}:365`] = Date.now();
      } else {
        console.log(`[Cache] ${brand}:365 served from cache`);
      }

      // ---- REALTIME ----
      if (!isFresh(`${brand}:now`, TTL_NOW)) {
        cache.data[brand].now = await fetchRealtime(
          client,
          brand,
          cache.data[brand].today,
        );
        cache.timestamps[`${brand}:now`] = Date.now();
      } else {
        console.log(`[Cache] ${brand}:now served from cache`);
      }
    }),
  );

  return Response.json({ data: cache.data });
}
