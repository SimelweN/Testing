/**
 * Comprehensive error message utility to prevent "[object Object]" errors
 * across the entire frontend application
 */

export interface SafeErrorInfo {
  message: string;
  code?: string;
  type: string;
  details?: any;
}

/**
 * Safely extracts a user-friendly error message from any error object or value
 * @param error - The error to extract message from
 * @param fallback - Default message if extraction fails
 * @returns Safe string message, never "[object Object]"
 */
export function getSafeErrorMessage(
  error: any,
  fallback: string = "An error occurred"
): string {
  // Handle null/undefined
  if (error == null) {
    return fallback;
  }

  // Handle string values
  if (typeof error === "string") {
    if (error === "[object Object]" || error.trim() === "") {
      return fallback;
    }
    return error;
  }

  // Handle Error objects and error-like objects
  if (typeof error === "object") {
    // Priority order for extracting meaningful error messages
    const candidates = [
      error.message,
      error.details,
      error.hint,
      error.description,
      error.error,
      error.reason,
    ];

    for (const candidate of candidates) {
      if (
        typeof candidate === "string" &&
        candidate.trim() !== "" &&
        candidate !== "[object Object]"
      ) {
        return candidate;
      }
    }

    // Try to use error code if available
    if (error.code) {
      return `Error code: ${String(error.code)}`;
    }

    // Try to use error name
    if (error.name && typeof error.name === "string") {
      return `${error.name}${error.message ? `: ${error.message}` : ""}`;
    }

    // Last resort: try JSON stringify safely
    try {
      const jsonStr = JSON.stringify(error, Object.getOwnPropertyNames(error));
      if (jsonStr && jsonStr !== "{}" && jsonStr !== "[object Object]") {
        // Limit length to avoid overwhelming users
        return jsonStr.length > 200 ? `${jsonStr.slice(0, 200)}...` : jsonStr;
      }
    } catch {
      // JSON stringify failed, use fallback
    }
  }

  // Handle other primitive types
  if (typeof error === "number" || typeof error === "boolean") {
    return `${typeof error}: ${String(error)}`;
  }

  // Final fallback
  return fallback;
}

/**
 * Extracts detailed error information for logging/debugging
 * @param error - The error to analyze
 * @returns SafeErrorInfo object with extracted details
 */
export function getErrorInfo(error: any): SafeErrorInfo {
  const message = getSafeErrorMessage(error);
  
  return {
    message,
    code: error?.code ? String(error.code) : undefined,
    type: error?.constructor?.name || typeof error,
    details: typeof error === "object" ? error : undefined,
  };
}

/**
 * Safe error logging function that prevents "[object Object]" in console
 * @param context - Context string describing where the error occurred
 * @param error - The error to log
 * @param additionalData - Optional additional data for debugging
 */
export function logError(
  context: string,
  error: any,
  additionalData?: Record<string, any>
): void {
  const errorInfo = getErrorInfo(error);
  
  console.error(`[${context}] Error:`, {
    message: errorInfo.message,
    type: errorInfo.type,
    code: errorInfo.code,
    details: errorInfo.details,
    additional: additionalData,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Creates a safe error message for toast notifications
 * @param error - The error to display
 * @param prefix - Optional prefix text
 * @returns Safe message string for user display
 */
export function createToastErrorMessage(
  error: any,
  prefix?: string
): string {
  const message = getSafeErrorMessage(error, "Something went wrong");
  return prefix ? `${prefix}: ${message}` : message;
}

/**
 * Safe template literal helper for error messages
 * @param error - The error to include in template
 * @returns Safe string for template literals
 */
export function safeErrorString(error: any): string {
  return getSafeErrorMessage(error, "Unknown error");
}

/**
 * Validates and sanitizes error strings from API responses
 * @param errorString - Potential error string from API
 * @returns Clean, safe error string
 */
export function sanitizeApiError(errorString: any): string {
  if (typeof errorString !== "string") {
    return getSafeErrorMessage(errorString, "API error");
  }
  
  // Check for common problematic patterns
  if (
    errorString === "[object Object]" ||
    errorString === "undefined" ||
    errorString === "null" ||
    errorString.trim() === ""
  ) {
    return "API request failed";
  }
  
  return errorString;
}

/**
 * Enhanced error boundary error message extraction
 * @param error - Error from error boundary
 * @param errorInfo - Error info from React error boundary
 * @returns User-friendly error message
 */
export function getErrorBoundaryMessage(error: Error, errorInfo?: any): string {
  const baseMessage = getSafeErrorMessage(error, "Application error");
  
  // Don't expose technical stack traces to users
  if (baseMessage.includes("at ") || baseMessage.includes("webpack")) {
    return "An unexpected error occurred. Please refresh the page and try again.";
  }
  
  return baseMessage;
}

// Export convenience function for common usage patterns
export const errorUtils = {
  safe: getSafeErrorMessage,
  info: getErrorInfo,
  log: logError,
  toast: createToastErrorMessage,
  template: safeErrorString,
  api: sanitizeApiError,
  boundary: getErrorBoundaryMessage,
};
