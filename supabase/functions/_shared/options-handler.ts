/**
 * Standardized OPTIONS request handler for all Edge Functions
 * Ensures consistent CORS handling across all functions
 */

import { getCorsHeaders } from "./cors.ts";

/**
 * Handle OPTIONS preflight requests with proper CORS headers
 */
export function handleOptionsRequest(request: Request): Response {
  const origin = request.headers.get('origin') || undefined;
  const corsHeaders = getCorsHeaders(origin);
  
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * Check if request is an OPTIONS request
 */
export function isOptionsRequest(request: Request): boolean {
  return request.method === "OPTIONS";
}

/**
 * Middleware to handle OPTIONS requests at the start of any function
 */
export function withOptionsHandler(handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    if (isOptionsRequest(req)) {
      return handleOptionsRequest(req);
    }
    
    return handler(req);
  };
}
