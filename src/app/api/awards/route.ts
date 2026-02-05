import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import { getAwards, Brand, Award } from "@/lib/GetAwards";

interface BrandCache {
  awards: Award[];
  timestamp: number;
}

const brandAwardsCache: Record<string, BrandCache> = {};
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get("cache") === "false";

    const now = Date.now();

    // Fetch all brands from MongoDB
    const col = await getCollection("dashboard-config");
    const doc = await col.findOne({ uid: "brand-all-properties" });
    const config = doc?.data || {};

    const brands: Brand[] = Object.entries(config)
      .filter(([, site]: any) => site?.awards && site?.url)
      .map(([brand, site]: any) => ({ brand, ...site }));

    // Prepare awards per brand and update cache
    const awardsPromises = brands.map(async (b) => {
      const cached = brandAwardsCache[b.brand];
      if (!forceRefresh && cached && now - cached.timestamp < CACHE_DURATION) {
        return cached.awards;
      }

      const awards = await getAwards([b]);
      brandAwardsCache[b.brand] = { awards, timestamp: now };
      return awards;
    });

    // Flatten array of arrays
    const awardsArrays = await Promise.all(awardsPromises);
    const allAwards = awardsArrays.flat();

    return NextResponse.json(allAwards);
  } catch (err) {
    console.error("API /awards failed:", err);
    return NextResponse.json({ error: "Failed to fetch awards" }, { status: 500 });
  }
}
