/**
 * Enhanced error handling utilities to prevent [object Object] logging issues
 */

/**
 * Formats an error for logging to prevent [object Object] issues
 */
export const formatErrorForLogging = (error: unknown): any => {
  if (error === null || error === undefined) {
    return error;
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === "object") {
    try {
      // Handle Supabase errors and other objects with specific properties
      const errorObj = error as any;

      if (errorObj.message || errorObj.code || errorObj.details) {
        return {
          message: errorObj.message || "Unknown error",
          code: errorObj.code || "NO_CODE",
          details: errorObj.details || "No details",
          hint: errorObj.hint || undefined,
          name: errorObj.name || "UnknownError",
        };
      }

      // Try to stringify the object safely
      const safeStringify = (obj: any): string => {
        try {
          return JSON.stringify(
            obj,
            (key, value) => {
              if (typeof value === "function") return "[Function]";
              if (typeof value === "undefined") return "[Undefined]";
              if (value instanceof Error)
                return {
                  name: value.name,
                  message: value.message,
                  stack: value.stack,
                };
              return value;
            },
            2,
          );
        } catch {
          return obj.toString();
        }
      };

      return {
        type: "object",
        stringified: safeStringify(errorObj),
        constructor: errorObj.constructor?.name || "Unknown",
        keys: Object.keys(errorObj),
      };
    } catch (stringifyError) {
      // If all else fails, return a safe representation
      return {
        type: "object",
        toString: String(error),
        constructor: error.constructor?.name || "Unknown",
        error: "Failed to serialize error object",
      };
    }
  }

  // For primitives (string, number, boolean)
  return error;
};

/**
 * Safely logs an error with proper formatting
 */
export const safeLogError = (
  context: string,
  error: unknown,
  additionalData?: any,
) => {
  const formattedError = formatErrorForLogging(error);
  const errorMessage = error instanceof Error ? error.message : String(error);

  console.error(`[${context}] Error:`, {
    message: errorMessage,
    error: formattedError,
    additionalData,
    timestamp: new Date().toISOString(),
  });

  return formattedError;
};

/**
 * Enhanced console.error wrapper that prevents [object Object] logging
 */
export const logErrorSafely = (message: string, error: unknown) => {
  const errorInfo = formatErrorForLogging(error);
  console.error(message, errorInfo);
  return errorInfo;
};

/**
 * Get a readable error message from any error type
 */
export const getReadableErrorMessage = (error: unknown): string => {
  if (error === null || error === undefined) {
    return "Unknown error occurred";
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object") {
    const errorObj = error as any;

    // Check for common error message properties
    if (errorObj.message) {
      return String(errorObj.message);
    }

    if (errorObj.error) {
      return String(errorObj.error);
    }

    if (errorObj.details) {
      return String(errorObj.details);
    }

    // Fallback to stringification
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  return String(error);
};

/**
 * Creates a standardized error handler for async operations
 */
export const createErrorHandler = (context: string) => {
  return (error: unknown) => {
    const formattedError = safeLogError(context, error);
    const readableMessage = getReadableErrorMessage(error);

    return {
      formattedError,
      readableMessage,
      originalError: error,
    };
  };
};

export default {
  formatErrorForLogging,
  safeLogError,
  logErrorSafely,
  getReadableErrorMessage,
  createErrorHandler,
};
