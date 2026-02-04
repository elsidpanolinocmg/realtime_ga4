import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import { getAwards, Brand, Award } from "@/lib/GetAwards";

let cachedAwards: Award[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get("cache") === "false";

    const now = Date.now();
    if (!forceRefresh && cachedAwards && now - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json(cachedAwards);
    }

    // Get brands from MongoDB directly
    const col = await getCollection("dashboard-config");
    const doc = await col.findOne({ uid: "brand-all-properties" });
    const config = doc?.data || {};

    const brands: Brand[] = Object.entries(config)
      .filter(([, site]: any) => site?.awards && site?.url)
      .map(([brand, site]: any) => ({ brand, ...site }));

    const awards = await getAwards(brands);

    cachedAwards = awards;
    cacheTimestamp = now;

    return NextResponse.json(awards);
  } catch (err) {
    console.error("API /awards failed:", err);
    return NextResponse.json({ error: "Failed to fetch awards" }, { status: 500 });
  }
}
