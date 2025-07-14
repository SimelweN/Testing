/**
 * Network connectivity and error handling utilities
 */

/**
 * Check if the error is likely a network connectivity issue
 */
export const isNetworkError = (error: unknown): boolean => {
  if (!error) return false;

  const errorMessage =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();

  return (
    errorMessage.includes("failed to fetch") ||
    errorMessage.includes("network error") ||
    errorMessage.includes("connection error") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("net::") ||
    (error instanceof TypeError && errorMessage.includes("fetch"))
  );
};

/**
 * Get a user-friendly error message from any error
 */
export const getUserFriendlyErrorMessage = (
  error: unknown,
  context = "",
): string => {
  if (!error) return "An unknown error occurred";

  // Check for network errors first
  if (isNetworkError(error)) {
    return "Network connection error. Please check your internet connection and try again.";
  }

  // Handle specific error types
  if (error instanceof Error) {
    const message = error.message;

    // Database errors
    if (message.includes("PGRST")) {
      return "Database connection issue. Please try again in a moment.";
    }

    // Auth errors
    if (message.includes("auth") || message.includes("unauthorized")) {
      return "Authentication error. Please log in again.";
    }

    // Permission errors
    if (message.includes("permission") || message.includes("forbidden")) {
      return "You don't have permission to perform this action.";
    }

    // Validation errors
    if (message.includes("validation") || message.includes("invalid")) {
      return "Invalid data provided. Please check your input and try again.";
    }

    return message;
  }

  // Handle objects with message properties
  if (typeof error === "object" && error !== null) {
    const errorObj = error as any;

    if (errorObj.message) {
      return String(errorObj.message);
    }

    if (errorObj.error) {
      return String(errorObj.error);
    }

    if (errorObj.details) {
      return String(errorObj.details);
    }
  }

  return `An error occurred${context ? ` while ${context}` : ""}. Please try again.`;
};

/**
 * Enhanced console.error that logs detailed error information
 */
export const logDetailedError = (
  context: string,
  error: unknown,
  additionalData?: any,
) => {
  const timestamp = new Date().toISOString();
  const userAgent =
    typeof navigator !== "undefined" ? navigator.userAgent : "Unknown";
  const url = typeof window !== "undefined" ? window.location.href : "Unknown";

  const errorInfo = {
    timestamp,
    context,
    url,
    userAgent,
    error: {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
    additionalData,
    isNetworkError: isNetworkError(error),
  };

  console.error(`[${context}] Error occurred:`, errorInfo);

  return errorInfo;
};

/**
 * Retry a function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
  context = "",
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on certain errors
      if (!isNetworkError(error)) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(
        `[${context}] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

/**
 * Check if the browser is online
 */
export const isOnline = (): boolean => {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
};

/**
 * Simple connectivity test
 */
export const testConnectivity = async (): Promise<boolean> => {
  if (!isOnline()) {
    return false;
  }

  try {
    // Try to fetch a small resource from the same domain
    const response = await fetch("/placeholder.svg", {
      method: "HEAD",
      cache: "no-cache",
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
};
