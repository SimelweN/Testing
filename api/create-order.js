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
      user_id,
      items,
      total_amount,
      shipping_address,
      payment_reference,
      payment_data,
    } = body;

    validateFields(body, [
      "user_id",
      "items",
      "total_amount",
      "payment_reference",
    ]);

    logEvent("order_creation_started", {
      user_id,
      items_count: items.length,
      total_amount,
      payment_reference,
    });

    const supabase = createSupabaseClient();

    // Get buyer information
    const { data: buyer, error: buyerError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user_id)
      .single();

    if (buyerError || !buyer) {
      throw new Error("Buyer not found");
    }

    // Group items by seller to create separate orders
    const itemsBySeller = items.reduce((acc, item) => {
      const sellerId = item.seller_id;
      if (!acc[sellerId]) {
        acc[sellerId] = [];
      }
      acc[sellerId].push(item);
      return acc;
    }, {});

    const createdOrders = [];

    // Create orders for each seller
    for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
      // Get seller information
      const { data: seller, error: sellerError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sellerId)
        .single();

      if (sellerError || !seller) {
        logEvent("seller_not_found", { seller_id: sellerId });
        continue;
      }

      // Calculate order total for this seller
      const orderTotal = sellerItems.reduce((sum, item) => sum + item.price, 0);

      // Generate unique order ID
      const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const orderData = {
        id: orderId,
        buyer_id: user_id,
        seller_id: sellerId,
        status: "pending_commit",
        total_amount: orderTotal,
        items: sellerItems,
        shipping_address,
        payment_reference,
        payment_data,
        buyer_name: buyer.name,
        buyer_email: buyer.email,
        seller_name: seller.name,
        seller_email: seller.email,
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
        created_at: new Date().toISOString(),
      };

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        logEvent("order_creation_failed", {
          seller_id: sellerId,
          error: orderError,
        });
        continue;
      }

      createdOrders.push(order);

      // Mark books as sold
      const bookIds = sellerItems.map((item) => item.book_id).filter(Boolean);
      if (bookIds.length > 0) {
        await supabase
          .from("books")
          .update({
            sold: true,
            sold_at: new Date().toISOString(),
            buyer_id: user_id,
          })
          .in("id", bookIds);
      }

      // Send notification email to seller about new order
      try {
        await fetch(`${req.headers.host}/api/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: seller.email,
            subject: "📚 New Order - Action Required (48 hours)",
            template: {
              name: "seller-new-order",
              data: {
                sellerName: seller.name,
                buyerName: buyer.name,
                orderId,
                items: sellerItems,
                totalAmount: orderTotal,
                expiresAt: orderData.expires_at,
                commitUrl: `${req.headers.origin}/activity`,
              },
            },
          }),
        });
      } catch (emailError) {
        logEvent("seller_notification_failed", {
          order_id: orderId,
          error: emailError.message,
        });
      }

      // Send confirmation email to buyer
      try {
        await fetch(`${req.headers.host}/api/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: buyer.email,
            subject: "🎉 Order Confirmed - Awaiting Seller Commitment",
            template: {
              name: "buyer-order-pending",
              data: {
                buyerName: buyer.name,
                sellerName: seller.name,
                orderId,
                items: sellerItems,
                totalAmount: orderTotal,
                statusUrl: `${req.headers.origin}/orders/${orderId}`,
              },
            },
          }),
        });
      } catch (emailError) {
        logEvent("buyer_notification_failed", {
          order_id: orderId,
          error: emailError.message,
        });
      }

      logEvent("order_created", {
        order_id: orderId,
        seller_id: sellerId,
        amount: orderTotal,
      });
    }

    if (createdOrders.length === 0) {
      throw new Error("Failed to create any orders");
    }

    logEvent("orders_creation_completed", {
      orders_count: createdOrders.length,
      total_amount,
      payment_reference,
    });

    return res.status(200).json({
      success: true,
      orders: createdOrders,
      message: `Created ${createdOrders.length} order(s) successfully`,
    });
  } catch (error) {
    logEvent("order_creation_error", { error: error.message });

    let statusCode = 500;
    if (error.message.includes("Missing required fields")) {
      statusCode = 400;
    }

    return res.status(statusCode).json({
      success: false,
      error: error.message || "Failed to create orders",
    });
  }
}
