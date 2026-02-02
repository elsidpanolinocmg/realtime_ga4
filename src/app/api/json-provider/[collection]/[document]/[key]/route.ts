import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      collection?: string;
      document?: string;
      key?: string;
    }>;
  }
) {
  try {
    const { collection, document, key } = await params;

    if (!collection || !document || !key) {
      return NextResponse.json(
        { error: "Collection, document and key are required" },
        { status: 400 }
      );
    }

    const col = await getCollection(collection);

    const doc = await col.findOne<{ uid: string; data?: any }>({
      uid: document,
    });

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const data = doc.data ?? doc;

    // ✅ Extract specific key
    if (!(key in data)) {
      return NextResponse.json(
        { error: `Key '${key}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(data[key], {
      headers: corsHeaders,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal Server Error", message: (err as Error).message },
      { status: 500 }
    );
  }
}
