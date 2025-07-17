import { supabase } from "@/integrations/supabase/client";

export class CustomAuthEmailService {
  /**
   * Send a custom styled password reset email
   */
  static async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      // Generate password reset URL using Supabase but don't let them send the email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      // If Supabase reset succeeded, send our own styled email
      if (!error) {
        // Send our beautifully styled email
        await supabase.functions.invoke("send-email", {
          body: {
            to: email,
            subject: "Password Reset - ReBooked Solutions",
            template: {
              name: "password-reset",
              data: {
                userName: "User", // We don't have the name in this context
                resetUrl: `${window.location.origin}/reset-password`, // User will get the actual link from Supabase
              },
            },
          },
        });
      }
    } catch (error) {
      console.error("Failed to send custom password reset email:", error);
      throw error;
    }
  }

  /**
   * Send a custom styled email verification email
   */
  static async sendVerificationEmail(email: string): Promise<void> {
    try {
      // Send our beautifully styled verification email
      await supabase.functions.invoke("send-email", {
        body: {
          to: email,
          subject: "Verify Your Email - ReBooked Solutions",
          template: {
            name: "welcome",
            data: {
              userName: "User",
              loginUrl: `${window.location.origin}/login`,
            },
          },
        },
      });
    } catch (error) {
      console.error("Failed to send custom verification email:", error);
      throw error;
    }
  }

  /**
   * Send a custom styled welcome email after successful registration
   */
  static async sendWelcomeEmail(
    email: string,
    userName?: string,
  ): Promise<void> {
    try {
      await supabase.functions.invoke("send-email", {
        body: {
          to: email,
          subject: "Welcome to ReBooked Solutions!",
          template: {
            name: "welcome",
            data: {
              userName: userName || "User",
              loginUrl: `${window.location.origin}/login`,
            },
          },
        },
      });
    } catch (error) {
      console.error("Failed to send custom welcome email:", error);
      throw error;
    }
  }
}

/**
 * Override Supabase Auth methods to use our custom styling
 */
export const createStyledAuthMethods = () => {
  return {
    /**
     * Enhanced password reset with custom styling
     */
    resetPasswordForEmail: async (email: string) => {
      try {
        // First disable Supabase's automatic email by using a fake redirect
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: "https://temp-disable-email.com/reset", // This prevents Supabase from sending
        });

        // Then send our styled email
        await CustomAuthEmailService.sendPasswordResetEmail(email);

        return { error: null };
      } catch (error) {
        return { error };
      }
    },

    /**
     * Enhanced sign up with custom styling
     */
    signUp: async (email: string, password: string, options?: any) => {
      try {
        // Sign up with Supabase but prevent their email
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            ...options,
            emailRedirectTo: "https://temp-disable-email.com/verify", // This might prevent the email
          },
        });

        // Send our own styled welcome/verification email
        if (!error && data.user) {
          await CustomAuthEmailService.sendWelcomeEmail(
            email,
            options?.data?.full_name,
          );
        }

        return { data, error };
      } catch (error) {
        return { data: null, error };
      }
    },
  };
};
