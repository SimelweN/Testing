import { supabase } from "../lib/supabase";

export async function sendDirectStyledTestEmail(email: string) {
  console.log("Sending direct styled test email...");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>ReBooked Solutions - Template Test</title>
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
        .info-box {
          background: #f3fef7;
          border: 1px solid #3ab26f;
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
        }
        .total {
          font-weight: bold;
          font-size: 18px;
          color: #3ab26f;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Order Confirmed!</h1>
          <p>Thank you for your purchase, Test Customer!</p>
        </div>
        
        <h2>Order #TEST_123456</h2>
        <p>Your order has been confirmed and is being processed.</p>
        
        <h3>Order Details:</h3>
        <div style="border-bottom: 1px solid #ddd; padding: 10px 0;">
          <strong>Physics Textbook</strong><br>
          Quantity: 1 × R250<br>
          Subtotal: R250.00
        </div>
        <div style="border-bottom: 1px solid #ddd; padding: 10px 0;">
          <strong>Math Workbook</strong><br>
          Quantity: 2 × R150<br>
          Subtotal: R300.00
        </div>
        
        <div class="total">
          <p>Total: R550.00</p>
        </div>
        
        <p><strong>Estimated Delivery:</strong> 2-3 business days</p>
        
        <p>We'll send you another email when your order ships with tracking information.</p>
        
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

  const text = `
Order Confirmed!

Thank you for your purchase, Test Customer!

Order #TEST_123456

Your order has been confirmed and is being processed.

Order Details:
Physics Textbook - Quantity: 1 × R250 = R250.00
Math Workbook - Quantity: 2 × R150 = R300.00

Total: R550.00

Estimated Delivery: 2-3 business days

We'll send you another email when your order ships with tracking information.

This is an automated message from ReBooked Solutions. Please do not reply to this email.
For assistance, contact: support@rebookedsolutions.co.za
Visit us at: https://rebookedsolutions.co.za
T&Cs apply.
"Pre-Loved Pages, New Adventures"
  `;

  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: email,
        subject:
          "✅ NEW STYLING TEST - Order Confirmation (ReBooked Solutions)",
        html: html,
        text: text,
      },
    });

    if (error) {
      console.error("Direct styled email test failed:", error);
      throw error;
    }

    console.log("Direct styled email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Direct styled email error:", error);
    return { success: false, error };
  }
}

export async function testTemplateWithForceRefresh(email: string) {
  console.log("Testing template with force refresh...");

  // Add timestamp to force template refresh
  const timestamp = Date.now();

  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: email,
        subject: `🔄 FORCE REFRESH TEST - Welcome (${timestamp})`,
        template: {
          name: "order-confirmation",
          data: {
            orderNumber: `REFRESH_${timestamp}`,
            customerName: "Force Refresh Test",
            items: [
              { name: "Physics Textbook", quantity: 1, price: 250 },
              { name: "Math Workbook", quantity: 2, price: 150 },
            ],
            total: "550.00",
            estimatedDelivery: "2-3 business days",
          },
        },
        _cacheBreaker: timestamp, // Force refresh
      },
    });

    if (error) {
      console.error("Force refresh template test failed:", error);
      throw error;
    }

    console.log("Force refresh template email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Force refresh template error:", error);
    return { success: false, error };
  }
}
