import { BetaAnalyticsDataClient } from "@google-analytics/data";

export async function GET() {
  try {
    // Check if environment variables exist
    const propertyId = process.env.GA4_PROPERTY_ID;
    const serviceAccountJSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    if (!propertyId || !serviceAccountJSON) {
      return Response.json(
        { ok: false, message: "Missing GA4_PROPERTY_ID or GOOGLE_SERVICE_ACCOUNT_JSON" },
        { status: 400 }
      );
    }

    // Try to parse JSON
    let credentials;
    try {
      credentials = JSON.parse(serviceAccountJSON);
    } catch (e) {
      return Response.json(
        { ok: false, message: "GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON" },
        { status: 400 }
      );
    }

    // Try to initialize GA4 client
    const client = new BetaAnalyticsDataClient({ credentials });

    // Try a simple GA4 request (realtime activeUsers)
    const [response] = await client.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [{ name: "activeUsers" }],
    });

    // If response exists, it's valid
    if (response?.totals?.[0]?.metricValues?.[0]?.value !== undefined) {
      return Response.json({ ok: true, message: "GA4 credentials and property ID are valid" });
    } else {
      return Response.json({
        ok: false,
        message: "GA4 API call returned unexpected data (check property ID or GA4 traffic)",
      });
    }
  } catch (e) {
    return Response.json({ ok: false, message: "Error connecting to GA4 API", error: e.message }, { status: 500 });
  }
}
