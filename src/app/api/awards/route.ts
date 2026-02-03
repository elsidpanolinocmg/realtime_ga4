import { NextResponse } from "next/server";
import { getAwards, Award } from "@/lib/GetAwards";

// Module-level cache (works reliably for API route instance)
let cachedAwards: Award[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function GET(req: Request) {
  const url = new URL(req.url);
  const forceRefresh = url.searchParams.get("cache") === "false";
  const now = Date.now();

  if (!cachedAwards || now - cacheTimestamp > CACHE_DURATION || forceRefresh) {
    try {
      cachedAwards = await getAwards();
      cacheTimestamp = now;
      console.log("Fetched new awards and updated cache");
    } catch (e) {
      console.error("Failed to fetch awards, returning cached if available", e);
    }
  } else {
    console.log("Using cached awards");
  }

  return NextResponse.json(cachedAwards || []);
}
