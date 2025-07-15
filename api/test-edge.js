export const config = { runtime: "edge" };

export default async function handler(req) {
  const method = req.method;
  const timestamp = new Date().toISOString();
  const url = new URL(req.url);

  // Get some request info for testing
  const userAgent = req.headers.get("user-agent") || "Unknown";
  const origin = req.headers.get("origin") || "Unknown";

  const responseData = {
    message: "Edge function is working! 🚀",
    method,
    timestamp,
    path: url.pathname,
    userAgent: userAgent.substring(0, 50) + "...", // Truncate for brevity
    origin,
    status: "success",
  };

  return new Response(JSON.stringify(responseData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
