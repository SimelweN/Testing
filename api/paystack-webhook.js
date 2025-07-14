import crypto from "crypto";
import { handleCORS, createSupabaseClient, logEvent } from "./_lib/utils.js";

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
    const signature = req.headers["x-paystack-signature"];

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: "Missing signature",
      });
    }

    // Get raw body
    let body = "";
    if (req.body) {
      body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }

    // Verify webhook signature
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      logEvent("webhook_signature_invalid", { signature });
      return res.status(401).json({
        success: false,
        error: "Invalid signature",
      });
    }

    const event = JSON.parse(body);
    logEvent("paystack_webhook_received", { event: event.event });

    const supabase = createSupabaseClient();

    switch (event.event) {
      case "charge.success":
        await handleChargeSuccess(supabase, event.data, req);
        break;

      case "charge.failed":
        await handleChargeFailed(supabase, event.data);
        break;

      case "transfer.success":
        await handleTransferSuccess(supabase, event.data);
        break;

      case "transfer.failed":
        await handleTransferFailed(supabase, event.data);
        break;

      case "subscription.create":
      case "subscription.disable":
        // Handle subscription events if needed
        break;

      default:
        logEvent("webhook_event_unhandled", { event: event.event });
    }

    return res.status(200).json({
      success: true,
      message: "Webhook processed",
    });
  } catch (error) {
    logEvent("paystack_webhook_error", { error: error.message });

    return res.status(500).json({
      success: false,
      error: "Error processing webhook",
    });
  }
}

async function handleChargeSuccess(supabase, data, req) {
  try {
    const { reference, amount, customer, metadata } = data;

    // Update transaction status
    await supabase
      .from("payment_transactions")
      .update({
        status: "success",
        paystack_response: data,
        verified_at: new Date().toISOString(),
      })
      .eq("reference", reference);

    // If this is a new payment that hasn't been processed yet
    if (metadata?.user_id && metadata?.items) {
      // Create orders for the successful payment
      const orderResponse = await fetch(
        `${req.headers.host}/api/create-order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: metadata.user_id,
            items: metadata.items,
            total_amount: amount / 100,
            shipping_address: metadata.shipping_address,
            payment_reference: reference,
            payment_data: data,
          }),
        },
      );

      const orderResult = await orderResponse.json();

      if (orderResult.success) {
        logEvent("webhook_orders_created", {
          reference,
          orders_count: orderResult.orders?.length || 0,
        });
      } else {
        logEvent("webhook_order_creation_failed", {
          reference,
          error: orderResult.error,
        });
      }
    }

    logEvent("charge_success_processed", { reference, amount });
  } catch (error) {
    logEvent("charge_success_error", {
      reference: data.reference,
      error: error.message,
    });
  }
}

async function handleChargeFailed(supabase, data) {
  try {
    const { reference } = data;

    await supabase
      .from("payment_transactions")
      .update({
        status: "failed",
        paystack_response: data,
        updated_at: new Date().toISOString(),
      })
      .eq("reference", reference);

    logEvent("charge_failed_processed", { reference });
  } catch (error) {
    logEvent("charge_failed_error", {
      reference: data.reference,
      error: error.message,
    });
  }
}

async function handleTransferSuccess(supabase, data) {
  try {
    const { reference, recipient } = data;

    // Update payout status
    await supabase
      .from("seller_payouts")
      .update({
        status: "completed",
        transfer_response: data,
        completed_at: new Date().toISOString(),
      })
      .eq("transfer_reference", reference);

    logEvent("transfer_success_processed", { reference });
  } catch (error) {
    logEvent("transfer_success_error", {
      reference: data.reference,
      error: error.message,
    });
  }
}

async function handleTransferFailed(supabase, data) {
  try {
    const { reference } = data;

    await supabase
      .from("seller_payouts")
      .update({
        status: "failed",
        transfer_response: data,
        updated_at: new Date().toISOString(),
      })
      .eq("transfer_reference", reference);

    logEvent("transfer_failed_processed", { reference });
  } catch (error) {
    logEvent("transfer_failed_error", {
      reference: data.reference,
      error: error.message,
    });
  }
}
