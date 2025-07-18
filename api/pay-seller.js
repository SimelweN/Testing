import {
  handleCORS,
  createSupabaseClient,
  validateFields,
  logEvent,
  parseRequestBody,
} from "./_lib/utils.js";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

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
    const { order_id, seller_id, amount, trigger = "manual" } = body;

    validateFields(body, ["order_id", "seller_id", "amount"]);

    logEvent("seller_payout_started", { order_id, seller_id, amount, trigger });

    const supabase = createSupabaseClient();

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
      return res.status(200).json({
        success: true,
        message: "Payout already completed",
        payout: existingPayout,
      });
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

    // Send notification email to seller using DIRECT HTML (the only correct way!)
    try {
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Payment is on the Way - ReBooked Solutions</title>
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
    .total {
      font-weight: bold;
      font-size: 18px;
      color: #3ab26f;
    }
    .link { color: #3ab26f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Your Payment is on the Way!</h1>
    </div>

    <h2>Great news, ${seller.name}!</h2>
    <p>Your payment for the completed order has been processed and is on its way to your account.</p>

    <div class="info-box">
      <h3>📋 Payment Details</h3>
      <p><strong>Order ID:</strong> ${order_id}</p>
      <p><strong>Your Earnings:</strong> R${sellerAmount}</p>
      <p><strong>Platform Fee:</strong> R${platformFee}</p>
      <p><strong>Total Order Value:</strong> R${amount}</p>
      <p><strong>Transfer Reference:</strong> ${transferData.reference}</p>
    </div>

    <div class="total">
      <p>You will receive: R${sellerAmount}</p>
    </div>

    <p>The payment should reflect in your account within 2-3 business days.</p>
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

      await fetch(`${req.headers.host}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: seller.email,
          from: "noreply@rebookedsolutions.co.za",
          subject: "💰 Your payment is on the way!",
          html: html,
          text: `Your Payment is on the Way!\n\nGreat news, ${seller.name}!\n\nYour payment for the completed order has been processed and is on its way to your account.\n\nPayment Details:\n- Order ID: ${order_id}\n- Your Earnings: R${sellerAmount}\n- Platform Fee: R${platformFee}\n- Total Order Value: R${amount}\n- Transfer Reference: ${transferData.reference}\n\nYou will receive: R${sellerAmount}\n\nThe payment should reflect in your account within 2-3 business days.\n\nReBooked Solutions`,
        }),
      });
    } catch (emailError) {
      logEvent("payout_notification_failed", {
        order_id,
        error: emailError.message,
      });
    }

    logEvent("seller_payout_initiated", {
      order_id,
      seller_id,
      amount: sellerAmount,
      reference: transferData.reference,
    });

    return res.status(200).json({
      success: true,
      payout,
      transfer: paystackResult.data,
      message: "Payout initiated successfully",
    });
  } catch (error) {
    logEvent("seller_payout_error", { error: error.message });

    let statusCode = 500;
    if (error.message.includes("Missing required fields")) {
      statusCode = 400;
    } else if (error.message.includes("not found")) {
      statusCode = 404;
    } else if (error.message.includes("must be delivered")) {
      statusCode = 400;
    }

    return res.status(statusCode).json({
      success: false,
      error: error.message || "Failed to process seller payout",
    });
  }
}
