/**
 * Universal Request Body Utilities
 * Prevents "body stream already read" errors across all Edge Functions
 */

export interface RequestBodyResult<T = any> {
  success: boolean;
  data: T | null;
  error?: string;
}

/**
 * Safely consume request body only once, with proper error handling
 * Prevents "body stream already read" errors
 */
export async function safelyConsumeRequestBody<T = any>(req: Request): Promise<RequestBodyResult<T>> {
  try {
    // Check if body has already been consumed
    if (req.bodyUsed) {
      return {
        success: false,
        data: null,
        error: "Request body has already been consumed"
      };
    }

    const data = await req.json() as T;
    return {
      success: true,
      data,
      error: undefined
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: `Failed to parse JSON: ${error.message}`
    };
  }
}

/**
 * Check if request is a health check without consuming body
 */
export function isHealthCheckRequest(req: Request): boolean {
  const url = new URL(req.url);
  return url.pathname.endsWith("/health") || 
         url.searchParams.get("health") === "true" ||
         req.headers.get("x-health-check") === "true";
}

/**
 * Check if request is a test request without consuming body
 */
export function isTestRequest(req: Request): boolean {
  const url = new URL(req.url);
  return url.searchParams.get("test") === "true" || 
         url.searchParams.get("mock") === "true" ||
         req.headers.get("x-test-mode") === "true";
}

/**
 * Handle health check response
 */
export function createHealthCheckResponse(serviceName: string, additionalData: any = {}): Response {
  return new Response(
    JSON.stringify({
      success: true,
      service: serviceName,
      status: "healthy",
      timestamp: new Date().toISOString(),
      ...additionalData
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}

/**
 * Safely handle request body with health check consideration
 * Use this instead of direct req.json() calls
 */
export async function handleRequestBody<T = any>(
  req: Request, 
  serviceName: string,
  healthCheckData: any = {}
): Promise<{ isHealthCheck: boolean; body?: T; response?: Response }> {
  
  // Check for health check first (no body consumption)
  if (isHealthCheckRequest(req)) {
    return {
      isHealthCheck: true,
      response: createHealthCheckResponse(serviceName, healthCheckData)
    };
  }

  // If not health check, safely consume body
  const bodyResult = await safelyConsumeRequestBody<T>(req);
  
  if (!bodyResult.success) {
    return {
      isHealthCheck: false,
      response: new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_REQUEST_BODY",
          details: {
            message: bodyResult.error,
          },
          fix_instructions: "Ensure request body contains valid JSON"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      )
    };
  }

  return {
    isHealthCheck: false,
    body: bodyResult.data
  };
}
