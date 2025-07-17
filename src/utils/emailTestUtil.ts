import { emailService } from "../services/emailService";

export async function testEmailConfiguration() {
  try {
    console.log("Testing email configuration...");

    // Test the connection using the test endpoint
    const testResponse = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ test: true }),
      },
    );

    const testResult = await testResponse.json();

    if (testResult.success) {
      console.log("✅ Email configuration test passed:", testResult);
      return {
        success: true,
        message: "Email service is properly configured",
        config: testResult.config,
      };
    } else {
      console.error("❌ Email configuration test failed:", testResult);
      return {
        success: false,
        error: testResult.error,
      };
    }
  } catch (error) {
    console.error("❌ Email configuration test error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function sendTestEmail(to: string) {
  try {
    console.log(`Sending test email to ${to}...`);

    const response = await emailService.sendEmail({
      to,
      subject: "Test Email from ReBooked Solutions",
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify that the email service is working correctly.</p>
        <p>If you received this email, the configuration is working properly!</p>
        <p>Best regards,<br>ReBooked Solutions Team</p>
      `,
      text: `
        Test Email
        
        This is a test email to verify that the email service is working correctly.
        
        If you received this email, the configuration is working properly!
        
        Best regards,
        ReBooked Solutions Team
      `,
    });

    console.log("✅ Test email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Test email failed:", error);
    throw error;
  }
}

export async function sendTestTemplateEmail(to: string) {
  try {
    console.log(`Sending test template email to ${to}...`);

    const response = await emailService.sendWelcomeEmail(to, {
      userName: "Test User",
      loginUrl: "https://app.rebookedsolutions.co.za/login",
    });

    console.log("✅ Test template email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Test template email failed:", error);
    throw error;
  }
}

// Utility to validate all available templates
export function getAvailableTemplates() {
  return {
    templates: Object.values(
      emailService.constructor.prototype.EMAIL_TEMPLATES || {},
    ),
    count: Object.keys(emailService.constructor.prototype.EMAIL_TEMPLATES || {})
      .length,
  };
}
