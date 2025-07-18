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
      order_id,
      collected_by = "courier",
      collection_notes = "",
      tracking_reference = "",
      collected_at = new Date().toISOString(),
    } = await req.json();

    if (!order_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required field: order_id",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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
      return new Response(
        JSON.stringify({
          success: false,
          error: "Order not found",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check if order is in a state that allows collection
    if (!["committed", "courier_scheduled"].includes(order.status)) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Order must be committed and courier scheduled before collection",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
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
      await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({
          to: order.buyer.email,
          subject: "📦 Your order is on the way!",
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Collected - ReBooked Solutions</title>
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
      background: #f0f9ff;
      border: 1px solid #3ab26f;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .link {
      color: #3ab26f;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 Your Order is on the Way!</h1>
    </div>

    <h2>Hello ${order.buyer.name}!</h2>
    <p>Great news! Your order #${order_id} has been collected from ${order.seller.name} and is now being shipped to you.</p>

    <div class="info-box">
      <h3>📱 Tracking Information</h3>
      <p><strong>Tracking Reference:</strong> ${tracking_reference || "Will be provided soon"}</p>
      <p><strong>Estimated Delivery:</strong> 3-5 business days</p>
      <p><strong>Collected At:</strong> ${new Date(collected_at).toLocaleString()}</p>
    </div>

    <div class="info-box">
      <h3>📍 Delivery Address</h3>
      <p>${order.shipping_address?.address_line_1 || ""}<br>
      ${order.shipping_address?.address_line_2 || ""}<br>
      ${order.shipping_address?.city || ""}, ${order.shipping_address?.postal_code || ""}</p>
    </div>

    <p>You'll receive another notification with tracking details once your package is dispatched.</p>

    <p>Thank you for choosing ReBooked Solutions!</p>

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
</html>`,
          text: `Your Order is on the Way!

Hello ${order.buyer.name}!

Great news! Your order #${order_id} has been collected from ${order.seller.name} and is now being shipped to you.

Tracking Information:
Tracking Reference: ${tracking_reference || "Will be provided soon"}
Estimated Delivery: 3-5 business days
Collected At: ${new Date(collected_at).toLocaleString()}

Delivery Address:
${order.shipping_address?.address_line_1 || ""}
${order.shipping_address?.address_line_2 || ""}
${order.shipping_address?.city || ""}, ${order.shipping_address?.postal_code || ""}

You'll receive another notification with tracking details once your package is dispatched.

Thank you for choosing ReBooked Solutions!

This is an automated message from ReBooked Solutions. Please do not reply to this email.
For help, contact support@rebookedsolutions.co.za
Visit our website: www.rebookedsolutions.co.za
T&Cs apply
"Pre-Loved Pages, New Adventures"`,
        }),
      });

      // Notify seller about successful collection
      await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({
          to: order.seller.email,
          subject: "Order collected successfully",
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Collected - ReBooked Solutions</title>
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
    .success-box {
      background: #dcfce7;
      border: 1px solid #22c55e;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .link {
      color: #3ab26f;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
            <h1>Order Collected Successfully!</h1>
    </div>

    <h2>Hello ${order.seller.name}!</h2>
    <p>Your order #${order_id} has been successfully collected and is now being shipped to ${order.buyer.name}.</p>

    <div class="success-box">
      <h3>📋 Collection Details</h3>
      <p><strong>Collected At:</strong> ${new Date(collected_at).toLocaleString()}</p>
      <p><strong>Collected By:</strong> ${collected_by}</p>
      <p><strong>Tracking Reference:</strong> ${tracking_reference || "Being generated"}</p>
      ${collection_notes ? `<p><strong>Notes:</strong> ${collection_notes}</p>` : ""}
    </div>

    <p>The buyer will be notified about the shipment and you can expect your payment to be processed soon.</p>

    <p>Thank you for being part of the ReBooked Solutions community!</p>

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
</html>`,
          text: `Order Collected Successfully!

Hello ${order.seller.name}!

Your order #${order_id} has been successfully collected and is now being shipped to ${order.buyer.name}.

Collection Details:
Collected At: ${new Date(collected_at).toLocaleString()}
Collected By: ${collected_by}
Tracking Reference: ${tracking_reference || "Being generated"}
${collection_notes ? `Notes: ${collection_notes}` : ""}

The buyer will be notified about the shipment and you can expect your payment to be processed soon.

Thank you for being part of the ReBooked Solutions community!

This is an automated message from ReBooked Solutions. Please do not reply to this email.
For help, contact support@rebookedsolutions.co.za
Visit our website: www.rebookedsolutions.co.za
T&Cs apply
"Pre-Loved Pages, New Adventures"`,
        }),
      });
    } catch (emailError) {
      console.error("Failed to send collection notifications:", emailError);
      // Don't fail the collection process for email errors
    }

    // Schedule delivery completion check (e.g., after estimated delivery time)
    const estimatedDeliveryDate = new Date(
      Date.now() + 5 * 24 * 60 * 60 * 1000,
    ); // 5 days

    // This could trigger another function to check delivery status
    // For now, we'll just log it
    console.log(
      `Order ${order_id} collected, estimated delivery: ${estimatedDeliveryDate.toISOString()}`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        order: updatedOrder,
        collection: {
          collected_at,
          collected_by,
          tracking_reference,
          collection_notes,
        },
        message: "Order marked as collected successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Mark collected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to mark order as collected",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
