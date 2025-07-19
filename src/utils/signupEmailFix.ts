import { supabase } from "@/integrations/supabase/client";

/**
 * Diagnostic and fix for signup email confirmation issues
 */
export class SignupEmailFix {
  /**
   * Test if the email service is working
   */
  static async testEmailService(): Promise<{
    working: boolean;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: { test: true },
      });

      if (error) {
        console.error("❌ Email service test failed:", error);
        return { working: false, error: error.message };
      }

      if (data?.success) {
        console.log("✅ Email service is working");
        return { working: true };
      }

      console.error("❌ Email service returned unsuccessful result:", data);
      return { working: false, error: "Email service configuration issue" };
    } catch (error) {
      console.error("❌ Email service test exception:", error);
      return {
        working: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send a test welcome email to verify functionality
   */
  static async sendTestWelcomeEmail(
    email: string,
    name: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: email,
          from: "noreply@rebookedsolutions.co.za",
          subject: "[TEST] Welcome to ReBooked Solutions! 📚",
          html: this.generateTestWelcomeHTML(name),
          text: this.generateTestWelcomeText(name),
        },
      });

      if (error) {
        console.error("❌ Test welcome email failed:", error);
        return { success: false, error: error.message };
      }

      if (data?.success) {
        console.log("✅ Test welcome email sent successfully");
        return { success: true };
      }

      console.error("❌ Test welcome email unsuccessful:", data);
      return { success: false, error: data?.error || "Email send failed" };
    } catch (error) {
      console.error("❌ Test welcome email exception:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Enhanced signup with email confirmation handling
   */
  static async enhancedSignup(
    email: string,
    password: string,
    name: string,
  ): Promise<{
    success: boolean;
    needsVerification?: boolean;
    emailWarning?: boolean;
    error?: string;
  }> {
    try {
      console.log("🔄 Starting enhanced signup for:", email);

      // Step 1: Create the user account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/verify`,
        },
      });

      if (error) {
        console.error("❌ Signup failed:", error);
        return { success: false, error: error.message };
      }

      // Step 2: Check what happened
      if (data.user && !data.session) {
        // Email verification is enabled and working
        console.log("✅ Signup successful - email verification required");
        return { success: true, needsVerification: true };
      }

      if (data.user && data.session) {
        // Email verification is disabled, user is logged in
        console.log("✅ Signup successful - email verification disabled");

        // Step 3: Send welcome email since Supabase verification is disabled
        const emailResult = await this.sendWelcomeEmail(email, name);

        if (emailResult.success) {
          console.log("✅ Welcome email sent");
          return { success: true, needsVerification: false };
        } else {
          console.warn("⚠️ Welcome email failed:", emailResult.error);
          return {
            success: true,
            needsVerification: false,
            emailWarning: true,
          };
        }
      }

      // Unexpected result
      console.warn("⚠️ Unexpected signup result:", data);
      return { success: false, error: "Unexpected signup result" };
    } catch (error) {
      console.error("❌ Enhanced signup exception:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Signup failed",
      };
    }
  }

  /**
   * Send welcome email for new users
   */
  private static async sendWelcomeEmail(
    email: string,
    name: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First test if email service is working
      const serviceTest = await this.testEmailService();
      if (!serviceTest.working) {
        console.error("❌ Email service not working:", serviceTest.error);
        return {
          success: false,
          error: `Email service issue: ${serviceTest.error}`,
        };
      }

      // Send the welcome email
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: email,
          from: "noreply@rebookedsolutions.co.za",
          subject: "Welcome to ReBooked Solutions! 📚",
          html: this.generateWelcomeHTML(name),
          text: this.generateWelcomeText(name),
        },
      });

      if (error) {
        console.error("❌ Welcome email failed:", error);
        return { success: false, error: error.message };
      }

      if (data?.success) {
        console.log("✅ Welcome email sent successfully");
        return { success: true };
      }

      console.error("❌ Welcome email unsuccessful:", data);
      return { success: false, error: data?.error || "Email send failed" };
    } catch (error) {
      console.error("❌ Welcome email exception:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private static generateWelcomeHTML(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to ReBooked Solutions</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            background-color: #f3fef7; 
            padding: 20px; 
            color: #1f4e3d; 
            margin: 0;
          }
          .container { 
            max-width: 500px; 
            margin: auto; 
            background-color: #ffffff; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); 
          }
          .welcome-box { 
            background: #d1fae5; 
            border: 1px solid #10b981; 
            padding: 15px; 
            border-radius: 5px; 
            margin: 20px 0; 
            text-align: center;
          }
          .btn { 
            display: inline-block; 
            padding: 12px 20px; 
            background-color: #3ab26f; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin-top: 20px; 
            font-weight: bold; 
          }
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

          <div style="text-align: center;">
            <a href="${window.location.origin}/books" class="btn">Start Browsing Books</a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #6b7280; text-align: center;">
            <strong>Thank you for joining ReBooked Solutions!</strong><br>
            For assistance: support@rebookedsolutions.co.za<br>
            <em>"Pre-Loved Pages, New Adventures"</em>
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private static generateWelcomeText(name: string): string {
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

  private static generateTestWelcomeHTML(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>TEST - Welcome to ReBooked Solutions</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f3fef7; padding: 20px; color: #1f4e3d; }
          .container { max-width: 500px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
          .test-box { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🧪 TEST EMAIL - Welcome to ReBooked Solutions!</h1>
          
          <div class="test-box">
            <strong>⚠️ This is a test email - Email service is working!</strong>
          </div>

          <p>Hi ${name}!</p>

          <p>This is a test email to verify that the ReBooked Solutions email service is functioning correctly.</p>

          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Service: Supabase Edge Function</li>
            <li>Provider: Brevo SMTP</li>
            <li>Time: ${new Date().toISOString()}</li>
          </ul>

          <p>If you received this email, the signup email confirmation system should be working properly.</p>
        </div>
      </body>
      </html>
    `;
  }

  private static generateTestWelcomeText(name: string): string {
    return `
      TEST EMAIL - Welcome to ReBooked Solutions!

      Hi ${name}!

      This is a test email to verify that the ReBooked Solutions email service is functioning correctly.

      Test Details:
      - Service: Supabase Edge Function
      - Provider: Brevo SMTP
      - Time: ${new Date().toISOString()}

      If you received this email, the signup email confirmation system should be working properly.
    `;
  }
}

export const signupEmailFix = SignupEmailFix;
