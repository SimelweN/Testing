import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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
        seller:profiles!orders_seller_id_fkey(id, name, email, phone),
        buyer:profiles!orders_buyer_id_fkey(id, name, email)
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
              template: {
                name: "seller-commit-reminder",
                data: {
                  sellerName: order.seller.name,
                  buyerName: order.buyer.name,
                  orderId: order.id,
                  items: order.items,
                  totalAmount: order.total_amount,
                  timeLeft: timeLeft,
                  isUrgent: isUrgent,
                  expiresAt: order.expires_at,
                  commitUrl: `${req.headers.get("origin")}/activity`,
                  orderCreatedAt: order.created_at,
                },
              },
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
            template: {
              name: "admin-reminder-report",
              data: {
                totalSent: reminderResults.length,
                totalErrors: errors.length,
                urgentReminders: reminderResults.filter((r) => r.urgent).length,
                reminderDetails: reminderResults.slice(0, 10), // Limit for email size
                errorDetails: errors.slice(0, 5),
                batchTime: now.toISOString(),
              },
            },
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
