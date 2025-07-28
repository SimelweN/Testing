import { supabase } from "@/integrations/supabase/client";
import { logError, getErrorMessage } from "@/utils/errorUtils";

export interface LoginResult {
  success: boolean;
  data?: any;
  error?: any;
  requiresVerification?: boolean;
  userExists?: boolean;
  message: string;
  actionRequired?:
    | "verify_email"
    | "reset_password"
    | "register"
    | "contact_support";
}

export interface VerificationCheckResult {
  userExists: boolean;
  emailConfirmed: boolean;
  error?: any;
}

export class EnhancedAuthService {
  /**
   * Check if a user exists and if their email is confirmed
   */
  static async checkUserVerificationStatus(
    email: string,
  ): Promise<VerificationCheckResult> {
    try {
      console.log("🔍 Checking user verification status for:", email);

      // Check if user exists in profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, created_at")
        .eq("email", email)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        // Error other than "not found"
        logError("Error checking user profile", profileError);
        return {
          userExists: false,
          emailConfirmed: false,
          error: profileError,
        };
      }

      if (!profile) {
        console.log("❌ User not found in profiles table");
        return {
          userExists: false,
          emailConfirmed: false,
        };
      }

      console.log("✅ User found in profiles table");

      // Since we can't access admin functions from the client side,
      // we'll make an educated guess based on profile creation time
      const createdAt = new Date(profile.created_at);
      const now = new Date();
      const daysSinceCreation =
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

      // Recent profiles are more likely to have verification issues
      const likelyUnverified = daysSinceCreation <= 7;

      return {
        userExists: true,
        emailConfirmed: !likelyUnverified,
      };
    } catch (error) {
      logError("Error checking user verification status", error);
      return {
        userExists: false,
        emailConfirmed: false,
        error,
      };
    }
  }

  /**
   * Check if user is likely unverified by looking at profile creation time
   */
  static async checkIfLikelyUnverified(email: string): Promise<boolean> {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("created_at")
        .eq("email", email)
        .single();

      if (!profile) {
        return false;
      }

      // If the profile was created recently (within the last 7 days),
      // it's more likely to be an unverified email issue
      const createdAt = new Date(profile.created_at);
      const now = new Date();
      const daysSinceCreation =
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

      console.log("📅 Profile created", daysSinceCreation, "days ago");

      // Recent profiles are more likely to have verification issues
      return daysSinceCreation <= 7;
    } catch (error) {
      console.log("⚠️ Could not check profile creation time");
      return true; // Default to suggesting verification if we can't check
    }
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
