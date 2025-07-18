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
    const { order_id, reason, admin_action = false } = body;

    validateFields(body, ["order_id", "reason"]);

    logEvent("refund_processing_started", { order_id, reason, admin_action });

    const supabase = createSupabaseClient();

    // Get order details with payment information
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        *,
        buyer:profiles!buyer_id(id, name, email),
        seller:profiles!seller_id(id, name, email)
      `,
      )
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // Check if refund already exists
    const { data: existingRefund } = await supabase
      .from("refund_transactions")
      .select("*")
      .eq("order_id", order_id)
      .single();

    if (existingRefund && existingRefund.status === "success") {
      return res.status(200).json({
        success: true,
        message: "Refund already processed",
        refund: existingRefund,
      });
    }

    // Validate that refund is allowed
    const canRefund = await validateRefundEligibility(order);
    if (!canRefund.allowed) {
      return res.status(400).json({
        success: false,
        error: canRefund.reason || "Refund not allowed for this order",
      });
    }

    // Process refund with Paystack
    const refundResult = await processPaystackRefund(
      order.payment_reference,
      order.total_amount,
      reason,
    );

    if (!refundResult.success) {
      throw new Error(`Paystack refund failed: ${refundResult.error}`);
    }

    // Store refund in database
    const refundData = {
      id: `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      order_id: order_id,
      transaction_reference: order.payment_reference,
      refund_reference: refundResult.refund_id,
      amount: order.total_amount,
      reason: reason,
      status: refundResult.status || "pending",
      paystack_response: refundResult.data,
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from("refund_transactions")
      .insert(refundData);

    if (insertError) {
      logEvent("refund_storage_failed", {
        order_id,
        error: insertError.message,
      });
    }

    // Update order status
    await supabase
      .from("orders")
      .update({
        status: "refunded",
        refund_status: refundResult.status,
        refund_reference: refundResult.refund_id,
        refunded_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    // Make book available again if it was marked as sold
    if (order.book_id) {
      await supabase
        .from("books")
        .update({
          sold: false,
          sold_at: null,
          buyer_id: null,
          reserved_until: null,
          reserved_by: null,
        })
        .eq("id", order.book_id);
    }

    // Send notification emails
    await sendRefundNotifications(order, refundResult, reason);

    logEvent("refund_processed", {
      order_id,
      refund_id: refundResult.refund_id,
      amount: order.total_amount,
    });

    return res.status(200).json({
      success: true,
      refund: {
        id: refundData.id,
        refund_reference: refundResult.refund_id,
        amount: order.total_amount,
        status: refundResult.status,
        expected_date: calculateExpectedRefundDate(),
      },
      message: "Refund processed successfully",
    });
  } catch (error) {
    logEvent("refund_processing_error", { error: error.message });

    let statusCode = 500;
    if (error.message.includes("Missing required fields")) {
      statusCode = 400;
    } else if (error.message.includes("not found")) {
      statusCode = 404;
    }

    return res.status(statusCode).json({
      success: false,
      error: error.message || "Failed to process refund",
    });
  }
}

async function validateRefundEligibility(order) {
  // Allow refunds for pending, committed, or failed orders
  const refundableStatuses = [
    "pending_commit",
    "committed",
    "pickup_scheduled",
    "pickup_attempted",
    "failed",
    "cancelled",
  ];

  if (!refundableStatuses.includes(order.status)) {
    return {
      allowed: false,
      reason: "Refund not allowed for orders in this status",
    };
  }

  // Don't allow refunds for already delivered orders
  if (order.delivery_status === "delivered") {
    return {
      allowed: false,
      reason: "Cannot refund delivered orders",
    };
  }

  return { allowed: true };
}

async function processPaystackRefund(transactionReference, amount, reason) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error("Paystack secret key not configured");
    }

    const refundData = {
      transaction: transactionReference,
      amount: Math.round(amount * 100), // Convert to kobo
      currency: "ZAR",
      customer_note: reason,
      merchant_note: `Refund for transaction ${transactionReference}`,
    };

    const response = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(refundData),
    });

    const result = await response.json();

    if (!result.status) {
      throw new Error(result.message || "Paystack refund request failed");
    }

    return {
      success: true,
      refund_id: result.data.id,
      status: result.data.status || "pending",
      data: result.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Paystack refund failed",
    };
  }
}

async function sendRefundNotifications(order, refundResult, reason) {
  try {
    const expectedDate = calculateExpectedRefundDate();

    // Email to buyer
    const buyerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Refund Processed - ReBooked Solutions</title>
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
      <h1>💰 Refund Processed</h1>
    </div>

    <h2>Hi ${order.buyer.name}!</h2>
    <p>Your refund has been processed successfully.</p>

    <div class="info-box">
      <h3>💸 Refund Details</h3>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Refund Amount:</strong> R${order.total_amount}</p>
      <p><strong>Refund Reference:</strong> ${refundResult.refund_id}</p>
      <p><strong>Expected Date:</strong> ${expectedDate}</p>
      <p><strong>Reason:</strong> ${reason}</p>
    </div>

    <p>Your refund will appear in your account within 3-5 business days.</p>
    <p>Thank you for using ReBooked Solutions!</p>

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

    await fetch(
      `${process.env.VERCEL_URL || "http://localhost:3000"}/api/send-email`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: order.buyer.email,
          subject: "💰 Refund Processed - ReBooked Solutions",
          html: buyerHtml,
          text: `Refund Processed\n\nHi ${order.buyer.name}!\n\nYour refund has been processed successfully.\n\nRefund Details:\n- Order ID: ${order.id}\n- Refund Amount: R${order.total_amount}\n- Refund Reference: ${refundResult.refund_id}\n- Expected Date: ${expectedDate}\n- Reason: ${reason}\n\nYour refund will appear in your account within 3-5 business days.\n\nReBooked Solutions`,
        }),
      },
    );
  } catch (error) {
    logEvent("refund_notification_failed", {
      order_id: order.id,
      error: error.message,
    });
  }
}

function calculateExpectedRefundDate() {
  const date = new Date();
  date.setDate(date.getDate() + 5); // 5 business days
  return date.toLocaleDateString();
}
