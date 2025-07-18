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
      book_id,
      email,
      shipping_address,
      payment_reference,
      total_amount,
      delivery_details,
    } = await req.json();

    console.log("📦 Processing book purchase confirmation:", {
      user_id,
      book_id,
      payment_reference,
      total_amount,
    });

    if (!user_id || !book_id || !email || !payment_reference) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Missing required fields: user_id, book_id, email, payment_reference",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get book details with seller information
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select(
        `
        *,
        seller:profiles!books_seller_id_fkey(id, name, email, subaccount_code)
      `,
      )
      .eq("id", book_id)
      .single();

    if (bookError || !book) {
      throw new Error("Book not found");
    }

    // Check if buyer is trying to buy their own book
    if (book.seller_id === user_id) {
      throw new Error("Cannot purchase your own book");
    }

    // Get buyer information
    const { data: buyer, error: buyerError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user_id)
      .single();

    if (buyerError || !buyer) {
      throw new Error("Buyer not found");
    }

    // Generate unique order ID
    const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create order
    const orderData = {
      id: orderId,
      buyer_id: user_id,
      seller_id: book.seller_id,
      status: "pending_commit",
      total_amount: total_amount || book.price,
      items: [
        {
          book_id: book.id,
          title: book.title,
          price: book.price,
          condition: book.condition,
          seller_id: book.seller_id,
        },
      ],
      shipping_address,
      payment_reference,
      buyer_name: buyer.name,
      buyer_email: buyer.email,
      seller_name: book.seller.name,
      seller_email: book.seller.email,
      delivery_details: delivery_details || {},
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
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    // Mark book as sold
    const { error: bookUpdateError } = await supabase
      .from("books")
      .update({
        sold: true,
        sold_at: new Date().toISOString(),
        buyer_id: user_id,
        reserved_until: null,
        reserved_by: null,
      })
      .eq("id", book_id);

    if (bookUpdateError) {
      console.warn("Failed to mark book as sold:", bookUpdateError);
    }

    // Send notification emails
    try {
      // Email to seller
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

    <p>Hi ${book.seller.name}!</p>
    <p>Great news! You have a new order from <strong>${buyer.name}</strong>.</p>

    <p><strong>Order Details:</strong></p>
    <p>Order ID: ${orderId}<br>
    Book: ${book.title}<br>
    Buyer: ${buyer.name}<br>
    Total Amount: R${orderData.total_amount}</p>

    <p style="background: #fff3cd; padding: 15px; border-radius: 5px;">
      <strong>⏰ Action Required Within 48 Hours</strong><br>
      Expires: ${new Date(orderData.expires_at).toLocaleString()}<br>
      You must commit to this order within 48 hours or it will be automatically cancelled.
    </p>

    <p>Once you commit, we'll arrange pickup and you'll be paid after delivery!</p>

    <a href="https://rebookedsolutions.co.za/activity" class="btn">Commit to Order</a>

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

      await supabase.functions.invoke("send-email", {
        body: {
          to: book.seller.email,
          from: "noreply@rebookedsolutions.co.za",
          subject: "📚 New Order - Action Required (48 hours)",
          html: sellerHtml,
          text: `New Order - Action Required!\n\nHi ${book.seller.name}!\n\nGreat news! You have a new order from ${buyer.name}.\n\nOrder Details:\n- Order ID: ${orderId}\n- Book: ${book.title}\n- Buyer: ${buyer.name}\n- Total Amount: R${orderData.total_amount}\n\n⏰ Action Required Within 48 Hours\nExpires: ${new Date(orderData.expires_at).toLocaleString()}\n\nYou must commit to this order within 48 hours or it will be automatically cancelled.\n\nCommit to order: https://rebookedsolutions.co.za/activity\n\nReBooked Solutions`,
        },
      });

      // Email to buyer
      const buyerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmed - Thank You!</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f3fef7; padding: 20px; color: #1f4e3d; margin: 0; }
    .container { max-width: 500px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
    .header { background: #3ab26f; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -30px -30px 20px -30px; }
    .footer { background: #f3fef7; color: #1f4e3d; padding: 20px; text-align: center; font-size: 12px; line-height: 1.5; margin: 30px -30px -30px -30px; border-radius: 0 0 10px 10px; border-top: 1px solid #e5e7eb; }
    .info-box { background: #f3fef7; border: 1px solid #3ab26f; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .steps { background: #f3fef7; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .link { color: #3ab26f; }
    .btn { display: inline-block; padding: 12px 20px; background-color: #3ab26f; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
    </div>
    <h2>Thank you, ${buyer.name}!</h2>
    <p>Your order has been confirmed and <strong>${book.seller.name}</strong> has been notified.</p>
    <div class="info-box">
      <h3>📋 Order Details</h3>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Book:</strong> ${book.title}</p>
      <p><strong>Seller:</strong> ${book.seller.name}</p>
      <p><strong>Total Amount:</strong> R${orderData.total_amount}</p>
      <p><strong>Payment Reference:</strong> ${payment_reference}</p>
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
    <a href="https://rebookedsolutions.co.za/activity" class="btn">Track Your Order</a>
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

      await supabase.functions.invoke("send-email", {
        body: {
          to: buyer.email,
          from: "noreply@rebookedsolutions.co.za",
          subject: "🎉 Order Confirmed - Thank You!",
          html: buyerHtml,
          text: `Order Confirmed!\n\nThank you, ${buyer.name}!\n\nYour order has been confirmed and ${book.seller.name} has been notified.\n\nOrder Details:\n- Order ID: ${orderId}\n- Book: ${book.title}\n- Seller: ${book.seller.name}\n- Total Amount: R${orderData.total_amount}\n- Payment Reference: ${payment_reference}\n\nWhat happens next?\n- The seller has 48 hours to commit to your order\n- Once committed, we'll arrange pickup and delivery\n- You'll receive tracking information via email\n- Your book(s) will be delivered within 2-3 business days\n\nTrack your order: https://rebookedsolutions.co.za/activity\n\nReBooked Solutions`,
        },
      });
    } catch (emailError) {
      console.error("Failed to send notification emails:", emailError);
    }

    console.log("✅ Book purchase processed successfully:", {
      order_id: orderId,
      book_title: book.title,
      buyer: buyer.name,
      seller: book.seller.name,
    });

    return new Response(
      JSON.stringify({
        success: true,
        order_id: orderId,
        message: "Order created successfully",
        order: {
          id: orderId,
          book_title: book.title,
          seller_name: book.seller.name,
          total_amount: orderData.total_amount,
          status: "pending_commit",
          expires_at: orderData.expires_at,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("💥 Process book purchase error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to process book purchase",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
