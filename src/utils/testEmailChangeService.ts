import { supabase } from "@/integrations/supabase/client";

/**
 * Test the email service functionality for troubleshooting
 */
export async function testEmailService() {
  try {
    console.log("🧪 Testing email service...");

    // First test - Check if send-email function is accessible
    const { data: testResult, error: testError } =
      await supabase.functions.invoke("send-email", {
        body: { test: true },
      });

    if (testError) {
      console.error("❌ Email function not accessible:", testError);
      return {
        success: false,
        error: "Email function not accessible",
        details: testError,
      };
    }

    if (!testResult?.success) {
      console.error("❌ Email configuration error:", testResult);
      return {
        success: false,
        error: "Email configuration error",
        details: testResult,
      };
    }

    console.log("✅ Email service configuration test passed");

    // Second test - Try sending an actual test email
    try {
      const { data: emailResult, error: emailError } =
        await supabase.functions.invoke("send-email", {
          body: {
            to: "test@example.com",
            subject: "Test Email from ReBooked Solutions",
            html: "<p>This is a test email to verify email service functionality.</p>",
            text: "This is a test email to verify email service functionality.",
          },
        });

      if (emailError) {
        console.error("❌ Test email failed:", emailError);
        return {
          success: false,
          error: "Test email failed",
          details: emailError,
        };
      }

      if (!emailResult?.success) {
        console.error("❌ Test email service error:", emailResult);
        return {
          success: false,
          error: "Test email service error",
          details: emailResult,
        };
      }

      console.log("✅ Test email sent successfully");
      return {
        success: true,
        message: "Email service is working correctly",
        details: emailResult,
      };
    } catch (emailException) {
      console.error("❌ Exception during test email:", emailException);
      return {
        success: false,
        error: "Exception during test email",
        details: emailException,
      };
    }
  } catch (exception) {
    console.error("❌ Exception during email service test:", exception);
    return {
      success: false,
      error: "Exception during email service test",
      details: exception,
    };
  }
}

/**
 * Get email service status and configuration info
 */
export async function getEmailServiceStatus() {
  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: { test: true },
    });

    if (error) {
      return {
        status: "error",
        message: "Email service not accessible",
        error,
      };
    }

    if (data?.success) {
      return {
        status: "ready",
        message: "Email service is configured and ready",
        config: data.config || {},
      };
    } else {
      return {
        status: "misconfigured",
        message: "Email service has configuration issues",
        error: data?.error || "Unknown configuration error",
      };
    }
  } catch (exception) {
    return {
      status: "error",
      message: "Exception checking email service status",
      error: exception,
    };
  }
}
