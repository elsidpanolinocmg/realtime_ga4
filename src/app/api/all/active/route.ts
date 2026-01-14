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
const TTL_NOW = 60_000;       // 1 min
const TTL_TODAY = 5 * 60_000; // 5 min
const TTL_30 = 30 * 60_000;   // 30 min
const TTL_365 = 30 * 60_000;  // 30 min

let cache: CacheEntry | null = null;

// --- Get all brands from env ---
function getBrands(): string[] {
  const raw = process.env.NEXT_PUBLIC_BRAND_PROPERTIES_JSON;
  if (!raw) return [];
  try {
    return Object.keys(JSON.parse(raw));
  } catch {
    return [];
  }
}

// --- Get GA4 property ID from GA4_PROPERTIES_JSON ---
function getPropertyId(brand: string): string {
  const fallback = process.env.GA4_PROPERTY_ID;
  const raw = process.env.GA4_PROPERTIES_JSON;
  if (!fallback) throw new Error("GA4_PROPERTY_ID missing");

  if (!raw) return fallback;

  try {
    const map = JSON.parse(raw) as Record<string, string>;
    return map[brand] ?? fallback;
  } catch {
    return fallback;
  }
}

// --- Get GA4 filter from NEXT_PUBLIC_BRAND_PROPERTIES_JSON (optional) ---
function getGA4Filter(brand: string) {
  const raw = process.env.NEXT_PUBLIC_BRAND_PROPERTIES_JSON;
  if (!raw) return undefined;

  try {
    const map = JSON.parse(raw) as Record<string, { name: string; ga4_filter?: any }>;
    return map[brand]?.ga4_filter;
  } catch {
    return undefined;
  }
}

// --- Check cache freshness ---
function isFresh(timestamp: number, ttl: number) {
  return Date.now() - timestamp < ttl;
}

export async function GET() {
  const client = getGAClient();
  const brands = getBrands();
  const now = Date.now();

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
      const filter = getGA4Filter(brand);

      // --- Helper to fetch GA4 report (with optional date range) ---
      async function fetchReport(dateRange?: { startDate: string; endDate: string }) {
        const args: any = {
          property: `properties/${getPropertyId(brand)}`,
          metrics: [{ name: "activeUsers" }],
        };
        if (dateRange) args.dateRanges = [dateRange];
        if (filter && dateRange) args.dimensionFilter = { filter };

        try {
          const [res] = await client.runReport(args);
          return Number(res.rows?.[0]?.metricValues?.[0]?.value ?? 0);
        } catch (err) {
          console.error(`[GA4] Fetch failed for ${brand}`, err);
          return 0;
        }
      }

      // --- Active TODAY ---
      if (!isFresh(cache!.timestamps.today, TTL_TODAY)) {
        brandData.today = await fetchReport({ startDate: "today", endDate: "today" });
        console.log(`[GA4] ACTIVE TODAY for ${brand}: ${brandData.today}`);
      }

      // --- Active NOW ---
      if (!isFresh(cache!.timestamps.now, TTL_NOW)) {
        if (filter) {
          // Approximate active now using fraction of the day
          const intervalsPerDay = 48;
          brandData.now = Math.round(brandData.today / intervalsPerDay);
          console.log(`[GA4] ACTIVE NOW (approx) for ${brand}: ${brandData.now}`);
        } else {
          // Realtime API
          try {
            const [res] = await client.runRealtimeReport({
              property: `properties/${getPropertyId(brand)}`,
              metrics: [{ name: "activeUsers" }],
            });
            brandData.now = Number(res.rows?.[0]?.metricValues?.[0]?.value ?? 0);
            console.log(`[GA4] ACTIVE NOW for ${brand}: ${brandData.now}`);
          } catch {
            brandData.now = 0;
          }
        }
      }

      // --- Active LAST 30 DAYS ---
      if (!isFresh(cache!.timestamps["30"], TTL_30)) {
        brandData["30"] = await fetchReport({ startDate: "30daysAgo", endDate: "today" });
        console.log(`[GA4] ACTIVE 30 DAYS for ${brand}: ${brandData["30"]}`);
      }

      // --- Active LAST 365 DAYS ---
      if (!isFresh(cache!.timestamps["365"], TTL_365)) {
        brandData["365"] = await fetchReport({ startDate: "365daysAgo", endDate: "today" });
        console.log(`[GA4] ACTIVE 365 DAYS for ${brand}: ${brandData["365"]}`);
      }

      results[brand] = brandData;
    })
  );

  // Update timestamps
  const updateTimestamp = (key: keyof CacheEntry["timestamps"]) =>
    (cache!.timestamps[key] = now);

  if (!isFresh(cache!.timestamps.now, TTL_NOW)) updateTimestamp("now");
  if (!isFresh(cache!.timestamps.today, TTL_TODAY)) updateTimestamp("today");
  if (!isFresh(cache!.timestamps["30"], TTL_30)) updateTimestamp("30");
  if (!isFresh(cache!.timestamps["365"], TTL_365)) updateTimestamp("365");

  return Response.json({ data: results });
}
