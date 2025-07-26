import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ApiErrorDetails {
  code?: string;
  message: string;
  statusCode?: number;
  hint?: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  data: T | null;
  error: ApiErrorDetails | null;
  needsRetry: boolean;
  shouldLogout: boolean;
}

export class ApiErrorHandler {
  /**
   * Enhanced error handling for Supabase API calls
   */
  static async handleApiCall<T>(
    apiCall: () => Promise<{ data: T; error: any }>,
    context: string = "API call",
    showUserError: boolean = true
  ): Promise<ApiResponse<T>> {
    try {
      const result = await apiCall();
      
      if (result.error) {
        return this.processError(result.error, context, showUserError);
      }
      
      return {
        data: result.data,
        error: null,
        needsRetry: false,
        shouldLogout: false
      };
    } catch (error) {
      console.error(`[ApiErrorHandler] Unexpected error in ${context}:`, error instanceof Error ? error.message : (typeof error === 'object' ? JSON.stringify(error, null, 2) : String(error)));
      
      const errorDetails: ApiErrorDetails = {
        message: error instanceof Error ? error.message : "Unknown error occurred",
        code: "UNEXPECTED_ERROR"
      };
      
      if (showUserError) {
        toast.error("Unexpected error", {
          description: "Please try again or contact support if the issue persists."
        });
      }
      
      return {
        data: null,
        error: errorDetails,
        needsRetry: true,
        shouldLogout: false
      };
    }
  }

  /**
   * Process and categorize errors from Supabase
   */
  private static processError(
    error: any,
    context: string,
    showUserError: boolean
  ): ApiResponse {
    const errorDetails: ApiErrorDetails = {
      code: error.code || error.error_code || "UNKNOWN_ERROR",
      message: error.message || "An error occurred",
      statusCode: error.status || error.statusCode,
      hint: error.hint,
      details: error.details
    };

    console.error(`[ApiErrorHandler] Error in ${context}:`, JSON.stringify({
      code: errorDetails.code,
      message: errorDetails.message,
      statusCode: errorDetails.statusCode,
      hint: errorDetails.hint
    }, null, 2));

    // Determine if this is a retry-able error
    const needsRetry = this.isRetryableError(errorDetails);
    const shouldLogout = this.isAuthError(errorDetails);

    if (showUserError) {
      this.showUserFriendlyError(errorDetails, context);
    }

    return {
      data: null,
      error: errorDetails,
      needsRetry,
      shouldLogout
    };
  }

  /**
   * Check if error is retryable (network, timeout, server errors)
   */
  private static isRetryableError(error: ApiErrorDetails): boolean {
    const retryableCodes = [
      "NETWORK_ERROR",
      "TIMEOUT",
      "503", // Service Unavailable
      "502", // Bad Gateway
      "504", // Gateway Timeout
      "429", // Too Many Requests
    ];

    const retryableMessages = [
      "network error",
      "timeout", 
      "connection error",
      "server error",
      "service unavailable"
    ];

    return (
      retryableCodes.includes(error.code || "") ||
      retryableCodes.includes(String(error.statusCode)) ||
      retryableMessages.some(msg => 
        error.message.toLowerCase().includes(msg)
      )
    );
  }

  /**
   * Check if error requires logout/re-authentication
   */
  private static isAuthError(error: ApiErrorDetails): boolean {
    const authCodes = [
      "PGRST301", // JWT expired
      "PGRST302", // JWT invalid
      "401", // Unauthorized
      "403" // Forbidden
    ];

    const authMessages = [
      "jwt expired",
      "jwt malformed", 
      "invalid jwt",
      "authentication required",
      "session expired",
      "unauthorized"
    ];

    return (
      authCodes.includes(error.code || "") ||
      authCodes.includes(String(error.statusCode)) ||
      authMessages.some(msg => 
        error.message.toLowerCase().includes(msg)
      )
    );
  }

  /**
   * Show appropriate user-facing error message
   */
  private static showUserFriendlyError(error: ApiErrorDetails, context: string) {
    if (this.isAuthError(error)) {
      toast.error("Session expired", {
        description: "Please log in again to continue.",
        duration: 6000
      });
      return;
    }

    if (this.isRetryableError(error)) {
      toast.error("Connection issue", {
        description: "Please check your internet connection and try again.",
        duration: 5000
      });
      return;
    }

    // Handle specific error codes with user-friendly messages
    switch (error.code) {
      case "PGRST116":
        toast.error("Data not found", {
          description: "The requested information could not be found."
        });
        break;
      
      case "23505":
        toast.error("Duplicate entry", {
          description: "This information already exists in the system."
        });
        break;
      
      case "23503":
        toast.error("Invalid reference", {
          description: "This operation cannot be completed due to data dependencies."
        });
        break;
      
      case "42501":
        toast.error("Permission denied", {
          description: "You don't have permission to perform this action."
        });
        break;
      
      case "42P01":
        toast.error("System maintenance", {
          description: "This feature is temporarily unavailable. Please try again later."
        });
        break;

      default:
        // Generic error with context
        toast.error(`Error in ${context}`, {
          description: error.message || "An unexpected error occurred.",
          duration: 4000
        });
    }
  }

  /**
   * Retry API call with exponential backoff
   */
  static async retryApiCall<T>(
    apiCall: () => Promise<{ data: T; error: any }>,
    maxRetries: number = 3,
    context: string = "API call"
  ): Promise<ApiResponse<T>> {
    let lastError: ApiErrorDetails | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[ApiErrorHandler] Attempt ${attempt}/${maxRetries} for ${context}`);
      
      const result = await this.handleApiCall(apiCall, context, attempt === maxRetries);
      
      if (!result.error || !result.needsRetry) {
        return result;
      }
      
      lastError = result.error;
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`[ApiErrorHandler] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return {
      data: null,
      error: lastError,
      needsRetry: false,
      shouldLogout: lastError ? this.isAuthError(lastError) : false
    };
  }

  /**
   * Check session validity and refresh if needed
   */
  static async ensureValidSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("[ApiErrorHandler] Session check failed:", error);
        return false;
      }
      
      if (!session) {
        console.log("[ApiErrorHandler] No active session");
        return false;
      }
      
      // Check if token is close to expiring (within 5 minutes)
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - now;
      
      if (timeUntilExpiry < 300) { // Less than 5 minutes
        console.log("[ApiErrorHandler] Token expiring soon, refreshing...");
        
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error("[ApiErrorHandler] Session refresh failed:", refreshError);
          return false;
        }
        
        console.log("[ApiErrorHandler] Session refreshed successfully");
      }
      
      return true;
    } catch (error) {
      console.error("[ApiErrorHandler] Session validation error:", error);
      return false;
    }
  }
}

// Helper function for common API patterns
export async function safeApiCall<T>(
  apiCall: () => Promise<{ data: T; error: any }>,
  options: {
    context?: string;
    showUserError?: boolean;
    maxRetries?: number;
    requireAuth?: boolean;
  } = {}
): Promise<ApiResponse<T>> {
  const {
    context = "API call",
    showUserError = true,
    maxRetries = 1,
    requireAuth = true
  } = options;

  // Check authentication if required
  if (requireAuth) {
    const sessionValid = await ApiErrorHandler.ensureValidSession();
    if (!sessionValid) {
      const authError: ApiErrorDetails = {
        code: "SESSION_INVALID",
        message: "Authentication required"
      };
      
      if (showUserError) {
        toast.error("Session expired", {
          description: "Please log in again to continue."
        });
      }
      
      return {
        data: null,
        error: authError,
        needsRetry: false,
        shouldLogout: true
      };
    }
  }

  if (maxRetries > 1) {
    return ApiErrorHandler.retryApiCall(apiCall, maxRetries, context);
  } else {
    return ApiErrorHandler.handleApiCall(apiCall, context, showUserError);
  }
}
