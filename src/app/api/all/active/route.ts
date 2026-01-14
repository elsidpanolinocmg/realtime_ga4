import { getGAClient } from "@/lib/ga4";

interface BrandStats {
  now: number;
  today: number;
  "30": number;
  "365": number;
}

interface CacheEntry {
  data: Record<string, BrandStats>;
  timestamps: {
    now: number;
    today: number;
    "30": number;
    "365": number;
  };
}

// Cache TTLs
const TTL_NOW = 60_000;         // 1 min
const TTL_TODAY = 5 * 60_000;   // 5 min
const TTL_30 = 30 * 60_000;     // 30 min
const TTL_365 = 30 * 60_000;    // 30 min

let cache: CacheEntry | null = null;

function getBrands(): string[] {
  const raw = process.env.GA4_PROPERTIES_JSON;
  if (!raw) return [];
  try {
    return Object.keys(JSON.parse(raw));
  } catch {
    return [];
  }
}

function getPropertyId(brand: string): string {
  const raw = process.env.GA4_PROPERTIES_JSON;
  const fallback = process.env.GA4_PROPERTY_ID;

  if (!raw || !fallback) throw new Error("GA4 config missing");

  const map = JSON.parse(raw) as Record<string, string>;
  return map[brand] ?? fallback;
}

function isFresh(timestamp: number, ttl: number) {
  return Date.now() - timestamp < ttl;
}

export async function GET() {
  const client = getGAClient();
  const brands = getBrands();
  const now = Date.now();

  // Initialize cache if null
  if (!cache) {
    cache = {
      data: {},
      timestamps: { now: 0, today: 0, "30": 0, "365": 0 },
    };
  }

  const results: Record<string, BrandStats> = {};

  await Promise.all(
    brands.map(async (brand) => {
      if (!cache!.data[brand]) {
        cache!.data[brand] = { now: 0, today: 0, "30": 0, "365": 0 };
      }
      const brandData = cache!.data[brand];

      // --- Active NOW ---
      if (!isFresh(cache!.timestamps.now, TTL_NOW)) {
        try {
          const [res] = await client.runRealtimeReport({
            property: `properties/${getPropertyId(brand)}`,
            metrics: [{ name: "activeUsers" }],
          });
          brandData.now = Number(res.rows?.[0]?.metricValues?.[0]?.value ?? 0);
          console.log(`[GA4] Fetched ACTIVE NOW for ${brand} from GA4`);
        } catch {
          brandData.now = 0;
          console.log(`[GA4] Fetched ACTIVE NOW for ${brand} from GA4 (failed)`);
        }
      } else {
        console.log(`[GA4] Fetched ACTIVE NOW for ${brand} from cache`);
      }

      // --- Active TODAY ---
      if (!isFresh(cache!.timestamps.today, TTL_TODAY)) {
        try {
          const [res] = await client.runReport({
            property: `properties/${getPropertyId(brand)}`,
            dateRanges: [{ startDate: "today", endDate: "today" }],
            metrics: [{ name: "activeUsers" }],
          });
          brandData.today = Number(res.rows?.[0]?.metricValues?.[0]?.value ?? 0);
          console.log(`[GA4] Fetched ACTIVE TODAY for ${brand} from GA4`);
        } catch {
          brandData.today = 0;
          console.log(`[GA4] Fetched ACTIVE TODAY for ${brand} from GA4 (failed)`);
        }
      } else {
        console.log(`[GA4] Fetched ACTIVE TODAY for ${brand} from cache`);
      }

      // --- Active LAST 30 DAYS ---
      if (!isFresh(cache!.timestamps["30"], TTL_30)) {
        try {
          const [res] = await client.runReport({
            property: `properties/${getPropertyId(brand)}`,
            dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
            metrics: [{ name: "activeUsers" }],
          });
          brandData["30"] = Number(res.rows?.[0]?.metricValues?.[0]?.value ?? 0);
          console.log(`[GA4] Fetched ACTIVE 30 DAYS for ${brand} from GA4`);
        } catch {
          brandData["30"] = 0;
          console.log(`[GA4] Fetched ACTIVE 30 DAYS for ${brand} from GA4 (failed)`);
        }
      } else {
        console.log(`[GA4] Fetched ACTIVE 30 DAYS for ${brand} from cache`);
      }

      // --- Active LAST 365 DAYS ---
      if (!isFresh(cache!.timestamps["365"], TTL_365)) {
        try {
          const [res] = await client.runReport({
            property: `properties/${getPropertyId(brand)}`,
            dateRanges: [{ startDate: "365daysAgo", endDate: "today" }],
            metrics: [{ name: "activeUsers" }],
          });
          brandData["365"] = Number(res.rows?.[0]?.metricValues?.[0]?.value ?? 0);
          console.log(`[GA4] Fetched ACTIVE 365 DAYS for ${brand} from GA4`);
        } catch {
          brandData["365"] = 0;
          console.log(
            `[GA4] Fetched ACTIVE 365 DAYS for ${brand} from GA4 (failed)`
          );
        }
      } else {
        console.log(`[GA4] Fetched ACTIVE 365 DAYS for ${brand} from cache`);
      }

      results[brand] = brandData;
    })
  );

  // Update timestamps after all brands
  const updateTimestamp = (key: keyof CacheEntry["timestamps"]) =>
    (cache!.timestamps[key] = now);

  if (!isFresh(cache!.timestamps.now, TTL_NOW)) updateTimestamp("now");
  if (!isFresh(cache!.timestamps.today, TTL_TODAY)) updateTimestamp("today");
  if (!isFresh(cache!.timestamps["30"], TTL_30)) updateTimestamp("30");
  if (!isFresh(cache!.timestamps["365"], TTL_365)) updateTimestamp("365");

  return Response.json({ data: results });
}
