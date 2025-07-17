import { supabase } from "../lib/supabase";

export async function debugTemplateRender(
  templateName: string,
  data: any = {},
) {
  console.log("Debugging template render...", templateName);

  try {
    const { data: result, error } = await supabase.functions.invoke(
      "debug-email-template",
      {
        body: {
          templateName,
          data,
        },
      },
    );

    if (error) {
      console.error("Debug template render failed:", error);
      throw error;
    }

    console.log("Template rendered:", result);
    return { success: true, rendered: result };
  } catch (error) {
    console.error("Debug template error:", error);
    return { success: false, error };
  }
}

export async function testUpdatedEmailTemplate(email: string) {
  console.log("Testing updated email template...");

  try {
    // Test the welcome template specifically to see new styling
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: email,
        subject: "Test Updated Template - Welcome Email",
        template: {
          name: "welcome",
          data: {
            userName: "Test User",
            loginUrl: "https://app.rebookedsolutions.co.za/login",
          },
        },
      },
    });

    if (error) {
      console.error("Email test failed:", error);
      throw error;
    }

    console.log("Email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Test email error:", error);
    return { success: false, error };
  }
}

export async function testUpdatedOrderConfirmationTemplate(email: string) {
  console.log("Testing updated order confirmation template...");

  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: email,
        subject: "Test Updated Template - Order Confirmation",
        template: {
          name: "order-confirmation",
          data: {
            orderNumber: "TEST_123456",
            customerName: "Test Customer",
            items: [
              { name: "Physics Textbook", quantity: 1, price: 250 },
              { name: "Math Workbook", quantity: 2, price: 150 },
            ],
            total: "550.00",
            estimatedDelivery: "2-3 business days",
          },
        },
      },
    });

    if (error) {
      console.error("Order confirmation test failed:", error);
      throw error;
    }

    console.log("Order confirmation email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Test email error:", error);
    return { success: false, error };
  }
}

// Test function to send a simple HTML email with new styling manually
export async function testManualStyledEmail(email: string) {
  console.log("Testing manual styled email...");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Test Updated Styling</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f3fef7;
          padding: 20px;
          color: #1f4e3d;
        }
        .container {
          max-width: 500px;
          margin: auto;
          background-color: #ffffff;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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
        .link {
          color: #3ab26f;
        }
        .header {
          background: #3ab26f;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 10px 10px 0 0;
          margin: -30px -30px 20px -30px;
        }
        .footer {
          background: #f3fef7;
          color: #1f4e3d;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          line-height: 1.5;
          margin: 30px -30px -30px -30px;
          border-radius: 0 0 10px 10px;
          border-top: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Test Email with Updated Styling!</h1>
        </div>
        
        <h2>Hello!</h2>
        <p>This is a test email to verify that the new ReBooked Solutions styling is working correctly.</p>
        
        <p>If you're seeing this email with:</p>
        <ul>
          <li>Light green background</li>
          <li>White container with rounded corners</li>
          <li>Green header and buttons</li>
          <li>Professional footer with signature</li>
        </ul>
        
        <p>Then the updated email templates are working perfectly! 🎉</p>
        
        <a href="https://rebookedsolutions.co.za" class="btn">Test Button</a>
        
        <div class="footer">
          <p><strong>This is an automated message from ReBooked Solutions.</strong><br>
          Please do not reply to this email.</p>
          <p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>
          Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p>
          <p>T&Cs apply.</p>
          <p><em>"Pre-Loved Pages, New Adventures"</em></p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: email,
        subject: "Test Manual Styled Email - Updated ReBooked Solutions Design",
        html: html,
        text: `Test Email - Updated ReBooked Solutions Design

Hello!

This is a test email to verify that the new ReBooked Solutions styling is working correctly.

If you received this email, the email system is working properly!

This is an automated message from ReBooked Solutions. Please do not reply to this email.
For assistance, contact: support@rebookedsolutions.co.za
Visit us at: https://rebookedsolutions.co.za
T&Cs apply.
"Pre-Loved Pages, New Adventures"`,
      },
    });

    if (error) {
      console.error("Manual styled email test failed:", error);
      throw error;
    }

    console.log("Manual styled email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Test email error:", error);
    return { success: false, error };
  }
}
