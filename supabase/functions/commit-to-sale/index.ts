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
    const { order_id, seller_id } = await req.json();

    if (!order_id || !seller_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: order_id, seller_id",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get order details first
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        *,
        buyer:profiles!orders_buyer_id_fkey(id, name, email, phone),
        seller:profiles!orders_seller_id_fkey(id, name, email, phone),
        order_items(
          *,
          book:books(id, title, isbn, weight, dimensions)
        )
      `,
      )
      .eq("id", order_id)
      .eq("seller_id", seller_id)
      .eq("status", "pending_commit")
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Order not found or not in pending commit status",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Update order status to committed
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "committed",
        committed_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    if (updateError) {
      throw new Error(`Failed to update order status: ${updateError.message}`);
    }

    // Schedule automatic courier pickup by calling automate-delivery
    try {
      await supabase.functions.invoke("automate-delivery", {
        body: {
          order_id: order_id,
          seller_address: order.shipping_address,
          buyer_address: order.shipping_address,
          weight: order.order_items.reduce(
            (total: number, item: any) => total + (item.book?.weight || 0.5),
            0,
          ),
        },
      });
    } catch (deliveryError) {
      console.error("Failed to schedule automatic delivery:", deliveryError);
      // Continue anyway - delivery can be scheduled manually
    }

    // Send notification emails using DIRECT HTML (the only correct way!)
    try {
      // Notify buyer
      const buyerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmed - Pickup Scheduled</title>
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
    .link { color: #3ab26f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
    </div>

    <h2>Great news, ${order.buyer.name}!</h2>
    <p><strong>${order.seller.name}</strong> has confirmed your order and is preparing your book(s) for delivery.</p>

    <div class="info-box">
      <h3>📚 Order Details</h3>
      <p><strong>Order ID:</strong> ${order_id}</p>
      <p><strong>Book(s):</strong> ${order.order_items.map((item: any) => item.book?.title).join(", ")}</p>
      <p><strong>Seller:</strong> ${order.seller.name}</p>
      <p><strong>Estimated Delivery:</strong> 2-3 business days</p>
    </div>

    <p>Happy reading! 📖</p>

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
          to: order.buyer.email,
          subject: "Order Confirmed - Pickup Scheduled",
          html: buyerHtml,
          text: `Order Confirmed!\n\nGreat news, ${order.buyer.name}!\n\n${order.seller.name} has confirmed your order and is preparing your book(s) for delivery.\n\nOrder ID: ${order_id}\nBook(s): ${order.order_items.map((item: any) => item.book?.title).join(", ")}\nSeller: ${order.seller.name}\nEstimated Delivery: 2-3 business days\n\nReBooked Solutions\nThis is an automated message from ReBooked Solutions.`,
        },
      });

      // Notify seller
      const sellerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Commitment Confirmed - Prepare for Pickup</title>
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
    .link { color: #3ab26f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Order Commitment Confirmed!</h1>
    </div>

    <h2>Thank you, ${order.seller.name}!</h2>
    <p>You've successfully committed to sell your book(s). The buyer has been notified and pickup has been scheduled.</p>

    <div class="info-box">
      <h3>📋 Order Details</h3>
      <p><strong>Order ID:</strong> ${order_id}</p>
      <p><strong>Book(s):</strong> ${order.order_items.map((item: any) => item.book?.title).join(", ")}</p>
      <p><strong>Buyer:</strong> ${order.buyer.name}</p>
    </div>

    <p>A courier will contact you within 24 hours to arrange pickup.</p>
    <p>Thank you for selling with ReBooked Solutions! 📚</p>

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
          to: order.seller.email,
          subject: "Order Commitment Confirmed - Prepare for Pickup",
          html: sellerHtml,
          text: `Order Commitment Confirmed!\n\nThank you, ${order.seller.name}!\n\nYou've successfully committed to sell your book(s). The buyer has been notified and pickup has been scheduled.\n\nOrder ID: ${order_id}\nBook(s): ${order.order_items.map((item: any) => item.book?.title).join(", ")}\nBuyer: ${order.buyer.name}\n\nA courier will contact you within 24 hours to arrange pickup.\n\nReBooked Solutions`,
        },
      });
    } catch (emailError) {
      console.error("Failed to send notification emails:", emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order committed successfully",
        order_id,
        status: "committed",
        pickup_scheduled: true,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Commit to sale error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to commit order to sale",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
