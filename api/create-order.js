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

      // Send notification email to seller about new order using DIRECT HTML (the only correct way!)
      try {
        const sellerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Order - Action Required</title>
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
  </style>
</head>
<body>
    <div class="container">
    <h1>📚 New Order - Action Required!</h1>

    <p>Hi ${seller.name}!</p>
    <p>Great news! You have a new order from <strong>${buyer.name}</strong>.</p>

    <p><strong>Order Details:</strong></p>
    <p>Order ID: ${orderId}<br>
    Buyer: ${buyer.name}<br>
    Total Amount: R${orderTotal}</p>

    <p style="background: #fff3cd; padding: 15px; border-radius: 5px;">
      <strong>⏰ Action Required Within 48 Hours</strong><br>
      Expires: ${new Date(orderData.expires_at).toLocaleString()}<br>
      You must commit to this order within 48 hours or it will be automatically cancelled.
    </p>

    <p>Once you commit, we'll arrange pickup and you'll be paid after delivery!</p>

    <a href="${req.headers.origin}/activity" class="btn">Commit to Order</a>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="font-size: 12px; color: #6b7280;">
      <strong>This is an automated message from ReBooked Solutions.</strong><br>
      Please do not reply to this email.<br><br>
      For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>
      Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a><br><br>
      T&Cs apply. <em>"Pre-Loved Pages, New Adventures"</em>
    </p>
  </div>
</body>
</html>`;

        await fetch(`${req.headers.host}/api/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: seller.email,
            from: "noreply@rebookedsolutions.co.za",
            subject: "📚 New Order - Action Required (48 hours)",
            html: sellerHtml,
            text: `New Order - Action Required!\n\nHi ${seller.name}!\n\nGreat news! You have a new order from ${buyer.name}.\n\nOrder Details:\n- Order ID: ${orderId}\n- Buyer: ${buyer.name}\n- Total Amount: R${orderTotal}\n\n⏰ Action Required Within 48 Hours\nExpires: ${new Date(orderData.expires_at).toLocaleString()}\n\nYou must commit to this order within 48 hours or it will be automatically cancelled.\n\nCommit to order: ${req.headers.origin}/activity\n\nReBooked Solutions`,
          }),
        });
      } catch (emailError) {
        logEvent("seller_notification_failed", {
          order_id: orderId,
          error: emailError.message,
        });
      }

      // Send confirmation email to buyer using DIRECT HTML (the only correct way!)
      try {
        const buyerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmed - Awaiting Seller Response</title>
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
    </div>

    <h2>Thank you, ${buyer.name}!</h2>
    <p>Your order has been confirmed and <strong>${seller.name}</strong> has been notified.</p>

    <div class="info-box">
      <h3>📋 Order Details</h3>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Seller:</strong> ${seller.name}</p>
      <p><strong>Total Amount:</strong> R${orderTotal}</p>
    </div>

    <div class="steps">
      <h3>📦 What happens next?</h3>
      <ul>
        <li>The seller has 48 hours to commit to your order</li>
        <li>Once committed, we'll arrange pickup and delivery</li>
        <li>You'll receive tracking information via email</li>
        <li>Your book(s) will be delivered within 2-3 business days</li>
      </ul>
    </div>

    <p>We'll notify you as soon as the seller confirms your order!</p>

    <a href="${req.headers.origin}/orders/${orderId}" class="btn">Check Order Status</a>

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
</html>`;

        await fetch(`${req.headers.host}/api/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: buyer.email,
            from: "noreply@rebookedsolutions.co.za",
            subject: "🎉 Order Confirmed - Awaiting Seller Commitment",
            html: buyerHtml,
            text: `Order Confirmed!\n\nThank you, ${buyer.name}!\n\nYour order has been confirmed and ${seller.name} has been notified.\n\nOrder Details:\n- Order ID: ${orderId}\n- Seller: ${seller.name}\n- Total Amount: R${orderTotal}\n\nWhat happens next?\n- The seller has 48 hours to commit to your order\n- Once committed, we'll arrange pickup and delivery\n- You'll receive tracking information via email\n- Your book(s) will be delivered within 2-3 business days\n\nCheck order status: ${req.headers.origin}/orders/${orderId}\n\nReBooked Solutions`,
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
