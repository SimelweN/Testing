import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Paystack Webhook Received ===");

    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    console.log("Webhook signature:", signature);
    console.log("Webhook body length:", body.length);

    // Verify webhook signature
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      console.error("PAYSTACK_SECRET_KEY not configured");
      return new Response("Configuration error", { status: 500 });
    }

    // Create hash to verify signature
    const crypto = await import("node:crypto");
    const hash = crypto
      .createHmac("sha512", paystackSecretKey)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      console.error("Invalid webhook signature");
      return new Response("Invalid signature", { status: 400 });
    }

    const event = JSON.parse(body);
    console.log("Webhook event:", event.event, event.data?.reference);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

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

    return new Response("OK", {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response("Internal server error", {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
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
