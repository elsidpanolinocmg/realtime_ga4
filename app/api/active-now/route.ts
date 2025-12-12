import { getGAClient } from "@/lib/ga4";

interface CacheEntry {
  value: number;
  timestamp: number;
}

// Global cache map per interval
const cacheMap: Record<number, CacheEntry> = {};

// Default cache duration from ENV (ms)
const DEFAULT_CACHE_DURATION = Number(process.env.ACTIVE_USERS_CACHE_MS) || 60000;

// Minimum interval: 1 second
const MIN_INTERVAL = 10000;

export async function GET(request: Request) {
  try {
    const now = Date.now();

    // Read intervalms from query
    const url = new URL(request.url);
    const intervalParam = url.searchParams.get("intervalms");
    let intervalms = intervalParam ? Number(intervalParam) : DEFAULT_CACHE_DURATION;

    // Validate intervalms
    if (isNaN(intervalms) || intervalms < MIN_INTERVAL) {
      intervalms = MIN_INTERVAL;
    }

    // Check cache for this interval
    const cacheEntry = cacheMap[intervalms];
    if (cacheEntry && now - cacheEntry.timestamp < intervalms) {
      return Response.json({ activeUsers: cacheEntry.value, cached: true });
    }

    // Fetch from GA4
    const client = getGAClient();
    const property = `properties/${process.env.GA4_PROPERTY_ID}`;

    console.log(`[GA4] Fetching active users at ${new Date().toISOString()}`);

    const [response] = await client.runRealtimeReport({
      property,
      metrics: [{ name: "activeUsers" }],
    });

    let value = 0;

    if (
      response.totals?.[0]?.metricValues?.[0]?.value !== undefined
    ) {
      value = Number(response.totals[0].metricValues[0].value);
    } else if (
      response.rows?.[0]?.metricValues?.[0]?.value !== undefined
    ) {
      value = Number(response.rows[0].metricValues[0].value);
    }

    // Update cache
    cacheMap[intervalms] = { value, timestamp: now };

    console.log(`[GA4] Active users fetched: ${value}`);

    return Response.json({ activeUsers: value, cached: false });
  } catch (error) {
    // Safe error handling without unknown or any
    let message: string;
    if (error instanceof Error) {
      message = error.message;
    } else {
      message = String(error);
    }
    console.error("GA4 API ERROR:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
