/**
 * Safe error message extraction utility for Edge Functions
 * Prevents "[object Object]" errors by properly extracting error messages
 */

export interface SafeErrorResult {
  message: string;
  stack?: string;
  type: string;
  code?: string;
  details?: any;
}

/**
 * Safely extracts error message and details from any error object
 * @param error - The error to extract information from
 * @param fallbackMessage - Default message if no message can be extracted
 * @returns SafeErrorResult with properly extracted error information
 */
export function extractSafeErrorMessage(
  error: any,
  fallbackMessage: string = "Unknown error occurred"
): SafeErrorResult {
  // Handle null/undefined
  if (!error) {
    return {
      message: fallbackMessage,
      type: "null",
    };
  }

  // Handle string errors
  if (typeof error === "string") {
    // Prevent "[object Object]" strings
    if (error === "[object Object]") {
      return {
        message: "String conversion error - object was improperly converted",
        type: "string_conversion_error",
      };
    }
    return {
      message: error || fallbackMessage,
      type: "string",
    };
  }

  // Handle Error objects and error-like objects
  if (typeof error === "object") {
    const result: SafeErrorResult = {
      message: fallbackMessage,
      type: error.constructor?.name || "object",
    };

    // Extract message with priority order
    if (typeof error.message === "string" && error.message && error.message !== "[object Object]") {
      result.message = error.message;
    } else if (typeof error.details === "string" && error.details && error.details !== "[object Object]") {
      result.message = error.details;
    } else if (typeof error.hint === "string" && error.hint && error.hint !== "[object Object]") {
      result.message = error.hint;
    } else if (typeof error.error === "string" && error.error && error.error !== "[object Object]") {
      result.message = error.error;
    } else if (error.code) {
      result.message = `Error code: ${String(error.code)}`;
    } else if (error.name) {
      result.message = `${error.name}: ${error.message || 'No message available'}`;
    } else {
      // Last resort: try to extract meaningful information
      try {
        const jsonString = JSON.stringify(error, Object.getOwnPropertyNames(error));
        if (jsonString && jsonString !== '{}' && jsonString !== '[object Object]') {
          result.message = `Error object: ${jsonString}`;
        }
      } catch {
        result.message = fallbackMessage;
      }
    }

    // Extract additional details safely
    if (error.code) {
      result.code = String(error.code);
    }

    if (error.stack && typeof error.stack === "string") {
      result.stack = error.stack;
    }

    if (error.details && typeof error.details === "object") {
      result.details = error.details;
    }

    return result;
  }

  // Handle primitive types (numbers, booleans, etc.)
  return {
    message: `${typeof error}: ${String(error)}`,
    type: typeof error,
  };
}

/**
 * Safely logs error to console with proper formatting
 * @param context - Context string to identify where the error occurred
 * @param error - The error to log
 * @param additionalData - Optional additional data to include in logs
 */
export function safeErrorLog(
  context: string,
  error: any,
  additionalData?: Record<string, any>
): void {
  const safeError = extractSafeErrorMessage(error);
  
  console.error(`[${context}] Error:`, {
    message: safeError.message,
    type: safeError.type,
    code: safeError.code,
    stack: safeError.stack,
    details: safeError.details,
    additional: additionalData,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Creates a standardized error response for Edge Functions
 * @param error - The error that occurred
 * @param context - Context of where the error occurred
 * @param statusCode - HTTP status code (default: 500)
 * @param corsHeaders - CORS headers object
 * @returns Response object with proper error formatting
 */
export function createErrorResponse(
  error: any,
  context: string,
  statusCode: number = 500,
  corsHeaders: Record<string, string> = {}
): Response {
  const safeError = extractSafeErrorMessage(error);
  
  safeErrorLog(context, error);

  const responseBody = {
    success: false,
    error: safeError.message,
    error_context: context,
    error_type: safeError.type,
    error_code: safeError.code,
    timestamp: new Date().toISOString(),
    // Include debug info in development
    ...(Deno.env.get("ENVIRONMENT") === "development" && {
      debug: {
        stack: safeError.stack,
        details: safeError.details,
      },
    }),
  };

  return new Response(JSON.stringify(responseBody), {
    status: statusCode,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

/**
 * Validates that a string is not "[object Object]" or similar problematic values
 * @param value - The string to validate
 * @param fallback - Fallback value if validation fails
 * @returns Safe string value
 */
export function validateErrorString(value: any, fallback: string = "Unknown error"): string {
  if (typeof value !== "string") {
    return fallback;
  }
  
  if (value === "[object Object]" || value === "undefined" || value === "null" || !value.trim()) {
    return fallback;
  }
  
  return value;
}
