import { NextResponse } from "next/server";
import { getAwards, Award } from "@/lib/GetAwards";

/* ---------------- MODULE CACHE ---------------- */
let cachedAwards: Award[] | null = null;
let cacheTimestamp = 0;

const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get("cache") === "false";

    const now = Date.now();

    if (
      cachedAwards &&
      !forceRefresh &&
      now - cacheTimestamp < CACHE_DURATION
    ) {
      console.log("API: Returning cached awards");
      return NextResponse.json(cachedAwards);
    }

    console.log("API: Fetching fresh awards...");

    const awards = await getAwards();

    cachedAwards = awards;
    cacheTimestamp = now;

    return NextResponse.json(awards, {
      headers: {
        "Cache-Control": "s-maxage=604800, stale-while-revalidate",
      },
    });
  } catch (err) {
    console.error("API /awards failed:", err);

    return NextResponse.json(
      { error: "Failed to fetch awards" },
      { status: 500 }
    );
  }
}
