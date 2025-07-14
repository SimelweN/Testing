import {
  handleCORS,
  createSupabaseClient,
  validateFields,
  logEvent,
  parseRequestBody,
} from "./_lib/utils.js";

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
    const {
      order_id,
      collected_by = "courier",
      collection_notes = "",
      tracking_reference = "",
      collected_at = new Date().toISOString(),
    } = body;

    validateFields(body, ["order_id"]);

    logEvent("order_collection_started", { order_id, collected_by });

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
      .single();

    if (orderError || !order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    // Check if order is in a state that allows collection
    if (!["committed", "courier_scheduled"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error:
          "Order must be committed and courier scheduled before collection",
      });
    }

    // Update order status to collected
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "collected",
        collected_at,
        collected_by,
        collection_notes,
        tracking_reference,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update order status: ${updateError.message}`);
    }

    // Send notification emails
    try {
      // Notify buyer about collection
      await fetch(`${req.headers.host}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: order.buyer.email,
          subject: "📦 Your order is on the way!",
          template: {
            name: "buyer-order-collected",
            data: {
              buyerName: order.buyer.name,
              orderId: order_id,
              sellerName: order.seller.name,
              items: order.items,
              collectedAt: collected_at,
              trackingReference: tracking_reference,
              estimatedDelivery: "3-5 business days",
              shippingAddress: order.shipping_address,
            },
          },
        }),
      });

      // Notify seller about successful collection
      await fetch(`${req.headers.host}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: order.seller.email,
          subject: "✅ Order collected successfully",
          template: {
            name: "seller-order-collected",
            data: {
              sellerName: order.seller.name,
              orderId: order_id,
              buyerName: order.buyer.name,
              items: order.items,
              collectedAt: collected_at,
              collectedBy: collected_by,
              trackingReference: tracking_reference,
              collectionNotes: collection_notes,
            },
          },
        }),
      });
    } catch (emailError) {
      logEvent("collection_notification_failed", {
        order_id,
        error: emailError.message,
      });
    }

    // Schedule delivery completion check (e.g., after estimated delivery time)
    const estimatedDeliveryDate = new Date(
      Date.now() + 5 * 24 * 60 * 60 * 1000,
    ); // 5 days

    logEvent("order_collected", {
      order_id,
      collected_by,
      tracking_reference,
      estimated_delivery: estimatedDeliveryDate.toISOString(),
    });

    return res.status(200).json({
      success: true,
      order: updatedOrder,
      collection: {
        collected_at,
        collected_by,
        tracking_reference,
        collection_notes,
      },
      message: "Order marked as collected successfully",
    });
  } catch (error) {
    logEvent("order_collection_error", { error: error.message });

    let statusCode = 500;
    if (error.message.includes("Missing required fields")) {
      statusCode = 400;
    } else if (error.message.includes("not found")) {
      statusCode = 404;
    } else if (error.message.includes("must be committed")) {
      statusCode = 400;
    }

    return res.status(statusCode).json({
      success: false,
      error: error.message || "Failed to mark order as collected",
    });
  }
}
