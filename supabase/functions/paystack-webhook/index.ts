import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  createSupabaseClient,
  createErrorResponse,
  createSuccessResponse,
  handleCORSPreflight,
  createHmacSignature,
  logFunction,
} from "../_shared/utils.ts";
import {
  ENV,
  validatePaystackConfig,
  validateSupabaseConfig,
} from "../_shared/config.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCORSPreflight(req);
  if (corsResponse) return corsResponse;

  try {
    logFunction("paystack-webhook", "Webhook received");

    // Validate configuration
    validatePaystackConfig();
    validateSupabaseConfig();

    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!signature) {
      return createErrorResponse("Missing webhook signature", 400);
    }

    logFunction("paystack-webhook", "Verifying signature", {
      bodyLength: body.length,
    });

    // Create hash to verify signature using Deno crypto
    const hash = await createHmacSignature(body, ENV.PAYSTACK_SECRET_KEY!);

    if (hash !== signature) {
      logFunction("paystack-webhook", "Invalid signature");
      return createErrorResponse("Invalid webhook signature", 400);
    }

    const event = JSON.parse(body);
    logFunction("paystack-webhook", "Processing event", {
      event: event.event,
      reference: event.data?.reference,
    });

    // Initialize Supabase client
    const supabase = createSupabaseClient();

    // Handle different event types
    switch (event.event) {
      case "charge.success":
        await handleSuccessfulPayment(supabase, event.data);
        break;

      case "charge.failed":
        await handleFailedPayment(supabase, event.data);
        break;

      case "transfer.success":
        console.log("Transfer successful:", event.data.reference);
        break;

      case "transfer.failed":
        console.log(
          "Transfer failed:",
          event.data.reference,
          event.data.failure_reason,
        );
        break;

      default:
        console.log("Unhandled webhook event:", event.event);
    }

    return createSuccessResponse({ message: "Webhook processed successfully" });
  } catch (error) {
    logFunction("paystack-webhook", "Error processing webhook", {
      error: error.message,
    });
    return createErrorResponse(error.message || "Internal server error", 500);
  }
});

async function handleSuccessfulPayment(supabase: any, paymentData: any) {
  try {
    console.log("Processing successful payment:", paymentData.reference);

    // Find transaction by Paystack reference
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .select("*")
      .eq("paystack_reference", paymentData.reference)
      .single();

    if (transactionError || !transaction) {
      console.error("Transaction not found:", paymentData.reference);
      return;
    }

    // Update transaction status
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status: "completed",
        committed_at: new Date().toISOString(),
        seller_committed: true,
      })
      .eq("id", transaction.id);

    if (updateError) {
      console.error("Error updating transaction:", updateError);
      return;
    }

    // Create payment split record for tracking
    const { error: splitError } = await supabase.from("payment_splits").insert({
      transaction_id: transaction.id,
      seller_subaccount: transaction.paystack_subaccount_code,
      book_amount: transaction.price,
      delivery_amount: transaction.delivery_fee || 0,
      platform_commission: transaction.commission,
      seller_amount: transaction.price - transaction.commission,
      courier_amount: transaction.delivery_fee || 0,
      split_executed: true,
      pickup_confirmed: true,
      paystack_reference: paymentData.reference,
    });

    if (splitError) {
      console.error("Error creating payment split record:", splitError);
    }

    // Ensure book remains sold
    await supabase
      .from("books")
      .update({ sold: true })
      .eq("id", transaction.book_id);

    console.log(
      "Payment processed successfully for transaction:",
      transaction.id,
    );
  } catch (error) {
    console.error("Error handling successful payment:", error);
  }
}

async function handleFailedPayment(supabase: any, paymentData: any) {
  try {
    console.log("Processing failed payment:", paymentData.reference);

    // Find transaction by Paystack reference
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .select("*")
      .eq("paystack_reference", paymentData.reference)
      .single();

    if (transactionError || !transaction) {
      console.error(
        "Transaction not found for failed payment:",
        paymentData.reference,
      );
      return;
    }

    // Update transaction status
    await supabase
      .from("transactions")
      .update({
        status: "failed",
        refunded: true,
        refund_reason: "Payment failed",
      })
      .eq("id", transaction.id);

    // Make book available again
    await supabase
      .from("books")
      .update({ sold: false })
      .eq("id", transaction.book_id);

    console.log("Failed payment processed for transaction:", transaction.id);
  } catch (error) {
    console.error("Error handling failed payment:", error);
  }
}
