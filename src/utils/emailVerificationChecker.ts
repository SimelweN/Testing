import { supabase } from "@/integrations/supabase/client";

export interface EmailVerificationStatus {
  isEnabled: boolean;
  isWorking: boolean;
  error?: string;
  message: string;
  recommendation: string;
}

/**
 * Check if email verification is enabled and working in Supabase
 */
export class EmailVerificationChecker {
  /**
   * Quick test to see if email verification is enabled
   */
  static async checkEmailVerificationStatus(): Promise<EmailVerificationStatus> {
    try {
      console.log("🔍 Checking email verification status...");

      // Create a test signup with a fake email to see the behavior
      const testEmail = `test-${Date.now()}@example-nonexistent.com`;
      const testPassword = "TestPassword123!";

      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: { name: "Test User" },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      // Clean up immediately - don't leave test users
      if (data.user?.id) {
        try {
          // This might not work from client side, but try anyway
          await supabase.auth.admin.deleteUser(data.user.id);
        } catch (cleanupError) {
          console.warn("Could not cleanup test user (expected):", cleanupError);
        }
      }

      if (error) {
        // Check if error indicates email verification issues
        if (
          error.message.includes("email") ||
          error.message.includes("smtp") ||
          error.message.includes("mail")
        ) {
          return {
            isEnabled: true,
            isWorking: false,
            error: error.message,
            message:
              "Email verification is enabled but has configuration issues",
            recommendation:
              "Check Supabase email settings and SMTP configuration",
          };
        }

        return {
          isEnabled: false,
          isWorking: false,
          error: error.message,
          message: "Email verification test failed",
          recommendation: "Check Supabase project configuration",
        };
      }

      // Analyze the response
      if (data.user && !data.session) {
        // Expected behavior for email verification enabled
        return {
          isEnabled: true,
          isWorking: true,
          message: "Email verification is enabled and working correctly",
          recommendation:
            "Users must click verification link in email to complete signup",
        };
      }

      if (data.user && data.session) {
        // Email verification is disabled - user gets immediate session
        return {
          isEnabled: false,
          isWorking: false,
          message: "Email verification is DISABLED in Supabase settings",
          recommendation:
            "Enable email confirmation in Supabase Dashboard → Authentication → Settings → Email Confirmation",
        };
      }

      return {
        isEnabled: false,
        isWorking: false,
        message: "Unexpected signup behavior",
        recommendation: "Review Supabase authentication configuration",
      };
    } catch (error) {
      console.error("❌ Email verification check failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      return {
        isEnabled: false,
        isWorking: false,
        error: errorMessage,
        message: "Could not check email verification status",
        recommendation: "Verify Supabase connection and authentication setup",
      };
    }
  }

  /**
   * Get user-friendly explanation of email verification issues
   */
  static getEmailVerificationGuidance(status: EmailVerificationStatus): {
    title: string;
    description: string;
    steps: string[];
    severity: "success" | "warning" | "error";
  } {
    if (status.isEnabled && status.isWorking) {
      return {
        title: "Email Verification Working",
        description:
          "Email verification is properly configured and functioning.",
        steps: [
          "Users will receive verification emails after signup",
          "They must click the link to activate their account",
          "Check spam folders if emails are not received",
        ],
        severity: "success",
      };
    }

    if (!status.isEnabled) {
      return {
        title: "Email Verification Disabled",
        description:
          "Email verification is turned off in your Supabase project.",
        steps: [
          "Go to Supabase Dashboard",
          "Navigate to Authentication → Settings",
          "Enable 'Email Confirmation'",
          "Configure email templates if needed",
          "Save settings and test again",
        ],
        severity: "warning",
      };
    }

    if (status.isEnabled && !status.isWorking) {
      return {
        title: "Email Verification Configuration Issue",
        description: "Email verification is enabled but not working properly.",
        steps: [
          "Check Supabase email settings",
          "Verify SMTP configuration",
          "Check email provider settings",
          "Review Supabase logs for email errors",
          "Test with different email addresses",
        ],
        severity: "error",
      };
    }

    return {
      title: "Email Verification Status Unknown",
      description: "Could not determine email verification status.",
      steps: [
        "Check Supabase connection",
        "Verify authentication configuration",
        "Review project settings",
        "Contact support if issues persist",
      ],
      severity: "error",
    };
  }

  /**
   * Quick check specifically for the "Error sending confirmation email" issue
   */
  static async diagnoseConfirmationEmailError(): Promise<{
    likely_cause: string;
    fix_instructions: string[];
    severity: "high" | "medium" | "low";
  }> {
    try {
      const status = await this.checkEmailVerificationStatus();

      if (!status.isEnabled) {
        return {
          likely_cause: "Email verification is disabled in Supabase settings",
          fix_instructions: [
            "Enable email confirmation in Supabase Dashboard",
            "Go to Authentication → Settings → Email Confirmation",
            "Turn on 'Enable email confirmations'",
            "Save and test signup again",
          ],
          severity: "high",
        };
      }

      if (status.isEnabled && !status.isWorking) {
        return {
          likely_cause: "Email service configuration issue",
          fix_instructions: [
            "Check Supabase SMTP settings",
            "Verify email provider configuration",
            "Check for email delivery errors in Supabase logs",
            "Test with a different email provider if needed",
          ],
          severity: "high",
        };
      }

      if (status.isEnabled && status.isWorking) {
        return {
          likely_cause: "Intermittent email delivery issue",
          fix_instructions: [
            "Check spam folders",
            "Try with different email addresses",
            "Check email provider's delivery logs",
            "Monitor for temporary email service outages",
          ],
          severity: "medium",
        };
      }

      return {
        likely_cause: "Unknown email verification issue",
        fix_instructions: [
          "Run full diagnostic test",
          "Check Supabase project configuration",
          "Review authentication settings",
          "Contact Supabase support if issue persists",
        ],
        severity: "medium",
      };
    } catch (error) {
      return {
        likely_cause: "Could not diagnose email verification issue",
        fix_instructions: [
          "Check internet connection",
          "Verify Supabase project access",
          "Review browser console for errors",
          "Try the diagnostic again",
        ],
        severity: "low",
      };
    }
  }
}

export const emailVerificationChecker = EmailVerificationChecker;
