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
   * Send confirmation email to new email address using Supabase send-email function
   */
  private static async sendConfirmationEmail(
    newEmail: string,
    token: string,
  ): Promise<EmailChangeResult> {
    try {
      // Create confirmation URL
      const confirmationUrl = `${window.location.origin}/confirm-email-change?token=${token}`;

      // Create email HTML content
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Confirm Email Change</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #44ab83; margin: 0; font-size: 28px;">ReBooked Solutions</h1>
              <p style="color: #666; margin: 5px 0 0 0;">Confirm Your Email Change</p>
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #333; margin: 0 0 15px 0; font-size: 22px;">Email Change Request</h2>
              <p style="color: #666; margin: 0; line-height: 1.6;">
                You have requested to change your email address to <strong>${newEmail}</strong>.
                Please click the button below to confirm this change.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}"
                 style="display: inline-block; background-color: #44ab83; color: white; padding: 12px 30px;
                        text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                Confirm Email Change
              </a>
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              <p style="color: #999; font-size: 14px; margin: 0; line-height: 1.6;">
                If you didn't request this email change, please ignore this message.
                This link will expire in 24 hours for security purposes.
              </p>
              <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
                If the button doesn't work, copy and paste this link: ${confirmationUrl}
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      const emailText = `
ReBooked Solutions - Confirm Email Change

You have requested to change your email address to ${newEmail}.

Please click the following link to confirm this change:
${confirmationUrl}

If you didn't request this email change, please ignore this message.
This link will expire in 24 hours for security purposes.

ReBooked Solutions
      `;

      // Send email using Supabase send-email function
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: newEmail,
          subject: "Confirm Your Email Change - ReBooked Solutions",
          html: emailHtml,
          text: emailText,
        },
      });

      if (error) {
        console.error("❌ Email sending failed:", error);
        logError("Email sending failed", error);
        return {
          success: false,
          message: "Error sending confirmation email. Please try again later.",
          error,
        };
      }

      if (!data?.success) {
        console.error("❌ Email service returned error:", data);
        return {
          success: false,
          message: "Error sending confirmation email. Please try again later.",
          error: data?.error || "Unknown email service error",
        };
      }

      console.log("✅ Confirmation email sent successfully to:", newEmail);

      // Store a notification for the user as backup
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("pending_email", newEmail)
          .single();

        if (profile) {
          const { NotificationService } = await import('./notificationService');
          await NotificationService.createNotification({
            userId: profile.id,
            type: "info",
            title: "Email Change Confirmation Sent",
            message: `Confirmation email sent to ${newEmail}. Please check your email and click the confirmation link.`,
          });
        }
      } catch (notifError) {
        console.warn("Could not create notification:", notifError);
      }

      return {
        success: true,
        message:
          "Confirmation email sent! Please check your email for the confirmation link.",
      };
    } catch (error) {
      logError("Exception sending confirmation email", error);
      return {
        success: false,
        message: "Error sending confirmation email. Please try again later.",
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
