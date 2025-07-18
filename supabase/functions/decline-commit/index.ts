import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { refundTransaction } from "../_shared/paystack-refund.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order_id, seller_id, reason } = await req.json();

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
        buyer:profiles!orders_buyer_id_fkey(id, name, email),
        seller:profiles!orders_seller_id_fkey(id, name, email)
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

    // Update order status to declined
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "declined",
        declined_at: new Date().toISOString(),
        decline_reason: reason || "Seller declined to commit",
      })
      .eq("id", order_id);

    if (updateError) {
      throw new Error(`Failed to update order status: ${updateError.message}`);
    }

    // Process actual Paystack refund
    let refundResult = null;
    if (order.payment_reference) {
      console.log(`🔄 Processing Paystack refund for order ${order_id}`);

      refundResult = await refundTransaction(
        order.payment_reference,
        null, // Full refund
        reason || "Order declined by seller",
      );

      if (refundResult.success) {
        console.log(`✅ Refund processed successfully for order ${order_id}`);

        // Store refund details in database
        const { error: refundError } = await supabase
          .from("refund_transactions")
          .insert({
            id: `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            order_id: order_id,
            transaction_reference: order.payment_reference,
            refund_reference: refundResult.data.id,
            amount: order.total_amount,
            reason: reason || "Order declined by seller",
            status: refundResult.data.status || "pending",
            paystack_response: refundResult.data,
            created_at: new Date().toISOString(),
          });

        if (refundError) {
          console.error("Failed to store refund transaction:", refundError);
        }

        // Update order with refund info
        await supabase
          .from("orders")
          .update({
            refund_status: refundResult.data.status,
            refund_reference: refundResult.data.id,
            refunded_at: new Date().toISOString(),
          })
          .eq("id", order_id);
      } else {
        console.error(
          `❌ Refund failed for order ${order_id}:`,
          refundResult.error,
        );
        // Continue with the process even if refund fails - manual intervention may be needed
      }
    } else {
      console.warn(
        `⚠️ No payment reference found for order ${order_id} - refund may need manual processing`,
      );
    }

    // Send notification emails using DIRECT HTML (the only correct way!)
    try {
      // Notify buyer
      const buyerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Declined - Refund Processed</title>
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
      <h1>❌ Order Declined</h1>
    </div>

    <h2>Hello ${order.buyer.name},</h2>
    <p>We're sorry to inform you that your order has been declined by the seller.</p>

    <div class="info-box">
      <h3>📋 Order Details</h3>
      <p><strong>Order ID:</strong> ${order_id}</p>
      <p><strong>Amount:</strong> R${order.total_amount}</p>
      <p><strong>Reason:</strong> ${reason || "Seller declined to commit"}</p>
    </div>

        ${
          refundResult?.success
            ? `
    <div class="info-box">
      <h3>💰 Refund Details</h3>
      <p><strong>Refund Status:</strong> ${refundResult.data.status}</p>
      <p><strong>Refund Reference:</strong> ${refundResult.data.id}</p>
      <p><strong>Expected Processing:</strong> 3-5 business days</p>
    </div>
    <p><strong>✅ Your refund has been successfully processed and will appear in your account within 3-5 business days.</strong></p>
    `
            : `
    <p><strong>⚠️ Your refund is being processed manually and will appear in your account within 3-5 business days.</strong></p>
    `
        }

    <p>We apologize for any inconvenience. Please feel free to browse our marketplace for similar books from other sellers.</p>

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
          subject: "Order Declined - Refund Processed",
          html: buyerHtml,
          text: `Order Declined\n\nHello ${order.buyer.name},\n\nWe're sorry to inform you that your order has been declined by the seller.\n\nOrder ID: ${order_id}\nAmount: R${order.total_amount}\nReason: ${reason || "Seller declined to commit"}\n\nYour refund has been processed and will appear in your account within 3-5 business days.\n\nReBooked Solutions`,
        },
      });

      // Notify seller
      const sellerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Decline Confirmation</title>
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
      <h1>Order Decline Confirmed</h1>
    </div>

    <h2>Hello ${order.seller.name},</h2>
    <p>You have successfully declined the order commitment.</p>

    <div class="info-box">
      <h3>📋 Order Details</h3>
      <p><strong>Order ID:</strong> ${order_id}</p>
      <p><strong>Reason:</strong> ${reason || "You declined to commit"}</p>
    </div>

    <p>The buyer has been notified and their payment has been refunded.</p>

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
          subject: "Order Decline Confirmation",
          html: sellerHtml,
          text: `Order Decline Confirmed\n\nHello ${order.seller.name},\n\nYou have successfully declined the order commitment.\n\nOrder ID: ${order_id}\nReason: ${reason || "You declined to commit"}\n\nThe buyer has been notified and their payment has been refunded.\n\nReBooked Solutions`,
        },
      });
    } catch (emailError) {
      console.error("Failed to send notification emails:", emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order declined successfully",
        order_id,
        refund_amount: order.total_amount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Decline commit error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to decline order commit",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
