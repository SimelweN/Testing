import {
  handleCORS,
  createSupabaseClient,
  validateFields,
  logEvent,
  parseRequestBody,
} from "./_lib/utils.js";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

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
    const body = await parseRequestBody(req);
    const { order_id, seller_id, reason = "Seller declined" } = body;

    validateFields(body, ["order_id", "seller_id"]);

    logEvent("order_decline_started", { order_id, seller_id, reason });

    const supabase = createSupabaseClient();

    // Get order details with buyer and seller info
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        *,
        seller:profiles!orders_seller_id_fkey(id, name, email),
        buyer:profiles!orders_buyer_id_fkey(id, name, email)
      `,
      )
      .eq("id", order_id)
      .eq("seller_id", seller_id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({
        success: false,
        error: "Order not found or access denied",
      });
    }

    // Check if order can be declined
    if (!["pending_commit", "pending"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: "Order cannot be declined in current status",
      });
    }

    // Update order status to declined
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "declined",
        declined_at: new Date().toISOString(),
        decline_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    if (updateError) {
      throw new Error(`Failed to update order status: ${updateError.message}`);
    }

    // Make books available again
    const bookIds =
      order.items?.map((item) => item.book_id).filter(Boolean) || [];
    if (bookIds.length > 0) {
      await supabase
        .from("books")
        .update({
          sold: false,
          sold_at: null,
          buyer_id: null,
          reserved_until: null,
          reserved_by: null,
        })
        .in("id", bookIds);
    }

    // Process full refund
    let refundResult = null;
    if (order.payment_reference) {
      try {
        const refundResponse = await fetch("https://api.paystack.co/refund", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transaction: order.payment_reference,
            amount: Math.round(order.total_amount * 100), // Convert to kobo
            currency: "ZAR",
            customer_note: `Refund for declined order ${order_id}`,
            merchant_note: `Order declined by seller: ${reason}`,
          }),
        });

        refundResult = await refundResponse.json();

        if (refundResult.status) {
          // Record refund in database
          await supabase.from("refunds").insert({
            order_id,
            amount: order.total_amount,
            reason: `Order declined: ${reason}`,
            paystack_response: refundResult.data,
            status: "processed",
            created_at: new Date().toISOString(),
          });

          logEvent("refund_processed", {
            order_id,
            amount: order.total_amount,
          });
        } else {
          logEvent("refund_failed", { order_id, error: refundResult });
        }
      } catch (refundError) {
        logEvent("refund_error", { order_id, error: refundError.message });
      }
    }

    // Send notification emails
    try {
      // Notify buyer about declined order and refund
      await fetch(`${req.headers.host}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: order.buyer.email,
          subject: "Order Declined - Full Refund Processed",
          template: {
            name: "buyer-order-declined",
            data: {
              buyerName: order.buyer.name,
              orderId: order_id,
              sellerName: order.seller.name,
              items: order.items,
              totalAmount: order.total_amount,
              reason: reason,
              refundAmount: order.total_amount,
              refundStatus: refundResult?.status ? "processed" : "pending",
            },
          },
        }),
      });

      // Notify seller about decline confirmation
      await fetch(`${req.headers.host}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: order.seller.email,
          subject: "Order Decline Confirmed",
          template: {
            name: "seller-decline-confirmation",
            data: {
              sellerName: order.seller.name,
              orderId: order_id,
              buyerName: order.buyer.name,
              items: order.items,
              reason: reason,
            },
          },
        }),
      });
    } catch (emailError) {
      logEvent("decline_notification_failed", {
        order_id,
        error: emailError.message,
      });
    }

    logEvent("order_declined", {
      order_id,
      seller_id,
      refund_status: refundResult?.status,
    });

    return res.status(200).json({
      success: true,
      order: {
        id: order_id,
        status: "declined",
        decline_reason: reason,
      },
      refund: refundResult?.data || null,
      message: "Order declined successfully and buyer will receive full refund",
    });
  } catch (error) {
    logEvent("order_decline_error", { error: error.message });

    let statusCode = 500;
    if (error.message.includes("Missing required fields")) {
      statusCode = 400;
    }

    return res.status(statusCode).json({
      success: false,
      error: error.message || "Failed to decline order",
    });
  }
}
