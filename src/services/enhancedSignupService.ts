import { supabase } from "@/integrations/supabase/client";
import { emailService } from "./emailService";

export interface SignupResult {
  success: boolean;
  user?: any;
  session?: any;
  needsVerification?: boolean;
  emailWarning?: boolean;
  error?: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

/**
 * Enhanced signup service that handles both Supabase auth and custom email verification
 */
export class EnhancedSignupService {
  /**
   * Attempt signup with multiple fallback strategies
   */
  static async signup(data: SignupData): Promise<SignupResult> {
    const { name, email, password } = data;

    try {
      console.log("🔄 Starting enhanced signup process for:", email);

      // Step 1: Try Supabase auth signup
      const authResult = await this.attemptSupabaseSignup(data);

      if (authResult.success) {
        // Step 2: If Supabase signup successful, check if email verification is needed
        if (authResult.user && !authResult.session) {
          console.log(
            "✅ Supabase signup successful - email verification required",
          );
          return {
            success: true,
            user: authResult.user,
            needsVerification: true,
          };
        } else if (authResult.user && authResult.session) {
          console.log(
            "✅ Supabase signup successful - auto-login (email confirmation disabled)",
          );
          // Send welcome email since Supabase email confirmation is disabled
          await this.sendWelcomeEmail(email, name);
          return {
            success: true,
            user: authResult.user,
            session: authResult.session,
            needsVerification: false,
          };
        }
      }

      // Step 3: If Supabase failed, return error
      return {
        success: false,
        error: authResult.error || "Registration failed",
      };
    } catch (error) {
      console.error("❌ Enhanced signup failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Registration failed",
      };
    }
  }

  /**
   * Attempt Supabase authentication signup
   */
  private static async attemptSupabaseSignup(
    data: SignupData,
  ): Promise<SignupResult> {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("❌ Supabase signup error:", error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        user: authData.user,
        session: authData.session,
      };
    } catch (error) {
      console.error("❌ Supabase signup exception:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Supabase signup failed",
      };
    }
  }

  /**
   * Send custom welcome email when Supabase email confirmation is disabled
   */
  private static async sendWelcomeEmail(
    email: string,
    name: string,
  ): Promise<void> {
    try {
      console.log("📧 Sending welcome email to:", email);

      const emailResult = await emailService.sendEmail({
        to: email,
        from: "noreply@rebookedsolutions.co.za",
        subject: "Welcome to ReBooked Solutions! 📚",
        html: this.generateWelcomeEmailHTML(name),
        text: this.generateWelcomeEmailText(name),
      });

      if (emailResult.success) {
        console.log("✅ Welcome email sent successfully");
      } else {
        console.warn("⚠️ Welcome email failed:", emailResult.error);
      }
    } catch (error) {
      console.warn("⚠️ Welcome email exception:", error);
      // Don't fail signup for email issues
    }
  }

  /**
   * Send custom verification email as fallback
   */
  static async sendCustomVerificationEmail(
    email: string,
    name: string,
    verificationToken: string,
  ): Promise<boolean> {
    try {
      console.log("📧 Sending custom verification email to:", email);

      const verificationUrl = `${window.location.origin}/verify?token=${verificationToken}&email=${encodeURIComponent(email)}`;

      const emailResult = await emailService.sendEmail({
        to: email,
        from: "noreply@rebookedsolutions.co.za",
        subject: "Please verify your email - ReBooked Solutions",
        html: this.generateVerificationEmailHTML(name, verificationUrl),
        text: this.generateVerificationEmailText(name, verificationUrl),
      });

      return emailResult.success;
    } catch (error) {
      console.error("❌ Custom verification email failed:", error);
      return false;
    }
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(email: string): Promise<boolean> {
    try {
      console.log("🔄 Resending verification email for:", email);

      // Try Supabase resend first
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
      });

      if (!error) {
        console.log("✅ Supabase verification email resent");
        return true;
      }

      console.warn("⚠️ Supabase resend failed:", error.message);
      return false;
    } catch (error) {
      console.error("❌ Resend verification email failed:", error);
      return false;
    }
  }

  private static generateWelcomeEmailHTML(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to ReBooked Solutions</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f3fef7; padding: 20px; color: #1f4e3d; }
          .container { max-width: 500px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
          .welcome-box { background: #d1fae5; border: 1px solid #10b981; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .btn { display: inline-block; padding: 12px 20px; background-color: #3ab26f; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎉 Welcome to ReBooked Solutions!</h1>
          
          <div class="welcome-box">
            <strong>✅ Your account has been created successfully!</strong>
          </div>

          <p>Hi ${name}!</p>

          <p>Welcome to South Africa's premier textbook marketplace! Your account is now active and you can:</p>

          <ul>
            <li>📚 Browse thousands of affordable textbooks</li>
            <li>💰 Sell your textbooks to other students</li>
            <li>🚚 Enjoy convenient doorstep delivery</li>
            <li>🎓 Connect with students at your university</li>
          </ul>

          <a href="${window.location.origin}/books" class="btn">Start Browsing Books</a>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #6b7280;">
            <strong>Thank you for joining ReBooked Solutions!</strong><br>
            For assistance: support@rebookedsolutions.co.za<br>
            <em>"Pre-Loved Pages, New Adventures"</em>
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private static generateWelcomeEmailText(name: string): string {
    return `
      Welcome to ReBooked Solutions!

      Hi ${name}!

      Your account has been created successfully! Welcome to South Africa's premier textbook marketplace.

      You can now:
      - Browse thousands of affordable textbooks
      - Sell your textbooks to other students  
      - Enjoy convenient doorstep delivery
      - Connect with students at your university

      Visit ${window.location.origin}/books to start browsing!

      Thank you for joining ReBooked Solutions!
      For assistance: support@rebookedsolutions.co.za

      "Pre-Loved Pages, New Adventures"
    `;
  }

  private static generateVerificationEmailHTML(
    name: string,
    verificationUrl: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email - ReBooked Solutions</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f3fef7; padding: 20px; color: #1f4e3d; }
          .container { max-width: 500px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
          .verify-box { background: #dbeafe; border: 1px solid #3b82f6; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .btn { display: inline-block; padding: 12px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📧 Please Verify Your Email</h1>
          
          <div class="verify-box">
            <strong>🔐 Email verification required</strong>
          </div>

          <p>Hi ${name}!</p>

          <p>To complete your registration with ReBooked Solutions, please verify your email address by clicking the button below:</p>

          <a href="${verificationUrl}" class="btn">Verify My Email</a>

          <p><strong>This link will expire in 24 hours.</strong></p>

          <p>If the button doesn't work, copy and paste this link:</p>
          <p style="background: #f0f0f0; padding: 10px; border-radius: 5px; word-break: break-all;">
            ${verificationUrl}
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #6b7280;">
            If you didn't create an account, please ignore this email.<br>
            <strong>ReBooked Solutions</strong><br>
            support@rebookedsolutions.co.za
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private static generateVerificationEmailText(
    name: string,
    verificationUrl: string,
  ): string {
    return `
      Please Verify Your Email - ReBooked Solutions

      Hi ${name}!

      To complete your registration with ReBooked Solutions, please verify your email address by visiting:

      ${verificationUrl}

      This link will expire in 24 hours.

      If you didn't create an account, please ignore this email.

      ReBooked Solutions
      support@rebookedsolutions.co.za
    `;
  }
}

export const enhancedSignupService = EnhancedSignupService;
