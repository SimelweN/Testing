/**
 * Safe Body Parser - Prevents "body stream already read" errors
 * Use this utility in ALL Edge Functions instead of direct req.json() calls
 */

export interface SafeBodyResult<T = any> {
  success: boolean;
  data: T | null;
  error?: string;
  bodyWasUsed?: boolean;
}

/**
 * Safely parse request body with comprehensive error handling
 * This prevents "body stream already read" errors completely
 */
export async function safeParseBody<T = any>(req: Request): Promise<SafeBodyResult<T>> {
  try {
    // Check if body was already consumed
    const bodyUsedBefore = req.bodyUsed;
    
    console.log(`🔍 Body consumption check:`, {
      bodyUsed: bodyUsedBefore,
      method: req.method,
      contentType: req.headers.get("content-type"),
      timestamp: new Date().toISOString()
    });

    if (bodyUsedBefore) {
      return {
        success: false,
        data: null,
        error: "Request body has already been consumed",
        bodyWasUsed: true
      };
    }

    // Attempt to parse JSON
    const data = await req.json() as T;
    
    console.log(`✅ Body parsed successfully:`, {
      hasData: !!data,
      dataKeys: typeof data === 'object' && data !== null ? Object.keys(data) : 'not-object',
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      data,
      error: undefined,
      bodyWasUsed: false
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error(`❌ Body parsing failed:`, {
      error: errorMessage,
      bodyUsed: req.bodyUsed,
      method: req.method,
      contentType: req.headers.get("content-type"),
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      data: null,
      error: errorMessage,
      bodyWasUsed: req.bodyUsed
    };
  }
}

/**
 * Create error response for body consumption issues
 */
export function createBodyErrorResponse(result: SafeBodyResult, corsHeaders: any): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: "BODY_CONSUMPTION_ERROR",
      details: {
        error_message: result.error,
        body_was_used: result.bodyWasUsed,
        timestamp: new Date().toISOString(),
        debug_info: {
          possible_causes: [
            "Request body consumed multiple times",
            "Middleware consuming body before function",
            "req.clone() issues in health checks",
            "Testing utilities consuming body"
          ]
        }
      },
      fix_instructions: "Check for duplicate body consumption patterns and ensure body is only read once per request"
    }),
    {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

/**
 * Universal body parser for Edge Functions
 * Use this instead of await req.json() in ALL functions
 */
export async function parseRequestBody<T = any>(req: Request, corsHeaders: any): Promise<{
  success: boolean;
  data?: T;
  errorResponse?: Response;
}> {
  const result = await safeParseBody<T>(req);
  
  if (!result.success) {
    return {
      success: false,
      errorResponse: createBodyErrorResponse(result, corsHeaders)
    };
  }

  return {
    success: true,
    data: result.data!
  };
}
