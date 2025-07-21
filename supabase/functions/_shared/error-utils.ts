/**
 * Comprehensive Error Handling Utilities
 * Prevents "[object Object]" errors and provides consistent error serialization
 */

/**
 * Safely extract error message from any type of error
 */
export function getErrorMessage(error: unknown): string {
  if (error === null || error === undefined) {
    return "Unknown error occurred";
  }

  // Handle Error objects
  if (error instanceof Error) {
    return error.message || "Error occurred without message";
  }

  // Handle string errors
  if (typeof error === "string") {
    return error;
  }

  // Handle objects with message property
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as any).message;
    if (typeof message === "string") {
      return message;
    }
  }

  // Handle objects with error property
  if (typeof error === "object" && error !== null && "error" in error) {
    const errorProp = (error as any).error;
    if (typeof errorProp === "string") {
      return errorProp;
    }
    if (errorProp instanceof Error) {
      return errorProp.message;
    }
  }

  // Try to stringify non-Error objects safely
  try {
    const stringified = JSON.stringify(error);
    if (stringified && stringified !== "{}") {
      return stringified;
    }
  } catch {
    // JSON.stringify failed, fall through to String()
  }

  // Last resort - use String() but handle edge cases
  try {
    const stringified = String(error);
    if (stringified === "[object Object]") {
      return "Unknown error (object type)";
    }
    return stringified;
  } catch {
    return "Unserializable error occurred";
  }
}

/**
 * Get error type/name safely
 */
export function getErrorType(error: unknown): string {
  if (error === null) return "NullError";
  if (error === undefined) return "UndefinedError";
  
  if (error instanceof Error) {
    return error.constructor.name || "Error";
  }

  if (typeof error === "object" && error !== null) {
    try {
      return error.constructor?.name || "Object";
    } catch {
      return "Object";
    }
  }

  return typeof error;
}

/**
 * Get error stack safely
 */
export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error && error.stack) {
    return error.stack;
  }

  if (typeof error === "object" && error !== null && "stack" in error) {
    const stack = (error as any).stack;
    if (typeof stack === "string") {
      return stack;
    }
  }

  return undefined;
}

/**
 * Create a comprehensive error details object
 */
export function createErrorDetails(error: unknown, context?: string): {
  error_message: string;
  error_type: string;
  error_stack?: string;
  context?: string;
} {
  return {
    error_message: getErrorMessage(error),
    error_type: getErrorType(error),
    ...(getErrorStack(error) && { error_stack: getErrorStack(error) }),
    ...(context && { context })
  };
}

/**
 * Log error safely with consistent formatting
 */
export function logError(context: string, error: unknown, additionalData?: any): void {
  const errorMessage = getErrorMessage(error);
  const errorType = getErrorType(error);
  
  console.error(`[${context}] ${errorType}: ${errorMessage}`);
  
  if (additionalData) {
    console.error(`[${context}] Additional data:`, additionalData);
  }

  const stack = getErrorStack(error);
  if (stack) {
    console.error(`[${context}] Stack trace:`, stack);
  }
}
