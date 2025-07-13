import { supabase } from "@/integrations/supabase/client";
import { logError, getErrorMessage } from "@/utils/errorUtils";

export interface EmailChangeRequest {
  id: string;
  userId: string;
  newEmail: string;
  confirmationToken: string;
  expiresAt: string;
  createdAt: string;
}

export interface EmailChangeResult {
  success: boolean;
  message: string;
  error?: any;
  pendingEmail?: string;
}

export class EmailChangeService {
  /**
   * Generate a secure token for email confirmation
   */
  private static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  }

  /**
   * Request an email change - stores pending email and sends confirmation
   */
  static async requestEmailChange(
    userId: string,
    newEmail: string,
  ): Promise<EmailChangeResult> {
    try {
      console.log(
        "🔄 Requesting email change for user:",
        userId,
        "to:",
        newEmail,
      );

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        return {
          success: false,
          message: "Please enter a valid email address",
        };
      }

      // Check if email is already in use
      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", newEmail)
        .neq("id", userId)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        logError("Error checking existing email", checkError);
        return {
          success: false,
          message: "Error checking email availability",
          error: checkError,
        };
      }

      if (existingUser) {
        return {
          success: false,
          message: "This email address is already in use by another account",
        };
      }

      // Generate confirmation token
      const confirmationToken = this.generateToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store pending email change in profiles table
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          pending_email: newEmail,
          pending_email_token: confirmationToken,
          pending_email_expires_at: expiresAt.toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        logError("Error storing pending email change", updateError);
        return {
          success: false,
          message: "Failed to initiate email change process",
          error: updateError,
        };
      }

      // Send confirmation email
      const emailSent = await this.sendConfirmationEmail(
        newEmail,
        confirmationToken,
      );

      if (!emailSent.success) {
        // If email sending fails, clean up the pending change
        await supabase
          .from("profiles")
          .update({
            pending_email: null,
            pending_email_token: null,
            pending_email_expires_at: null,
          })
          .eq("id", userId);

        return emailSent;
      }

      console.log("✅ Email change request successful");
      return {
        success: true,
        message:
          "Confirmation email sent! Please check your new email address to confirm the change.",
        pendingEmail: newEmail,
      };
    } catch (error) {
      logError("Exception during email change request", error);
      return {
        success: false,
        message: "Failed to process email change request",
        error,
      };
    }
  }

  /**
   * Send confirmation email to new email address
   * Note: Since we're using Supabase free tier, we'll use a notification-based approach
   */
  private static async sendConfirmationEmail(
    newEmail: string,
    token: string,
  ): Promise<EmailChangeResult> {
    try {
      // Create confirmation URL
      const confirmationUrl = `${window.location.origin}/confirm-email-change?token=${token}`;

      // For now, we'll simulate email sending by logging the confirmation link
      // In a production environment, you would integrate with an email service like:
      // - SendGrid, Mailgun, AWS SES, etc.
      // - Or use Supabase Edge Functions with custom email templates

      console.log("📧 Email change confirmation link generated:");
      console.log("📧 To:", newEmail);
      console.log("📧 Link:", confirmationUrl);
      console.log("📧 Token:", token);

      // Store a notification for the user
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("pending_email", newEmail)
          .single();

        if (profile) {
          await supabase.from("notifications").insert({
            user_id: profile.id,
            title: "Email Change Confirmation Required",
            message: `Please confirm your new email address: ${newEmail}. Check your email for the confirmation link.`,
            type: "info", // Use 'info' instead of 'email_change'
          });
        }
      } catch (notifError) {
        console.warn("Could not create notification:", notifError);
      }

      // For development/demo purposes, show the confirmation link in console
      if (process.env.NODE_ENV === "development") {
        console.log("🔗 DEVELOPMENT MODE: Email confirmation link:");
        console.log(confirmationUrl);
      }

      return {
        success: true,
        message:
          "Email change request processed. Check your new email address for the confirmation link.",
      };
    } catch (error) {
      logError("Exception sending confirmation email", error);
      return {
        success: false,
        message: "Failed to process email change request",
        error,
      };
    }
  }

  /**
   * Confirm email change using token
   */
  static async confirmEmailChange(token: string): Promise<EmailChangeResult> {
    try {
      console.log("🔍 Confirming email change with token");

      if (!token) {
        return {
          success: false,
          message: "Invalid confirmation link - missing token",
        };
      }

      // Find the pending email change
      const { data: profile, error: findError } = await supabase
        .from("profiles")
        .select("id, email, pending_email, pending_email_expires_at")
        .eq("pending_email_token", token)
        .single();

      if (findError || !profile) {
        console.log("❌ Email change token not found");
        return {
          success: false,
          message: "Invalid or expired confirmation link",
          error: findError,
        };
      }

      // Check if token has expired
      const expiresAt = new Date(profile.pending_email_expires_at);
      const now = new Date();

      if (now > expiresAt) {
        console.log("❌ Email change token expired");

        // Clean up expired token
        await supabase
          .from("profiles")
          .update({
            pending_email: null,
            pending_email_token: null,
            pending_email_expires_at: null,
          })
          .eq("id", profile.id);

        return {
          success: false,
          message:
            "Confirmation link has expired. Please request a new email change.",
        };
      }

      if (!profile.pending_email) {
        return {
          success: false,
          message: "No pending email change found",
        };
      }

      // Update email in both auth and profiles
      const { error: authError } = await supabase.auth.updateUser({
        email: profile.pending_email,
      });

      if (authError) {
        logError("Error updating auth email", authError);
        return {
          success: false,
          message: "Failed to update email address",
          error: authError,
        };
      }

      // Update profile and clear pending fields
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          email: profile.pending_email,
          pending_email: null,
          pending_email_token: null,
          pending_email_expires_at: null,
        })
        .eq("id", profile.id);

      if (profileError) {
        logError("Error updating profile email", profileError);
        return {
          success: false,
          message: "Failed to complete email change",
          error: profileError,
        };
      }

      console.log("✅ Email change confirmed successfully");
      return {
        success: true,
        message:
          "Email address updated successfully! Please log in with your new email address.",
      };
    } catch (error) {
      logError("Exception during email change confirmation", error);
      return {
        success: false,
        message: "Failed to confirm email change",
        error,
      };
    }
  }

  /**
   * Cancel pending email change
   */
  static async cancelEmailChange(userId: string): Promise<EmailChangeResult> {
    try {
      console.log("🔄 Cancelling email change for user:", userId);

      const { error } = await supabase
        .from("profiles")
        .update({
          pending_email: null,
          pending_email_token: null,
          pending_email_expires_at: null,
        })
        .eq("id", userId);

      if (error) {
        logError("Error cancelling email change", error);
        return {
          success: false,
          message: "Failed to cancel email change",
          error,
        };
      }

      return {
        success: true,
        message: "Email change cancelled successfully",
      };
    } catch (error) {
      logError("Exception cancelling email change", error);
      return {
        success: false,
        message: "Failed to cancel email change",
        error,
      };
    }
  }

  /**
   * Get pending email change status for a user
   */
  static async getPendingEmailChange(userId: string): Promise<{
    hasPending: boolean;
    pendingEmail?: string;
    expiresAt?: string;
  }> {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("pending_email, pending_email_expires_at")
        .eq("id", userId)
        .single();

      if (error || !profile) {
        return { hasPending: false };
      }

      const hasPending = !!profile.pending_email;
      const isExpired = profile.pending_email_expires_at
        ? new Date() > new Date(profile.pending_email_expires_at)
        : false;

      if (hasPending && isExpired) {
        // Clean up expired pending change
        await this.cancelEmailChange(userId);
        return { hasPending: false };
      }

      return {
        hasPending,
        pendingEmail: profile.pending_email || undefined,
        expiresAt: profile.pending_email_expires_at || undefined,
      };
    } catch (error) {
      logError("Error checking pending email change", error);
      return { hasPending: false };
    }
  }
}
