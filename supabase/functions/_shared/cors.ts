export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, origin",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
  "Access-Control-Max-Age": "86400", // 24 hours
  "Access-Control-Allow-Credentials": "false"
};

// Production-specific CORS headers for Vercel deployment
export const productionCorsHeaders = {
  "Access-Control-Allow-Origin": "https://rebooked-solutions.vercel.app",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, origin",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Credentials": "false"
};

// Get appropriate CORS headers based on environment
export function getCorsHeaders(origin?: string): Record<string, string> {
  // Allow specific origins in production
  if (origin && (
    origin.includes('rebooked-solutions.vercel.app') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1')
  )) {
    return {
      ...corsHeaders,
      "Access-Control-Allow-Origin": origin
    };
  }

  return corsHeaders;
}
