export async function GET(request) {
  try {
    const url = new URL(request.url);

    const startValue = Number(url.searchParams.get("start")) || 250; // default 250
    const range = Number(url.searchParams.get("range")) || 8; // max change per update
    const duration = Number(url.searchParams.get("duration")) || 3000; // duration for client polling (ms)

    // Random offset between -range and +range
    const randomOffset = Math.floor(Math.random() * (range * 2 + 1)) - range;
    const activeUsers = startValue + randomOffset;

    return new Response(
      JSON.stringify({ activeUsers, duration }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
