import {
  handleCORS,
  createSupabaseClient,
  validateFields,
  logEvent,
  parseRequestBody,
  errorResponse,
  successResponse,
} from "./_lib/utils.js";

export default async function handler(req, res) {
  // Handle CORS
  handleCORS(req, res);
  if (req.method === "OPTIONS") return;

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed. Use POST.",
    });
  }

  try {
    const body = await parseRequestBody(req);
    const { order_id, seller_id } = body;

    // Validate required fields
    validateFields(body, ["order_id", "seller_id"]);

    logEvent("commit_started", { order_id, seller_id });

    // Initialize Supabase
    const supabase = createSupabaseClient();

    // 📦 STEP 1: Get complete order details with seller & buyer info
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        *,
        seller:profiles!orders_seller_id_fkey(id, name, email, pickup_address, phone),
        buyer:profiles!orders_buyer_id_fkey(id, name, email, phone)
      `,
      )
      .eq("id", order_id)
      .eq("seller_id", seller_id)
      .single();

    if (orderError || !order) {
      logEvent("order_not_found", { order_id, seller_id, error: orderError });
      return res.status(404).json({
        success: false,
        error: "Order not found or access denied",
      });
    }

    // Check if order is already committed
    if (order.status === "committed" || order.status === "courier_scheduled") {
      return res.status(400).json({
        success: false,
        error: "Order is already committed",
      });
    }

    // ✅ STEP 2: Update order status to committed
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "committed",
        committed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id)
      .select()
      .single();

    if (updateError) {
      logEvent("commit_update_failed", { order_id, error: updateError });
      return res.status(500).json({
        success: false,
        error: "Failed to commit to sale",
      });
    }

    logEvent("order_committed", { order_id });

    // 🚚 STEP 3: TRIGGER AUTOMATIC DELIVERY BOOKING & EMAIL
    try {
      // Call Vercel delivery automation function
      const deliveryResponse = await fetch(
        `${req.headers.host}/api/automate-delivery`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: order_id,
            trigger: "order_committed",
          }),
        },
      );

      const deliveryResult = await deliveryResponse.json();

      if (deliveryResult?.success) {
        logEvent("delivery_automation_success", { order_id });

        // 📧 STEP 4: SEND EMAIL WITH COURIER INFO TO SELLER
        await fetch(`${req.headers.host}/api/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: order.seller.email,
            subject: `📦 Order #${order_id.substring(0, 8)} - Courier Pickup Scheduled!`,
            template: {
              name: "seller-pickup-notification",
              data: {
                sellerName: order.seller.name,
                bookTitle:
                  order.items?.[0]?.book_title || order.book_title || "Book",
                orderId: order_id,
                pickupDate: deliveryResult.pickup_date,
                pickupTimeWindow: deliveryResult.pickup_time_window,
                courierProvider: deliveryResult.courier_provider,
                trackingNumber: deliveryResult.tracking_number,
                shippingLabelUrl: deliveryResult.shipping_label_url,
                pickupAddress: order.seller.pickup_address,
              },
            },
          }),
        });

        logEvent("seller_notification_sent", {
          order_id,
          email: order.seller.email,
        });
      } else {
        logEvent("delivery_automation_failed", {
          order_id,
          error: deliveryResult.error,
        });
      }
    } catch (deliveryError) {
      logEvent("delivery_automation_error", {
        order_id,
        error: deliveryError.message,
      });

      // 📧 FALLBACK: Send basic commitment confirmation email
      await fetch(`${req.headers.host}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: order.seller.email,
          subject: `✅ Order Commitment Confirmed - Next Steps`,
          template: {
            name: "commit-confirmation-basic",
            data: {
              sellerName: order.seller.name,
              bookTitle:
                order.items?.[0]?.book_title || order.book_title || "Book",
              orderId: order_id,
              buyerEmail: order.buyer?.email || order.buyer_email,
            },
          },
        }),
      });

      logEvent("basic_confirmation_sent", { order_id });
    }

    // 📧 STEP 5: NOTIFY BUYER ABOUT COMMITMENT
    try {
      await fetch(`${req.headers.host}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: order.buyer?.email || order.buyer_email,
          subject: `🎉 Your order has been confirmed!`,
          template: {
            name: "buyer-order-confirmed",
            data: {
              buyerName: order.buyer?.name || order.buyer_name || "Customer",
              bookTitle:
                order.items?.[0]?.book_title || order.book_title || "Book",
              orderId: order_id,
              sellerName: order.seller.name,
              expectedDelivery: "3-5 business days",
            },
          },
        }),
      });

      logEvent("buyer_notification_sent", {
        order_id,
        email: order.buyer?.email || order.buyer_email,
      });
    } catch (emailError) {
      logEvent("buyer_notification_failed", {
        order_id,
        error: emailError.message,
      });
      // Don't fail the entire operation for email errors
    }

    return res.status(200).json({
      success: true,
      order: updatedOrder,
      message: "Successfully committed to sale and notifications sent",
    });
  } catch (error) {
    logEvent("commit_error", { error: error.message, stack: error.stack });

    let statusCode = 500;
    if (error.message.includes("Missing required fields")) {
      statusCode = 400;
    }

    return res.status(statusCode).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
}
