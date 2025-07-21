import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { testFunction } from "../_mock-data/edge-function-tester.ts";
import { parseRequestBody } from "../_shared/safe-body-parser.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface CartItem {
  book_id: string;
  title: string;
  author: string;
  price: number;
  seller_id: string;
  condition?: string;
  isbn?: string;
}

interface CreateOrderRequest {
  buyer_id?: string; // Made optional for backward compatibility
  user_id?: string; // Alternative field name
  buyer_email?: string;
  email?: string; // Alternative field name
  cart_items?: CartItem[]; // Original field name
  items?: CartItem[]; // Alternative field name
  shipping_address: any;
  payment_reference?: string;
  total_amount?: number;
  payment_data?: any;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 🧪 TEST MODE: Check if this is a test request with mock data
  const testResult = await testFunction("create-order", req);
  if (testResult.isTest) {
    return testResult.response;
  }

  try {
    const {
      buyer_id,
      user_id,
      buyer_email,
      email,
      cart_items,
      items,
      shipping_address,
      payment_reference,
      total_amount,
      payment_data,
    }: CreateOrderRequest = await req.json();

    // Handle multiple field name variations for backward compatibility
    const finalBuyerId = buyer_id || user_id;
    const finalBuyerEmail = buyer_email || email;
    const finalItems = cart_items || items;

    if (
      !finalBuyerId ||
      !finalBuyerEmail ||
      !finalItems ||
      finalItems.length === 0
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Missing required fields: buyer_id/user_id, buyer_email/email, cart_items/items",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Generate payment reference if not provided (for testing)
    const finalPaymentRef =
      payment_reference ||
      `test_ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    console.log(
      `Creating orders for ${finalItems.length} items, buyer: ${finalBuyerEmail}`,
    );

    // Get buyer information
    const { data: buyer, error: buyerError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", finalBuyerId)
      .single();

    if (buyerError || !buyer) {
      throw new Error("Buyer not found");
    }

    // Group cart items by seller to create separate orders
    const ordersBySeller = new Map<string, CartItem[]>();

    finalItems.forEach((item) => {
      if (!ordersBySeller.has(item.seller_id)) {
        ordersBySeller.set(item.seller_id, []);
      }
      ordersBySeller.get(item.seller_id)!.push(item);
    });

    const createdOrders = [];
    const bookIds = finalItems.map((item) => item.book_id);

    // Mark all books as sold first (atomic operation)
    const { error: markSoldError } = await supabase
      .from("books")
      .update({
        sold: true,
        sold_at: new Date().toISOString(),
        buyer_id: finalBuyerId,
        updated_at: new Date().toISOString(),
      })
      .in("id", bookIds)
      .eq("sold", false);

    if (markSoldError) {
      throw new Error(`Failed to mark books as sold: ${markSoldError.message}`);
    }

    // Create orders for each seller
    for (const [sellerId, items] of ordersBySeller) {
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

      const orderTotal = items.reduce((sum, item) => sum + item.price, 0);
      const commitDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now

      // Generate unique order ID
      const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const orderData = {
        id: orderId,
        buyer_id: finalBuyerId,
        seller_id: sellerId,
        status: "pending_commit",
        total_amount: orderTotal,
        items: items.map((item) => ({
          book_id: item.book_id,
          title: item.title,
          author: item.author,
          price: item.price,
          condition: item.condition,
          seller_id: item.seller_id,
        })),
        shipping_address,
        payment_reference: finalPaymentRef,
        payment_data,
        buyer_name: buyer.name,
        buyer_email: finalBuyerEmail,
        seller_name: seller.name,
        seller_email: seller.email,
        expires_at: commitDeadline.toISOString(),
        created_at: new Date().toISOString(),
        // Legacy fields for backward compatibility
        amount: Math.round(orderTotal),
        payment_status: "paid",
        paystack_ref: finalPaymentRef,
        delivery_address: shipping_address,
        commit_deadline: commitDeadline.toISOString(),
        paid_at: new Date().toISOString(),
        metadata: {
          created_from: "cart",
          item_count: items.length,
          created_at: new Date().toISOString(),
        },
      };

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error(
          "Failed to create order for seller:",
          sellerId,
          orderError,
        );
        throw new Error(`Failed to create order: ${orderError.message}`);
      }

      createdOrders.push(order);

      // Create order notification for seller
      try {
        await supabase.functions.invoke("create-order-notification", {
          body: {
            order_id: order.id,
            user_id: sellerId,
            type: "new_order",
            title: "New Order Received!",
            message: `You have a new order for ${items.length} book(s). Please commit within 48 hours.`,
          },
        });
      } catch (notificationError) {
        console.error("Failed to create notification:", notificationError);
      }

      console.log(
        `Created order ${order.id} for seller ${sellerId} with ${items.length} items`,
      );
    }

    if (createdOrders.length === 0) {
      throw new Error("Failed to create any orders");
    }

    // Send notification emails using DIRECT HTML (the only correct way!)
    const emailPromises = [];

    // Send buyer confirmation email
    try {
      const buyerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmed - Thank You!</title>
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
    .order-item {
      background: #f9fafb;
      border-left: 3px solid #3ab26f;
      padding: 10px;
      margin: 5px 0;
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
    .link { color: #3ab26f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
    </div>

    <h2>Thank you, ${buyer.name}!</h2>
    <p>Your order has been confirmed and the sellers have been notified.</p>

    <div class="info-box">
      <h3>📊 Order Summary</h3>
      <p><strong>Total Orders:</strong> ${createdOrders.length}</p>
      <p><strong>Total Amount:</strong> R${createdOrders.reduce((sum, order) => sum + order.total_amount, 0).toFixed(2)}</p>
      <p><strong>Total Books:</strong> ${finalItems.length}</p>
    </div>

    ${createdOrders
      .map(
        (order) => `
    <div class="order-item">
      <h4>Order #${order.id}</h4>
      <p><strong>Seller:</strong> ${order.seller_name}</p>
      <p><strong>Items:</strong> ${order.items.length} book(s)</p>
      <p><strong>Amount:</strong> R${order.total_amount.toFixed(2)}</p>
      <p><strong>Expires:</strong> ${new Date(order.expires_at).toLocaleString()}</p>
    </div>
    `,
      )
      .join("")}

    <div class="info-box">
      <h3>📦 What happens next?</h3>
      <ul>
        <li>Each seller has 48 hours to commit to their orders</li>
        <li>Once committed, we'll arrange pickup and delivery</li>
        <li>You'll receive tracking information via email</li>
        <li>Your books will be delivered within 2-3 business days</li>
      </ul>
    </div>

    <p>We'll notify you as soon as each seller confirms their order!</p>

    <a href="${req.headers.get("origin")}/activity" class="btn">Track Your Orders</a>

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

      emailPromises.push(
        fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({
            to: finalBuyerEmail,
            subject: "🎉 Order Confirmed - Thank You!",
            html: buyerHtml,
            text: `Order Confirmed!\n\nThank you, ${buyer.name}!\n\nYour order has been confirmed and the sellers have been notified.\n\nTotal Orders: ${createdOrders.length}\nTotal Amount: R${createdOrders.reduce((sum, order) => sum + order.total_amount, 0).toFixed(2)}\nTotal Books: ${finalItems.length}\n\nReBooked Solutions`,
          }),
        }),
      );
    } catch (emailError) {
      console.error("Failed to prepare buyer email:", emailError);
    }

    // Send seller notification emails
    for (const order of createdOrders) {
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
    .link { color: #3ab26f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 New Order - Action Required!</h1>
    </div>

    <h2>Hi ${order.seller_name}!</h2>
    <p>Great news! You have a new order from <strong>${buyer.name}</strong>.</p>

    <div class="info-box">
      <h3>📋 Order Details</h3>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Buyer:</strong> ${buyer.name} (${finalBuyerEmail})</p>
      <p><strong>Items:</strong> ${order.items.length} book(s)</p>
      <p><strong>Total Amount:</strong> R${order.total_amount.toFixed(2)}</p>
    </div>

    <div class="info-box">
      <h3>📚 Books Ordered</h3>
      ${order.items
        .map(
          (item) => `
        <p><strong>${item.title}</strong> by ${item.author}<br>
        Condition: ${item.condition || "Not specified"} - R${item.price.toFixed(2)}</p>
      `,
        )
        .join("")}
    </div>

    <div class="warning">
      <h3>⏰ Action Required Within 48 Hours</h3>
      <p><strong>Expires:</strong> ${new Date(order.expires_at).toLocaleString()}</p>
      <p>You must commit to this order within 48 hours or it will be automatically cancelled and refunded.</p>
    </div>

    <p>Once you commit, we'll arrange pickup and you'll be paid after delivery!</p>

    <a href="${req.headers.get("origin")}/activity" class="btn">Commit to Order</a>

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

        emailPromises.push(
          fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
            body: JSON.stringify({
              to: order.seller_email,
              subject: "📚 New Order - Action Required (48 hours)",
              html: sellerHtml,
              text: `New Order - Action Required!\n\nHi ${order.seller_name}!\n\nGreat news! You have a new order from ${buyer.name}.\n\nOrder Details:\n- Order ID: ${order.id}\n- Buyer: ${buyer.name} (${finalBuyerEmail})\n- Items: ${order.items.length} book(s)\n- Total Amount: R${order.total_amount.toFixed(2)}\n\n⏰ Action Required Within 48 Hours\nExpires: ${new Date(order.expires_at).toLocaleString()}\n\nYou must commit to this order within 48 hours or it will be automatically cancelled.\n\nCommit to order: ${req.headers.get("origin")}/activity\n\nReBooked Solutions`,
            }),
          }),
        );
      } catch (emailError) {
        console.error("Failed to prepare seller email:", emailError);
      }
    }

    // Wait for emails to send (but don't fail if they don't)
    const emailResults = await Promise.allSettled(emailPromises);
    const emailErrors = emailResults.filter(
      (result) => result.status === "rejected",
    ).length;

    if (emailErrors > 0) {
      console.warn(
        `${emailErrors} email(s) failed to send out of ${emailPromises.length}`,
      );
    }

    const response = {
      success: true,
      orders: createdOrders.map((order) => ({
        id: order.id,
        seller_id: order.seller_id,
        seller_name: order.seller_name,
        total_amount: order.total_amount,
        item_count: order.items.length,
        commit_deadline: order.expires_at,
        status: order.status,
      })),
      total_orders: createdOrders.length,
      total_amount: createdOrders.reduce(
        (sum, order) => sum + order.total_amount,
        0,
      ),
      books_marked_sold: bookIds.length,
      emails_sent: emailPromises.length - emailErrors,
      payment_reference: finalPaymentRef,
      message: `Created ${createdOrders.length} order(s) successfully`,
    };

    console.log("Order creation completed:", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
        console.error("Create order error:", error?.message || error);

    return new Response(
      JSON.stringify({
        success: false,
                error: error?.message || String(error) || "Failed to create orders",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
