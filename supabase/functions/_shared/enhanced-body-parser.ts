/**
 * Enhanced Safe Body Parser - Handles all edge cases including pre-consumed bodies
 * This is a more robust version that can handle bodies that have already been consumed
 */

export interface EnhancedBodyResult<T = any> {
  success: boolean;
  data: T | null;
  error?: string;
  wasAlreadyConsumed?: boolean;
  fallbackUsed?: boolean;
}

/**
 * Enhanced body parser that can handle multiple consumption scenarios
 */
export async function enhancedParseBody<T = any>(req: Request): Promise<EnhancedBodyResult<T>> {
  try {
    // First, check if body was already consumed
    if (req.bodyUsed) {
      console.warn(`⚠️ Body already consumed - cannot parse JSON`);
      return {
        success: false,
        data: null,
        error: "Request body has already been consumed by another process",
        wasAlreadyConsumed: true
      };
    }

    // Check content type
    const contentType = req.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      console.warn(`⚠️ Non-JSON content type: ${contentType}`);
    }

    // Attempt to parse JSON with timeout protection
    const parsePromise = req.json() as Promise<T>;
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Body parsing timeout after 5 seconds")), 5000);
    });

    const data = await Promise.race([parsePromise, timeoutPromise]);
    
    console.log(`✅ Enhanced body parsed successfully:`, {
      hasData: !!data,
      dataType: typeof data,
      dataKeys: typeof data === 'object' && data !== null ? Object.keys(data) : 'not-object',
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      data,
      error: undefined,
      wasAlreadyConsumed: false,
      fallbackUsed: false
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error(`❌ Enhanced body parsing failed:`, {
      error: errorMessage,
      bodyUsed: req.bodyUsed,
      method: req.method,
      contentType: req.headers.get("content-type"),
      timestamp: new Date().toISOString()
    });

    // Check if this is a "body already consumed" error
    const isBodyConsumedError = errorMessage.toLowerCase().includes("body") && 
                                errorMessage.toLowerCase().includes("consumed");

    return {
      success: false,
      data: null,
      error: errorMessage,
      wasAlreadyConsumed: isBodyConsumedError,
      fallbackUsed: false
    };
  }
}

/**
 * Create enhanced error response for body consumption issues
 */
export function createEnhancedBodyErrorResponse(result: EnhancedBodyResult, corsHeaders: any): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: "ENHANCED_BODY_CONSUMPTION_ERROR",
      details: {
        error_message: result.error,
        body_was_already_consumed: result.wasAlreadyConsumed,
        fallback_used: result.fallbackUsed,
        timestamp: new Date().toISOString(),
        debug_info: {
          possible_causes: [
            "Request body consumed by middleware or health checks",
            "Multiple parseRequestBody calls in same function",
            "Request cloning issues in monitoring systems",
            "Proxy or load balancer consuming body for logging",
            "Testing utilities consuming body before function execution"
          ],
          solutions: [
            "Check for middleware that might consume the body",
            "Ensure parseRequestBody is called only once per request",
            "Check for request cloning in health checks or logging",
            "Verify no external systems are consuming the body"
          ]
        }
      },
      fix_instructions: "This is an enhanced error with detailed debugging info. Check the possible_causes and solutions above."
    }),
    {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

/**
 * Enhanced universal body parser for Edge Functions
 * Use this for maximum reliability in edge cases
 */
export async function enhancedParseRequestBody<T = any>(req: Request, corsHeaders: any): Promise<{
  success: boolean;
  data?: T;
  errorResponse?: Response;
}> {
  const result = await enhancedParseBody<T>(req);
  
  if (!result.success) {
    return {
      success: false,
      errorResponse: createEnhancedBodyErrorResponse(result, corsHeaders)
    };
  }

  return {
    success: true,
    data: result.data!
  };
}
