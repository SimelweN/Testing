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
    logEvent("auto_expire_process_started", {});

    const supabase = createSupabaseClient();

    // Find orders that have expired (48 hours old and still pending commit)
    const fortyEightHoursAgo = new Date(
      Date.now() - 48 * 60 * 60 * 1000,
    ).toISOString();

    const { data: expiredOrders, error: expiredError } = await supabase
      .from("orders")
      .select(
        `
        *,
        seller:profiles!orders_seller_id_fkey(id, name, email),
        buyer:profiles!orders_buyer_id_fkey(id, name, email)
      `,
      )
      .eq("status", "pending_commit")
      .lt("created_at", fortyEightHoursAgo);

    if (expiredError) {
      throw new Error(
        `Failed to fetch expired orders: ${expiredError.message}`,
      );
    }

    if (!expiredOrders || expiredOrders.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No expired orders found",
        processed: 0,
      });
    }

    const processedOrders = [];
    const errors = [];

    // Process each expired order
    for (const order of expiredOrders) {
      try {
        // Call decline-commit Supabase Edge Function to handle the expiration
        const { data: declineData, error: declineError } =
          await supabase.functions.invoke("decline-commit", {
            body: {
              order_id: order.id,
              seller_id: order.seller_id,
              reason: "Order expired - seller did not commit within 48 hours",
            },
          });

        if (declineError) {
          throw new Error(`Decline function error: ${declineError.message}`);
        }

        if (!declineData?.success) {
          throw new Error(declineData?.error || "Failed to decline order");
        }

        processedOrders.push({
          order_id: order.id,
          buyer_email: order.buyer.email,
          seller_email: order.seller.email,
          amount: order.total_amount,
          expired_at: new Date().toISOString(),
        });

        logEvent("order_auto_expired", {
          order_id: order.id,
          seller_id: order.seller_id,
          amount: order.total_amount,
        });
      } catch (orderError) {
        logEvent("order_expiry_error", {
          order_id: order.id,
          error: orderError.message,
        });
        errors.push({
          order_id: order.id,
          error: orderError.message,
        });
      }
    }

    // Send summary report if there were processed orders
    if (processedOrders.length > 0) {
      try {
        await fetch(`${req.headers.host}/api/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: "admin@rebookedsolutions.co.za", // Admin notification
            subject: `Auto-Expire Report: ${processedOrders.length} orders expired`,
            template: {
              name: "admin-auto-expire-report",
              data: {
                processedCount: processedOrders.length,
                errorCount: errors.length,
                processedOrders: processedOrders.slice(0, 10), // Limit for email size
                totalRefundAmount: processedOrders.reduce(
                  (sum, order) => sum + order.amount,
                  0,
                ),
                reportDate: new Date().toISOString(),
              },
            },
          }),
        });
      } catch (emailError) {
        logEvent("admin_report_failed", { error: emailError.message });
      }
    }

    logEvent("auto_expire_process_completed", {
      processed: processedOrders.length,
      errors: errors.length,
    });

    return res.status(200).json({
      success: true,
      processed: processedOrders.length,
      errors: errors.length,
      processedOrders: processedOrders,
      errorDetails: errors,
      message: `Processed ${processedOrders.length} expired orders, ${errors.length} errors`,
    });
  } catch (error) {
    logEvent("auto_expire_process_error", { error: error.message });

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to process expired orders",
    });
  }
}
