import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      order_id,
      seller_id,
      amount,
      trigger = "manual",
    } = await req.json();

    if (!order_id || !seller_id || !amount) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: order_id, seller_id, amount",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get order and seller details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        *,
                        seller:profiles!orders_seller_id_fkey(id, name, email, subaccount_code)
      `,
      )
      .eq("id", order_id)
      .eq("seller_id", seller_id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found or access denied");
    }

    // Check if order is in a state that allows payout
    if (!["delivered", "completed"].includes(order.status)) {
      throw new Error("Order must be delivered or completed before payout");
    }

    // Check if payout already exists
    const { data: existingPayout } = await supabase
      .from("seller_payouts")
      .select("*")
      .eq("order_id", order_id)
      .eq("seller_id", seller_id)
      .single();

    if (existingPayout && existingPayout.status === "completed") {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Payout already completed",
          payout: existingPayout,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const seller = order.seller;
    if (!seller?.subaccount_code) {
      throw new Error("Seller subaccount not found. Banking details required.");
    }

    // Calculate platform fee (e.g., 5%)
    const platformFeeRate = 0.05;
    const platformFee = amount * platformFeeRate;
    const sellerAmount = amount - platformFee;

    // Create transfer to seller's subaccount
    const transferData = {
      source: "balance",
      amount: Math.round(sellerAmount * 100), // Convert to kobo
      recipient: seller.subaccount_code,
      reason: `Payout for order ${order_id}`,
      reference: `payout_${order_id}_${Date.now()}`,
      currency: "ZAR",
    };

    const paystackResponse = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transferData),
    });

    const paystackResult = await paystackResponse.json();

    if (!paystackResult.status) {
      throw new Error(`Paystack transfer failed: ${paystackResult.message}`);
    }

    // Record payout in database
    const payoutData = {
      order_id,
      seller_id,
      amount: sellerAmount,
      platform_fee: platformFee,
      total_amount: amount,
      transfer_reference: transferData.reference,
      paystack_response: paystackResult.data,
      status: "pending",
      triggered_by: trigger,
      created_at: new Date().toISOString(),
    };

    const { data: payout, error: payoutError } = await supabase
      .from("seller_payouts")
      .upsert(payoutData)
      .select()
      .single();

    if (payoutError) {
      throw new Error(`Failed to record payout: ${payoutError.message}`);
    }

    // Update order status to indicate payout initiated
    await supabase
      .from("orders")
      .update({
        payout_status: "initiated",
        payout_initiated_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    // Send notification email to seller
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({
          to: seller.email,
          subject: "💰 Your payment is on the way!",
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Processing - ReBooked Solutions</title>
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
    .amount-box {
      background: #f0f9ff;
      border: 1px solid #3ab26f;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
      text-align: center;
    }
    .link {
      color: #3ab26f;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Your Payment is on the Way!</h1>
    </div>

    <h2>Hello ${seller.name}!</h2>
    <p>Great news! Your payment for order #${order_id} has been processed and is on its way to your bank account.</p>

    <div class="amount-box">
      <h3>💳 Payment Details</h3>
      <p><strong>Your Amount:</strong> R${sellerAmount.toFixed(2)}</p>
      <p><strong>Platform Fee:</strong> R${platformFee.toFixed(2)}</p>
      <p><strong>Order Total:</strong> R${amount.toFixed(2)}</p>
      <p><strong>Transfer Reference:</strong> ${transferData.reference}</p>
    </div>

    <p>The payment should reflect in your bank account within 1-3 business days.</p>

    <p>Thank you for being part of the ReBooked Solutions community!</p>

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
</html>`,
          text: `Your Payment is on the Way!

Hello ${seller.name}!

Great news! Your payment for order #${order_id} has been processed and is on its way to your bank account.

Payment Details:
Your Amount: R${sellerAmount.toFixed(2)}
Platform Fee: R${platformFee.toFixed(2)}
Order Total: R${amount.toFixed(2)}
Transfer Reference: ${transferData.reference}

The payment should reflect in your bank account within 1-3 business days.

Thank you for being part of the ReBooked Solutions community!

This is an automated message from ReBooked Solutions. Please do not reply to this email.
For assistance, contact: support@rebookedsolutions.co.za
Visit us at: https://rebookedsolutions.co.za
T&Cs apply.
"Pre-Loved Pages, New Adventures"`,
        }),
      });
    } catch (emailError) {
      console.error("Failed to send payout notification:", emailError);
      // Don't fail the payout for email errors
    }

    return new Response(
      JSON.stringify({
        success: true,
        payout,
        transfer: paystackResult.data,
        message: "Payout initiated successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Seller payout error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to process seller payout",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
