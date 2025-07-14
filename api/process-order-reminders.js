import { handleCORS, createSupabaseClient, logEvent } from "./_lib/utils.js";

export default async function handler(req, res) {
  handleCORS(req, res);
  if (req.method === "OPTIONS") return;

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed. Use POST.",
    });
  }

  try {
    logEvent("order_reminders_process_started", {});

    const supabase = createSupabaseClient();

    // Get current time and 24 hours ago
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

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
      return res.status(200).json({
        success: true,
        message: "No orders need reminders at this time",
        processed: 0,
      });
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
          `${req.headers.host}/api/send-email`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
                  commitUrl: `${req.headers.origin}/activity`,
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

          logEvent("reminder_sent", {
            order_id: order.id,
            time_left: timeLeft,
            urgent: isUrgent,
          });

          // Log SMS reminder opportunity if urgent and phone number available
          if (isUrgent && order.seller.phone) {
            logEvent("sms_reminder_opportunity", {
              order_id: order.id,
              phone: order.seller.phone,
              time_left: timeLeft,
            });
          }
        } else {
          errors.push({
            order_id: order.id,
            error: emailResult.error,
          });
        }
      } catch (orderError) {
        logEvent("reminder_error", {
          order_id: order.id,
          error: orderError.message,
        });
        errors.push({
          order_id: order.id,
          error: orderError.message,
        });
      }
    }

    // Send admin notification about reminder batch
    if (reminderResults.length > 0) {
      try {
        await fetch(`${req.headers.host}/api/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        logEvent("admin_reminder_report_failed", {
          error: adminEmailError.message,
        });
      }
    }

    logEvent("order_reminders_process_completed", {
      sent: reminderResults.length,
      errors: errors.length,
    });

    return res.status(200).json({
      success: true,
      processed: reminderResults.length,
      errors: errors.length,
      reminders: reminderResults,
      errorDetails: errors,
      message: `Sent ${reminderResults.length} reminders with ${errors.length} errors`,
    });
  } catch (error) {
    logEvent("order_reminders_process_error", { error: error.message });

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to process order reminders",
    });
  }
}
