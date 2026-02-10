import { NextResponse, NextRequest } from "next/server";
import { getCollection } from "@/lib/mongodb";
import { getAwards, Award, Brand } from "@/lib/GetAwards";

interface BrandCache {
  awards: Award[];
  timestamp: number;
}

const brandAwardsCache: Record<string, BrandCache> = {};
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ brand: string }> }
) {
  try {
    const { brand } = await params;
    const now = Date.now();

    const forceRefresh = req.nextUrl.searchParams.get("cache") === "false";

    // Check cache first
    const cached = brandAwardsCache[brand];
    if (!forceRefresh && cached && now - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.awards);
    }

    // Fetch the specific brand from MongoDB
    const col = await getCollection("dashboard-config");
    const doc = await col.findOne(
      { uid: "brand-all-properties", [`data.${brand}`]: { $exists: true } },
      { projection: { [`data.${brand}`]: 1 } }
    );

    const site = doc?.data?.[brand];

    if (!site || !site.awards || !site.url) {
      return NextResponse.json(
        { error: "Brand not found or no awards" },
        { status: 404 }
      );
    }

    const awards = await getAwards([{ brand, ...site }]);

    // Save in cache
    brandAwardsCache[brand] = { awards, timestamp: now };

    return NextResponse.json(awards);
  } catch (err) {
    console.error(`API /awards/${(await params).brand} failed:`, err);
    return NextResponse.json({ error: "Failed to fetch awards" }, { status: 500 });
  }
}
