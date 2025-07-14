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

    // Send notification email to seller
    try {
      await fetch(`${req.headers.host}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: seller.email,
          subject: "💰 Your payment is on the way!",
          template: {
            name: "seller-payout-notification",
            data: {
              sellerName: seller.name,
              orderId: order_id,
              amount: sellerAmount,
              platformFee: platformFee,
              totalAmount: amount,
              transferReference: transferData.reference,
            },
          },
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
