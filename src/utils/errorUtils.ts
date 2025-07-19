import { PostgrestError } from "@supabase/supabase-js";

/**
 * Enhanced error logging with proper serialization
 */
export const logError = (context: string, error: unknown) => {
  // Extract readable error message
  const getReadableMessage = (err: unknown): string => {
    if (err instanceof Error) {
      return err.message;
    }
    if (typeof err === "string") {
      return err;
    }
    if (typeof err === "object" && err !== null) {
      const errorObj = err as any;
      // Check common error message properties
      if (errorObj.message) return String(errorObj.message);
      if (errorObj.error) return String(errorObj.error);
      if (errorObj.details) return String(errorObj.details);
      // Try to stringify safely
      try {
        return JSON.stringify(err);
      } catch {
        return "[Complex Error Object]";
      }
    }
    return String(err);
  };

  // Comprehensive error object for better debugging
  const errorInfo = {
    context,
    timestamp: new Date().toISOString(),
    message: getReadableMessage(error),
    name: error instanceof Error ? error.name : undefined,
    code: (error as any)?.code || (error as any)?.error_code,
    details: (error as any)?.details,
    hint: (error as any)?.hint,
    stack: error instanceof Error ? error.stack : undefined,
    type: typeof error,
    constructor: error?.constructor?.name,
    isNetworkError: isNetworkError(error),
    isAuthError: isAuthError(error),
    isDatabaseError: isDatabaseError(error),
  };

  // Use structured logging
  console.error(`[${context}]`, errorInfo);

  // Also log a simple version for quick scanning
  const simpleMessage = `${context}: ${errorInfo.message}${errorInfo.code ? ` (${errorInfo.code})` : ""}`;
  console.error(simpleMessage);

  return errorInfo;
};

/**
 * Get a user-friendly error message
 */
export const getErrorMessage = (
  error: unknown,
  fallback: string = "An error occurred",
): string => {
  if (!error) return fallback;

  // Handle Supabase/Postgres errors
  if (isDatabaseError(error)) {
    const pgError = error as PostgrestError;

    // Common database error codes
    switch (pgError.code) {
      case "23505":
        return "This record already exists";
      case "23503":
        return "Referenced record not found";
      case "42P01":
        return "Database table not found";
      case "PGRST116":
        return "Record not found";
      case "PGRST301":
        return "Unauthorized access";
      default:
        return pgError.message || pgError.hint || fallback;
    }
  }

  // Handle network errors
  if (isNetworkError(error)) {
    if (error instanceof Error) {
      if (error.message.includes("Failed to fetch")) {
        return "Network connection failed. Please check your internet connection and try again.";
      }
      if (error.message.includes("timeout")) {
        return "Request timed out. Please try again.";
      }
      if (error.message.includes("CORS")) {
        return "Network access blocked. Please refresh the page and try again.";
      }
    }
    return "Network error. Please check your connection and try again.";
  }

  // Handle auth errors
  if (isAuthError(error)) {
    const authError = error as any;
    switch (authError.message || authError.error_description) {
      case "Invalid login credentials":
        return "Invalid email or password";
      case "Email not confirmed":
        return "Please verify your email address";
      case "Too many requests":
        return "Too many attempts. Please wait a moment and try again";
      default:
        return (
          authError.message ||
          authError.error_description ||
          "Authentication error"
        );
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === "string") {
    return error;
  }

  // Last resort
  return fallback;
};

/**
 * Check if error is a network-related error
 */
export const isNetworkError = (error: unknown): boolean => {
  if (!error) return false;

  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();

  return (
    message.includes("failed to fetch") ||
    message.includes("network error") ||
    message.includes("timeout") ||
    message.includes("cors") ||
    message.includes("connection") ||
    message.includes("unreachable") ||
    (error as any)?.code === "NETWORK_ERROR" ||
    (error as any)?.name === "NetworkError"
  );
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: unknown): boolean => {
  if (!error) return false;

  const errorObj = error as any;
  return (
    errorObj?.name === "AuthError" ||
    errorObj?.error === "invalid_grant" ||
    errorObj?.error === "unauthorized" ||
    (typeof errorObj?.message === "string" &&
      (errorObj.message.includes("Invalid login credentials") ||
        errorObj.message.includes("Email not confirmed") ||
        errorObj.message.includes("JWT") ||
        errorObj.message.includes("token")))
  );
};

/**
 * Check if error is a database error
 */
export const isDatabaseError = (error: unknown): boolean => {
  if (!error) return false;

  const errorObj = error as any;
  return (
    errorObj?.code || // Postgres error codes
    errorObj?.error_code || // Alternative error code field
    (typeof errorObj?.message === "string" &&
      errorObj.message.includes("PGRST")) ||
    errorObj?.details !== undefined ||
    errorObj?.hint !== undefined
  );
};

/**
 * Retry operation with exponential backoff for network errors
 */
export const retryWithExponentialBackoff = async <T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    retryCondition?: (error: unknown) => boolean;
  } = {},
): Promise<T> => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    retryCondition = isNetworkError,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry if this isn't a retryable error
      if (!retryCondition(error)) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

      console.warn(
        `Attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${delay}ms`,
        {
          error: getErrorMessage(error),
          attempt: attempt + 1,
          delay,
        },
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

/**
 * Create a timeout promise that rejects after specified duration
 */
export const createTimeoutPromise = (
  timeoutMs: number,
  errorMessage?: string,
) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(
        errorMessage || `Operation timed out after ${timeoutMs}ms`,
      );
      (error as any).isTimeout = true;
      reject(error);
    }, timeoutMs);
  });
};

/**
 * Race a promise against a timeout
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string,
): Promise<T> => {
  return Promise.race([promise, createTimeoutPromise(timeoutMs, errorMessage)]);
};

/**
 * Legacy function aliases for backward compatibility
 */
export const logDatabaseError = logError;
export const getUserErrorMessage = getErrorMessage;
export const logQueryDebug = (context: string, query: any, result?: any) => {
  if (import.meta.env.DEV) {
    console.log(`[Query Debug] ${context}:`, { query, result });
  }
};
