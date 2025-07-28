import { supabase } from "@/integrations/supabase/client";
import { logError, getErrorMessage } from "@/utils/errorUtils";

export interface VerificationResult {
  success: boolean;
  message: string;
  method?: string;
  session?: any;
  error?: any;
}

export interface VerificationParams {
  token_hash?: string | null;
  token?: string | null;
  type?: string | null;
  code?: string | null;
  error_code?: string | null;
  error_description?: string | null;
}

export class EmailVerificationService {
  /**
   * Extract verification parameters from URL
   */
  static extractParamsFromUrl(
    searchParams: URLSearchParams,
  ): VerificationParams {
    return {
      token_hash: searchParams.get("token_hash"),
      token: searchParams.get("token"),
      type: searchParams.get("type"),
      code: searchParams.get("code"),
      error_code: searchParams.get("error_code"),
      error_description: searchParams.get("error_description"),
    };
  }

  /**
   * Check if there are any error parameters in the URL
   */
  static hasErrorParams(params: VerificationParams): boolean {
    return !!(params.error_code || params.error_description);
  }

  /**
   * Verify email using token hash (modern Supabase auth)
   */
  static async verifyWithTokenHash(
    token_hash: string,
    type: string,
  ): Promise<VerificationResult> {
    try {
      console.log("🔐 Attempting token_hash verification");

      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      });

      if (error) {
        logError("Token hash verification error", error);
        return {
          success: false,
          message: getErrorMessage(error),
          method: "token_hash",
          error,
        };
      }

      if (data.session) {
        console.log("✅ Token hash verification successful");
        return {
          success: true,
          message: "Email verified successfully using token hash",
          method: "token_hash",
          session: data.session,
        };
      }

      return {
        success: false,
        message: "Token hash verification did not return a session",
        method: "token_hash",
      };
    } catch (error) {
      logError("Token hash verification exception", error);
      return {
        success: false,
        message: getErrorMessage(error),
        method: "token_hash",
        error,
      };
    }
  }

  /**
   * Verify email using legacy token (older Supabase auth)
   */
  static async verifyWithLegacyToken(
    token: string,
    type: string,
  ): Promise<VerificationResult> {
    try {
      console.log("🔐 Attempting legacy token verification");

      const { data, error } = await supabase.auth.verifyOtp({
        token,
        type: type as any,
      });

      if (error) {
        logError("Legacy token verification error", error);
        return {
          success: false,
          message: getErrorMessage(error),
          method: "legacy_token",
          error,
        };
      }

      if (data.session) {
        console.log("✅ Legacy token verification successful");
        return {
          success: true,
          message: "Email verified successfully using legacy token",
          method: "legacy_token",
          session: data.session,
        };
      }

      return {
        success: false,
        message: "Legacy token verification did not return a session",
        method: "legacy_token",
      };
    } catch (error) {
      logError("Legacy token verification exception", error);
      return {
        success: false,
        message: getErrorMessage(error),
        method: "legacy_token",
        error,
      };
    }
  }

  /**
   * Verify email using PKCE code exchange
   */
  static async verifyWithCodeExchange(
    url: string,
  ): Promise<VerificationResult> {
    try {
      console.log("🔐 Attempting PKCE code exchange");

      const { data, error } = await supabase.auth.exchangeCodeForSession(url);

      if (error) {
        logError("Code exchange error", error);
        return {
          success: false,
          message: getErrorMessage(error),
          method: "code_exchange",
          error,
        };
      }

      if (data.session) {
        console.log("✅ Code exchange successful");
        return {
          success: true,
          message: "Email verified successfully using code exchange",
          method: "code_exchange",
          session: data.session,
        };
      }

      return {
        success: false,
        message: "Code exchange did not return a session",
        method: "code_exchange",
      };
    } catch (error) {
      logError("Code exchange exception", error);
      return {
        success: false,
        message: getErrorMessage(error),
        method: "code_exchange",
        error,
      };
    }
  }

  /**
   * Check if user already has an active session
   */
  static async checkExistingSession(): Promise<VerificationResult> {
    try {
      console.log("🔍 Checking existing session");

      const { data: sessionData, error } = await supabase.auth.getSession();

      if (error) {
        logError("Session check error", error);
        return {
          success: false,
          message: getErrorMessage(error),
          method: "session_check",
          error,
        };
      }

      if (sessionData.session) {
        console.log("✅ User already has active session");
        return {
          success: true,
          message: "You are already verified and logged in",
          method: "existing_session",
          session: sessionData.session,
        };
      }

      return {
        success: false,
        message: "No existing session found",
        method: "session_check",
      };
    } catch (error) {
      logError("Session check exception", error);
      return {
        success: false,
        message: getErrorMessage(error),
        method: "session_check",
        error,
      };
    }
  }

  /**
   * Main verification method that tries all available methods
   */
  static async verifyEmail(
    params: VerificationParams,
    currentUrl: string,
  ): Promise<VerificationResult> {
    console.log("🔍 Starting comprehensive email verification");
    console.log("📍 URL:", currentUrl);
    console.log("📍 Params:", params);

    // Check for errors first
    if (this.hasErrorParams(params)) {
      const errorMessage =
        params.error_description || "Email verification failed";
      console.error("❌ Verification error from URL:", {
        error_code: params.error_code,
        error_description: params.error_description,
      });

      return {
        success: false,
        message: errorMessage,
        method: "url_error",
        error: {
          code: params.error_code,
          description: params.error_description,
        },
      };
    }

    // Method 1: Token hash verification (preferred)
    if (params.token_hash && params.type) {
      const result = await this.verifyWithTokenHash(
        params.token_hash,
        params.type,
      );
      if (result.success) {
        return result;
      }
      console.log("Token hash verification failed, trying other methods...");
    }

    // Method 2: Legacy token verification
    if (params.token && params.type) {
      const result = await this.verifyWithLegacyToken(
        params.token,
        params.type,
      );
      if (result.success) {
        return result;
      }
      console.log("Legacy token verification failed, trying other methods...");
    }

    // Method 3: PKCE code exchange
    if (params.code || currentUrl.includes("code=")) {
      const result = await this.verifyWithCodeExchange(currentUrl);
      if (result.success) {
        return result;
      }
      console.log("Code exchange failed, trying other methods...");
    }

    // Method 4: Check existing session
    const sessionResult = await this.checkExistingSession();
    if (sessionResult.success) {
      return sessionResult;
    }

    // If all methods fail
    return {
      success: false,
      message:
        "Unable to verify email with any available method. Please try registering again or contact support.",
      method: "all_failed",
    };
  }

  /**
   * Get a user-friendly error message based on the error type
   */
  static getFormattedErrorMessage(result: VerificationResult): string {
    if (result.success) {
      return result.message;
    }

    const error = result.error;
    let baseMessage = "Email verification failed. ";

    if (
      error?.message?.includes("expired") ||
      error?.code === "token_expired"
    ) {
      return (
        baseMessage +
        "The verification link has expired. Please register again."
      );
    }

    if (
      error?.message?.includes("already confirmed") ||
      error?.code === "email_already_confirmed"
    ) {
      return (
        baseMessage +
        "This email has already been verified. You can now log in."
      );
    }

    if (
      error?.message?.includes("invalid") ||
      error?.code === "invalid_token"
    ) {
      return (
        baseMessage + "The verification link is invalid. Please register again."
      );
    }

    if (error?.message?.includes("Email not confirmed")) {
      return (
        baseMessage +
        "Your email is not yet confirmed. Please check your email for the confirmation link."
      );
    }

    if (
      error?.message?.includes("not found") ||
      error?.code === "user_not_found"
    ) {
      return baseMessage + "User not found. Please register again.";
    }

    return (
      baseMessage + (result.message || "Please try again or contact support.")
    );
  }

  /**
   * Resend verification email for unverified users
   */
  static async resendVerificationEmail(
    email: string,
  ): Promise<{ success: boolean; message: string; error?: any }> {
    try {
      console.log("📧 Resending verification email to:", email);

      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        logError("Error resending verification email", error);
        return {
          success: false,
          message: `Failed to resend verification email: ${error.message}`,
          error,
        };
      }

      console.log("✅ Verification email sent successfully");
      return {
        success: true,
        message:
          "Verification email sent! Please check your inbox and spam folder.",
      };
    } catch (exception) {
      logError("Exception while resending verification email", exception);
      return {
        success: false,
        message: `Failed to resend verification email: ${getErrorMessage(exception)}`,
        error: exception,
      };
    }
  }
}
