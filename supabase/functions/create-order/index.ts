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
    const {
      user_id,
      items,
      total_amount,
      shipping_address,
      payment_reference,
      payment_data,
    } = await req.json();

    if (!user_id || !items || !total_amount || !payment_reference) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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
    const itemsBySeller = items.reduce((acc: any, item: any) => {
      const sellerId = item.seller_id;
      if (!acc[sellerId]) {
        acc[sellerId] = [];
      }
      acc[sellerId].push(item);
      return acc;
    }, {});

    const createdOrders = [];

    // Create orders for each seller
    for (const [sellerId, sellerItems] of Object.entries(
      itemsBySeller,
    ) as any) {
      // Get seller information
      const { data: seller, error: sellerError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sellerId)
        .single();

      if (sellerError || !seller) {
        console.error(`Seller ${sellerId} not found`);
        continue;
      }

      // Calculate order total for this seller
      const orderTotal = (sellerItems as any[]).reduce(
        (sum, item) => sum + item.price,
        0,
      );

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
        console.error("Failed to create order:", orderError);
        continue;
      }

      createdOrders.push(order);

      // Mark books as sold
      const bookIds = sellerItems
        .map((item: any) => item.book_id)
        .filter(Boolean);
      if (bookIds.length > 0) {
        await supabase
          .from("books")
          .update({
            sold: true,
          })
          .in("id", bookIds);
      }

      // Send notification email to seller about new order using DIRECT HTML (the only way that works!)
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
    .warning {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      padding: 10px;
      border-radius: 5px;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 New Order - Action Required!</h1>
    </div>

    <h2>Hi ${seller.name}!</h2>
    <p>Great news! You have a new order from <strong>${buyer.name}</strong>.</p>

    <div class="info-box">
      <h3>📋 Order Details</h3>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Buyer:</strong> ${buyer.name}</p>
      <p><strong>Total Amount:</strong> R${orderTotal}</p>
    </div>

    <div class="warning">
      <h3>⏰ Action Required Within 48 Hours</h3>
      <p><strong>Expires:</strong> ${new Date(orderData.expires_at).toLocaleString()}</p>
      <p>You must commit to this order within 48 hours or it will be automatically cancelled.</p>
    </div>

    <p>Once you commit, we'll arrange pickup and you'll be paid after delivery!</p>

    <a href="${req.headers.get("origin")}/activity" class="btn">Commit to Order</a>

    <p><strong>ReBooked Solutions Team</strong></p>

    <div class="footer">
      <p><strong>This is an automated message from ReBooked Solutions.</strong><br>
      Please do not reply to this email.</p>
            <p>For help, contact support@rebookedsolutions.co.za<br>
      Visit our website: www.rebookedsolutions.co.za<br>
      T&Cs apply</p>
      <p><em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
  </div>
</body>
</html>`;

        const sellerText = `
New Order - Action Required!

Hi ${seller.name}!

Great news! You have a new order from ${buyer.name}.

Order Details:
- Order ID: ${orderId}
- Buyer: ${buyer.name}
- Total Amount: R${orderTotal}

⏰ Action Required Within 48 Hours
Expires: ${new Date(orderData.expires_at).toLocaleString()}

You must commit to this order within 48 hours or it will be automatically cancelled.

Once you commit, we'll arrange pickup and you'll be paid after delivery!

Commit to order: ${req.headers.get("origin")}/activity

ReBooked Solutions Team

This is an automated message from ReBooked Solutions. Please do not reply to this email.
For help, contact support@rebookedsolutions.co.za
Visit our website: www.rebookedsolutions.co.za
T&Cs apply
"Pre-Loved Pages, New Adventures"
        `;

        await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({
            to: seller.email,
            subject: "📚 New Order - Action Required (48 hours)",
            html: sellerHtml,
            text: sellerText,
          }),
        });
      } catch (emailError) {
        console.error("Failed to send seller notification:", emailError);
      }

      // Send confirmation email to buyer using DIRECT HTML (the only way that works!)
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
    .steps {
      background: #f3fef7;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
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

    <a href="${req.headers.get("origin")}/orders/${orderId}" class="btn">Check Order Status</a>

    <p><strong>ReBooked Solutions Team</strong></p>

    <div class="footer">
      <p><strong>This is an automated message from ReBooked Solutions.</strong><br>
      Please do not reply to this email.</p>
            <p>For help, contact support@rebookedsolutions.co.za<br>
      Visit our website: www.rebookedsolutions.co.za<br>
      T&Cs apply</p>
      <p><em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
  </div>
</body>
</html>`;

        const buyerText = `
Order Confirmed!

Thank you, ${buyer.name}!

Your order has been confirmed and ${seller.name} has been notified.

Order Details:
- Order ID: ${orderId}
- Seller: ${seller.name}
- Total Amount: R${orderTotal}

What happens next?
- The seller has 48 hours to commit to your order
- Once committed, we'll arrange pickup and delivery
- You'll receive tracking information via email
- Your book(s) will be delivered within 2-3 business days

We'll notify you as soon as the seller confirms your order!

Check order status: ${req.headers.get("origin")}/orders/${orderId}

ReBooked Solutions Team

This is an automated message from ReBooked Solutions. Please do not reply to this email.
For help, contact support@rebookedsolutions.co.za
Visit our website: www.rebookedsolutions.co.za
T&Cs apply
"Pre-Loved Pages, New Adventures"
        `;

        await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({
            to: buyer.email,
            subject: "🎉 Order Confirmed - Awaiting Seller Commitment",
            html: buyerHtml,
            text: buyerText,
          }),
        });
      } catch (emailError) {
        console.error("Failed to send buyer notification:", emailError);
      }
    }

    if (createdOrders.length === 0) {
      throw new Error("Failed to create any orders");
    }

    return new Response(
      JSON.stringify({
        success: true,
        orders: createdOrders,
        message: `Created ${createdOrders.length} order(s) successfully`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Create order error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to create orders",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
