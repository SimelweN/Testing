import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { testFunction } from "../_mock-data/edge-function-tester.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 🧪 TEST MODE: Check if this is a test request with mock data
  const testResult = await testFunction("process-order-reminders", req);
  if (testResult.isTest) {
    return testResult.response;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get current time and 24 hours ago
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursFromNow = new Date(
      now.getTime() + 24 * 60 * 60 * 1000,
    ); // 24 hours left

    // Find orders that need reminders
    const { data: ordersNeedingReminders, error: ordersError } = await supabase
      .from("orders")
      .select(
        `
        *,
                seller:profiles!seller_id(id, name, email, phone),
        buyer:profiles!buyer_id(id, name, email)
      `,
      )
      .eq("status", "pending_commit")
      .lt("created_at", twentyFourHoursAgo.toISOString())
      .gt("expires_at", now.toISOString()) // Not yet expired
      .is("reminder_sent_at", null); // Haven't sent reminder yet

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    if (!ordersNeedingReminders || ordersNeedingReminders.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No orders need reminders at this time",
          processed: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const reminderResults = [];
    const errors = [];

    // Process each order that needs a reminder
    for (const order of ordersNeedingReminders) {
      try {
        const timeLeft = Math.max(
          0,
          Math.floor(
            (new Date(order.expires_at).getTime() - now.getTime()) /
              (1000 * 60 * 60),
          ),
        );

        const isUrgent = timeLeft <= 12; // Less than 12 hours left

        // Send reminder email to seller
        const emailResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/send-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
            body: JSON.stringify({
              to: order.seller.email,
              subject: isUrgent
                ? `🚨 URGENT: Order expires in ${timeLeft} hours - Action Required!`
                : `⏰ Reminder: Order expires in ${timeLeft} hours - Please commit`,
              html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Commit Reminder - ReBooked Solutions</title>
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
    .header {
      background: ${isUrgent ? "#dc2626" : "#f59e0b"};
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
    .urgent-box {
      background: ${isUrgent ? "#fef2f2" : "#fef3c7"};
      border: 1px solid ${isUrgent ? "#dc2626" : "#f59e0b"};
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .order-details {
      background: #f0f9ff;
      border: 1px solid #3ab26f;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background-color: #3ab26f;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
      font-weight: bold;
      text-align: center;
    }
    .link {
      color: #3ab26f;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${isUrgent ? "🚨 URGENT" : "⏰"} Order Reminder</h1>
    </div>

    <h2>Hello ${order.seller.name}!</h2>
    <p>${isUrgent ? "This is an urgent reminder" : "This is a friendly reminder"} that you have a pending order that needs your attention.</p>

    <div class="urgent-box">
      <h3>${isUrgent ? "🚨 Action Required" : "⏰ Time Reminder"}</h3>
      <p><strong>Time Remaining:</strong> ${timeLeft} hours</p>
      <p><strong>Expires At:</strong> ${new Date(order.expires_at).toLocaleString()}</p>
      ${isUrgent ? "<p><strong>This order will expire soon if not committed!</strong></p>" : ""}
    </div>

    <div class="order-details">
      <h3>�� Order Details</h3>
      <p><strong>Order ID:</strong> #${order.id}</p>
      <p><strong>Buyer:</strong> ${order.buyer.name}</p>
      <p><strong>Total Amount:</strong> R${order.total_amount.toFixed(2)}</p>
      <p><strong>Ordered:</strong> ${new Date(order.created_at).toLocaleString()}</p>
    </div>

    <div style="text-align: center;">
      <a href="${req.headers.get("origin")}/activity" class="btn">
        📋 View Order & Commit
      </a>
    </div>

    <p><strong>What you need to do:</strong></p>
    <ul>
      <li>Review the order details</li>
      <li>Commit to the sale within the time limit</li>
      <li>Prepare your book for collection</li>
    </ul>

    <div class="footer">
      <p><strong>This is an automated reminder from ReBooked Solutions.</strong><br>
      Please do not reply to this email.</p>
            <p>For help, contact support@rebookedsolutions.co.za<br>
      Visit our website: www.rebookedsolutions.co.za<br>
      T&Cs apply</p>
      <p><em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
  </div>
</body>
</html>`,
              text: `${isUrgent ? "URGENT: " : ""}Order Commit Reminder

Hello ${order.seller.name}!

${isUrgent ? "This is an urgent reminder" : "This is a friendly reminder"} that you have a pending order that needs your attention.

Time Remaining: ${timeLeft} hours
Expires At: ${new Date(order.expires_at).toLocaleString()}
${isUrgent ? "This order will expire soon if not committed!" : ""}

Order Details:
Order ID: #${order.id}
Buyer: ${order.buyer.name}
Total Amount: R${order.total_amount.toFixed(2)}
Ordered: ${new Date(order.created_at).toLocaleString()}

What you need to do:
- Review the order details
- Commit to the sale within the time limit
- Prepare your book for collection

View Order: ${req.headers.get("origin")}/activity

This is an automated reminder from ReBooked Solutions.
For help, contact support@rebookedsolutions.co.za
Visit our website: www.rebookedsolutions.co.za
T&Cs apply
"Pre-Loved Pages, New Adventures"`,
            }),
          },
        );

        const emailResult = await emailResponse.json();

        if (emailResult.success) {
          // Mark reminder as sent
          await supabase
            .from("orders")
            .update({
              reminder_sent_at: now.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq("id", order.id);

          reminderResults.push({
            order_id: order.id,
            seller_email: order.seller.email,
            time_left_hours: timeLeft,
            urgent: isUrgent,
            status: "sent",
          });

          // Send SMS reminder if urgent and phone number available
          if (isUrgent && order.seller.phone) {
            try {
              // This would integrate with an SMS service like Twilio
              // For now, we'll just log it
              console.log(
                `SMS reminder needed for ${order.seller.phone}: Order ${order.id} expires in ${timeLeft} hours`,
              );

              // You could implement SMS sending here:
              // await sendSMSReminder(order.seller.phone, order.id, timeLeft);
            } catch (smsError) {
              console.error("SMS reminder failed:", smsError);
            }
          }
        } else {
          errors.push({
            order_id: order.id,
            error: emailResult.error,
          });
        }
      } catch (orderError) {
        console.error(
          `Failed to process reminder for order ${order.id}:`,
          orderError,
        );
        errors.push({
          order_id: order.id,
          error: orderError.message,
        });
      }
    }

    // Send admin notification about reminder batch
    if (reminderResults.length > 0) {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({
            to: "admin@rebookedsolutions.co.za",
            subject: `Order Reminders Sent: ${reminderResults.length} reminders, ${errors.length} errors`,
            html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reminder Report - ReBooked Solutions</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f3fef7;
      padding: 20px;
      color: #1f4e3d;
      margin: 0;
    }
    .container {
      max-width: 600px;
      margin: auto;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: #3ab26f;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 10px 10px 0 0;
      margin: -30px -30px 20px -30px;
    }
    .stats-box {
      background: #f0f9ff;
      border: 1px solid #3ab26f;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .urgent-stats {
      background: #fef2f2;
      border: 1px solid #dc2626;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .reminder-item {
      background: #f9fafb;
      border-left: 3px solid #3ab26f;
      padding: 10px;
      margin: 5px 0;
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
      <h1>📨 Order Reminders Report</h1>
    </div>

    <h2>Reminder Batch Summary</h2>
    <p>Report generated on: ${new Date(now).toLocaleString()}</p>

    <div class="stats-box">
      <h3>📊 Summary</h3>
      <p><strong>Total Reminders Sent:</strong> ${reminderResults.length}</p>
      <p><strong>Errors:</strong> ${errors.length}</p>
      <p><strong>Urgent Reminders:</strong> ${reminderResults.filter((r) => r.urgent).length}</p>
    </div>

    ${
      reminderResults.filter((r) => r.urgent).length > 0
        ? `
    <div class="urgent-stats">
      <h3>🚨 Urgent Reminders</h3>
      <p>${reminderResults.filter((r) => r.urgent).length} urgent reminders were sent for orders expiring soon.</p>
    </div>
    `
        : ""
    }

    ${
      reminderResults.length > 0
        ? `
    <h3>📋 Reminder Details (first 10)</h3>
    ${reminderResults
      .slice(0, 10)
      .map(
        (reminder) => `
    <div class="reminder-item">
      <p><strong>Order ID:</strong> ${reminder.order_id}</p>
      <p><strong>Seller:</strong> ${reminder.seller_email}</p>
      <p><strong>Time Left:</strong> ${reminder.time_left_hours} hours</p>
      <p><strong>Urgent:</strong> ${reminder.urgent ? "Yes" : "No"}</p>
    </div>
    `,
      )
      .join("")}
    ${reminderResults.length > 10 ? `<p><em>... and ${reminderResults.length - 10} more reminders</em></p>` : ""}
    `
        : ""
    }

    ${
      errors.length > 0
        ? `
    <div class="urgent-stats">
      <h3>⚠️ Errors (first 5)</h3>
      ${errors
        .slice(0, 5)
        .map((error) => `<p>${error}</p>`)
        .join("")}
      ${errors.length > 5 ? `<p><em>... and ${errors.length - 5} more errors</em></p>` : ""}
    </div>
    `
        : ""
    }

    <div class="footer">
      <p><strong>This is an automated system report from ReBooked Solutions.</strong></p>
      <p><em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
  </div>
</body>
</html>`,
            text: `Order Reminders Report

Reminder Batch Summary
Report generated on: ${new Date(now).toLocaleString()}

Summary:
Total Reminders Sent: ${reminderResults.length}
Errors: ${errors.length}
Urgent Reminders: ${reminderResults.filter((r) => r.urgent).length}

${
  reminderResults.length > 0
    ? `
Reminder Details (first 10):
${reminderResults
  .slice(0, 10)
  .map(
    (reminder) => `
Order ID: ${reminder.order_id}
Seller: ${reminder.seller_email}
Time Left: ${reminder.time_left_hours} hours
Urgent: ${reminder.urgent ? "Yes" : "No"}
---`,
  )
  .join("")}
${reminderResults.length > 10 ? `... and ${reminderResults.length - 10} more reminders` : ""}`
    : ""
}

${
  errors.length > 0
    ? `
Errors (first 5):
${errors.slice(0, 5).join("\n")}
${errors.length > 5 ? `... and ${errors.length - 5} more errors` : ""}`
    : ""
}

This is an automated system report from ReBooked Solutions.
"Pre-Loved Pages, New Adventures"`,
          }),
        });
      } catch (adminEmailError) {
        console.error("Failed to send admin notification:", adminEmailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: reminderResults.length,
        errors: errors.length,
        reminders: reminderResults,
        errorDetails: errors,
        message: `Sent ${reminderResults.length} reminders with ${errors.length} errors`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Process order reminders error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to process order reminders",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

// Helper function for future SMS implementation
async function sendSMSReminder(
  phoneNumber: string,
  orderId: string,
  hoursLeft: number,
) {
  // This would integrate with an SMS service like Twilio, ClickSend, etc.
  // For now, it's just a placeholder
  const message = `URGENT: Your ReBooked order ${orderId.substring(0, 8)} expires in ${hoursLeft} hours. Commit now or buyer gets full refund. Visit: rebookedsolutions.co.za/activity`;

  console.log(`SMS to ${phoneNumber}: ${message}`);

  // Example Twilio integration:
  /*
  const twilioResponse = await fetch('https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(TWILIO_ACCOUNT_SID + ':' + TWILIO_AUTH_TOKEN)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: TWILIO_PHONE_NUMBER,
      To: phoneNumber,
      Body: message,
    }),
  });
  */
}
