import { toast } from "sonner";

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
}

export interface NetworkErrorInfo {
  isNetworkError: boolean;
  isAuthError: boolean;
  isRetryable: boolean;
  errorMessage: string;
  suggestedAction: string;
}

/**
 * Analyzes errors to determine if they're network-related and retryable
 */
export function analyzeError(error: any): NetworkErrorInfo {
  const errorMessage = error?.message || error?.details || String(error);
  const errorLower = errorMessage.toLowerCase();

  // Check for network errors
  const isNetworkError = 
    errorLower.includes('failed to fetch') ||
    errorLower.includes('network error') ||
    errorLower.includes('connection') ||
    errorLower.includes('timeout') ||
    errorLower.includes('cors') ||
    error?.code === 'NETWORK_ERROR';

  // Check for auth errors
  const isAuthError = 
    errorLower.includes('auth') ||
    errorLower.includes('unauthorized') ||
    errorLower.includes('invalid_grant') ||
    error?.code === '401';

  // Determine if retryable
  const isRetryable = isNetworkError || (isAuthError && errorLower.includes('fetch'));

  let suggestedAction = "Please try again";
  if (isNetworkError) {
    suggestedAction = "Check your internet connection and try again";
  } else if (isAuthError) {
    suggestedAction = "Please refresh the page and log in again";
  }

  return {
    isNetworkError,
    isAuthError,
    isRetryable,
    errorMessage,
    suggestedAction
  };
}

/**
 * Retry function with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true
  } = options;

  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      const errorInfo = analyzeError(error);
      
      // Don't retry if it's not a retryable error
      if (!errorInfo.isRetryable) {
        throw error;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay for next attempt
      const delay = exponentialBackoff 
        ? retryDelay * Math.pow(2, attempt)
        : retryDelay;
      
      console.warn(`[NetworkErrorHandler] Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, errorInfo.errorMessage);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All retries failed
  const errorInfo = analyzeError(lastError);
  console.error(`[NetworkErrorHandler] All ${maxRetries + 1} attempts failed:`, errorInfo);
  
  // Show user-friendly error message
  toast.error("Connection Error", {
    description: errorInfo.suggestedAction,
    duration: 8000,
  });
  
  throw lastError;
}

/**
 * Handle Supabase-specific errors with appropriate user feedback
 */
export function handleSupabaseError(error: any, context?: string): void {
  const errorInfo = analyzeError(error);
  
  console.error(`[SupabaseError] ${context || 'Operation failed'}:`, {
    message: errorInfo.errorMessage,
    isNetworkError: errorInfo.isNetworkError,
    isAuthError: errorInfo.isAuthError,
    fullError: error
  });

  if (errorInfo.isNetworkError) {
    toast.error("Network Connection Issue", {
      description: "Please check your internet connection and try again.",
      duration: 8000,
    });
  } else if (errorInfo.isAuthError) {
    toast.error("Authentication Error", {
      description: "Please refresh the page and log in again.",
      duration: 8000,
    });
  } else {
    toast.error("Service Error", {
      description: errorInfo.errorMessage || "An unexpected error occurred.",
      duration: 6000,
    });
  }
}

/**
 * Enhanced error extractor that handles various error formats
 */
export function extractErrorMessage(error: any): string {
  if (!error) return "Unknown error";
  
  // Try different properties where error messages might be stored
  const possibleMessages = [
    error.message,
    error.details,
    error.hint,
    error.error_description,
    error.description
  ];
  
  for (const msg of possibleMessages) {
    if (msg && typeof msg === 'string') {
      return msg;
    }
  }
  
  // If it's a string, return it
  if (typeof error === 'string') {
    return error;
  }
  
  // Try to extract from nested error
  if (error.error && typeof error.error === 'object') {
    return extractErrorMessage(error.error);
  }
  
  // Last resort - stringify
  try {
    return JSON.stringify(error);
  } catch {
    return "Error details unavailable";
  }
}

export default {
  analyzeError,
  withRetry,
  handleSupabaseError,
  extractErrorMessage
};
