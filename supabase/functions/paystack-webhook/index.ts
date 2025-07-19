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

    // Validate request method
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "METHOD_NOT_ALLOWED",
          details: {
            provided_method: req.method,
            required_method: "POST",
            message: "Webhook endpoint only accepts POST requests",
          },
          fix_instructions: "Send webhook events using POST method only",
        }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    console.log("Webhook signature:", signature ? "present" : "missing");
    console.log("Webhook body length:", body.length);

    // Validate required headers
    if (!signature) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "MISSING_WEBHOOK_SIGNATURE",
          details: {
            required_header: "x-paystack-signature",
            provided_headers: Object.fromEntries(req.headers.entries()),
            message: "Paystack webhook signature is required for verification",
          },
          fix_instructions:
            "Ensure webhook is sent from Paystack with proper signature header",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate body content
    if (!body || body.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "EMPTY_WEBHOOK_BODY",
          details: {
            body_length: body.length,
            message: "Webhook body is empty or missing",
          },
          fix_instructions:
            "Webhook must contain valid JSON payload from Paystack",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check environment configuration
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const missingEnvVars = [];
    if (!paystackSecretKey) missingEnvVars.push("PAYSTACK_SECRET_KEY");
    if (!supabaseUrl) missingEnvVars.push("SUPABASE_URL");
    if (!supabaseServiceKey) missingEnvVars.push("SUPABASE_SERVICE_ROLE_KEY");

    if (missingEnvVars.length > 0) {
      console.error("Missing environment variables:", missingEnvVars);
      return new Response(
        JSON.stringify({
          success: false,
          error: "ENVIRONMENT_CONFIG_ERROR",
          details: {
            missing_env_vars: missingEnvVars,
            message: "Required environment variables are not configured",
          },
          fix_instructions:
            "Configure missing environment variables in deployment settings",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verify webhook signature
    try {
      const crypto = await import("node:crypto");
      const hash = crypto
        .createHmac("sha512", paystackSecretKey)
        .update(body)
        .digest("hex");

      if (hash !== signature) {
        console.error("Invalid webhook signature");
        return new Response(
          JSON.stringify({
            success: false,
            error: "INVALID_WEBHOOK_SIGNATURE",
            details: {
              provided_signature: signature,
              computed_signature: hash.substring(0, 16) + "...",
              message: "Webhook signature verification failed",
              security_note: "This webhook may not be from Paystack",
            },
            fix_instructions:
              "Verify webhook is sent from Paystack servers with correct secret key",
          }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    } catch (cryptoError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "SIGNATURE_VERIFICATION_FAILED",
          details: {
            crypto_error: cryptoError.message,
            message: "Failed to verify webhook signature due to crypto error",
          },
          fix_instructions:
            "Check server crypto library availability and environment configuration",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Parse webhook payload
    let event;
    try {
      event = JSON.parse(body);
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_JSON_PAYLOAD",
          details: {
            parse_error: parseError.message,
            body_sample: body.substring(0, 100) + "...",
            message: "Webhook body is not valid JSON",
          },
          fix_instructions: "Ensure webhook payload is valid JSON format",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate event structure
    if (!event.event || !event.data) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_WEBHOOK_STRUCTURE",
          details: {
            provided_fields: Object.keys(event || {}),
            required_fields: ["event", "data"],
            message: "Webhook payload missing required fields",
          },
          fix_instructions:
            "Webhook must have 'event' and 'data' fields as per Paystack documentation",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("Webhook event:", event.event, event.data?.reference);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    let processingResult = { success: true, message: "Event processed" };

    switch (event.event) {
      case "charge.success":
        processingResult = await handleSuccessfulPayment(supabase, event.data);
        break;

      case "charge.failed":
        processingResult = await handleFailedPayment(supabase, event.data);
        break;

      case "transfer.success":
        processingResult = await handleSuccessfulTransfer(supabase, event.data);
        break;

      case "transfer.failed":
        processingResult = await handleFailedTransfer(supabase, event.data);
        break;

      case "transfer.reversed":
        console.log("Transfer reversed:", event.data.reference);
        processingResult = {
          success: true,
          message: "Transfer reversal logged",
        };
        break;

      default:
        console.log("Unhandled webhook event:", event.event);
        processingResult = {
          success: true,
          message: `Unhandled event type: ${event.event}`,
          unhandled: true,
        };
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook processed",
        event_type: event.event,
        reference: event.data?.reference,
        processing_result: processingResult,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "UNEXPECTED_WEBHOOK_ERROR",
        details: {
          error_message: error.message,
          error_stack: error.stack,
          error_type: error.constructor.name,
          timestamp: new Date().toISOString(),
        },
        fix_instructions:
          "This is an unexpected server error during webhook processing. Check server logs for details.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function handleSuccessfulPayment(supabase: any, paymentData: any) {
  try {
    console.log("Processing successful payment:", paymentData.reference);

    if (!paymentData.reference) {
      throw new Error("Payment data missing reference");
    }

    // Try multiple table lookups for transaction
    let transaction = null;
    let transactionSource = "";

    // First try payment_transactions table
    const { data: paymentTransaction } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("reference", paymentData.reference)
      .single();

    if (paymentTransaction) {
      transaction = paymentTransaction;
      transactionSource = "payment_transactions";
    } else {
      // Try legacy transactions table
      const { data: legacyTransaction } = await supabase
        .from("transactions")
        .select("*")
        .eq("paystack_reference", paymentData.reference)
        .single();

      if (legacyTransaction) {
        transaction = legacyTransaction;
        transactionSource = "transactions";
      }
    }

    if (!transaction) {
      console.warn(
        "Transaction not found for reference:",
        paymentData.reference,
      );
      return {
        success: false,
        message: `Transaction not found for reference: ${paymentData.reference}`,
        reference: paymentData.reference,
      };
    }

    // Update transaction status based on table type
    if (transactionSource === "payment_transactions") {
      const { error: updateError } = await supabase
        .from("payment_transactions")
        .update({
          status: "success",
          verified_at: new Date().toISOString(),
          paystack_response: paymentData,
        })
        .eq("reference", paymentData.reference);

      if (updateError) {
        console.error("Error updating payment transaction:", updateError);
        return {
          success: false,
          message: "Failed to update payment transaction status",
          error: updateError.message,
        };
      }

      // Process orders for successful payment
      try {
        const orderResponse = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/create-order`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              user_id: transaction.user_id,
              items: transaction.items,
              total_amount: paymentData.amount / 100,
              shipping_address: transaction.shipping_address,
              payment_reference: paymentData.reference,
              payment_data: paymentData,
            }),
          },
        );

        const orderResult = await orderResponse.json();

        if (!orderResult.success) {
          console.error("Order creation failed:", orderResult.error);
          return {
            success: false,
            message: "Payment successful but order creation failed",
            payment_processed: true,
            order_error: orderResult.error,
          };
        }
      } catch (orderError) {
        console.error("Order processing error:", orderError);
        return {
          success: false,
          message: "Payment successful but order processing failed",
          payment_processed: true,
          order_error: orderError.message,
        };
      }
    } else {
      // Legacy transactions table
      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          status: "completed",
          committed_at: new Date().toISOString(),
          seller_committed: true,
        })
        .eq("paystack_reference", paymentData.reference);

      if (updateError) {
        console.error("Error updating legacy transaction:", updateError);
        return {
          success: false,
          message: "Failed to update transaction status",
          error: updateError.message,
        };
      }

      // Mark book as sold
      if (transaction.book_id) {
        await supabase
          .from("books")
          .update({ sold: true })
          .eq("id", transaction.book_id);
      }
    }

    console.log(
      "Payment processed successfully for transaction:",
      transaction.id,
    );
    return {
      success: true,
      message: "Payment processed successfully",
      reference: paymentData.reference,
      amount: paymentData.amount,
      transaction_source: transactionSource,
    };
  } catch (error) {
    console.error("Error handling successful payment:", error);
    return {
      success: false,
      message: "Error processing successful payment",
      error: error.message,
    };
  }
}

async function handleFailedPayment(supabase: any, paymentData: any) {
  try {
    console.log("Processing failed payment:", paymentData.reference);

    if (!paymentData.reference) {
      throw new Error("Payment data missing reference");
    }

    // Update payment transaction status
    const { error: updateError } = await supabase
      .from("payment_transactions")
      .update({
        status: "failed",
        paystack_response: paymentData,
        verified_at: new Date().toISOString(),
      })
      .eq("reference", paymentData.reference);

    if (updateError) {
      console.error("Error updating failed payment:", updateError);
      return {
        success: false,
        message: "Failed to update payment status",
        error: updateError.message,
      };
    }

    console.log(
      "Failed payment processed for reference:",
      paymentData.reference,
    );
    return {
      success: true,
      message: "Failed payment processed",
      reference: paymentData.reference,
    };
  } catch (error) {
    console.error("Error handling failed payment:", error);
    return {
      success: false,
      message: "Error processing failed payment",
      error: error.message,
    };
  }
}

async function handleSuccessfulTransfer(supabase: any, transferData: any) {
  try {
    console.log(
      "Transfer successful:",
      transferData.reference || transferData.transfer_code,
    );

    // Update transfer status in transfers table
    const { error: transferUpdateError } = await supabase
      .from("transfers")
      .update({
        status: "success",
        completed_at: new Date().toISOString(),
        paystack_response: transferData,
      })
      .or(
        `reference.eq.${transferData.reference},transfer_code.eq.${transferData.transfer_code}`,
      );

    if (transferUpdateError) {
      console.warn("Could not update transfer status:", transferUpdateError);
    }

    // Update legacy seller payout status if exists (backward compatibility)
    const { error: payoutUpdateError } = await supabase
      .from("seller_payouts")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        paystack_response: transferData,
      })
      .eq("transfer_reference", transferData.reference);

    if (payoutUpdateError) {
      console.warn("Could not update legacy payout status:", payoutUpdateError);
    }

    return {
      success: true,
      message: "Transfer success processed",
      reference: transferData.reference,
      transfer_code: transferData.transfer_code,
    };
  } catch (error) {
    console.error("Error handling successful transfer:", error);
    return {
      success: false,
      message: "Error processing transfer success",
      error: error.message,
    };
  }
}

async function handleFailedTransfer(supabase: any, transferData: any) {
  try {
    console.log(
      "Transfer failed:",
      transferData.reference || transferData.transfer_code,
      transferData.failure_reason,
    );

    // Update transfer status in transfers table
    const { error: transferUpdateError } = await supabase
      .from("transfers")
      .update({
        status: "failed",
        failure_reason: transferData.failure_reason,
        failed_at: new Date().toISOString(),
        paystack_response: transferData,
      })
      .or(
        `reference.eq.${transferData.reference},transfer_code.eq.${transferData.transfer_code}`,
      );

    if (transferUpdateError) {
      console.warn("Could not update transfer status:", transferUpdateError);
    }

    // Update legacy seller payout status if exists (backward compatibility)
    const { error: payoutUpdateError } = await supabase
      .from("seller_payouts")
      .update({
        status: "failed",
        failure_reason: transferData.failure_reason,
        paystack_response: transferData,
      })
      .eq("transfer_reference", transferData.reference);

    if (payoutUpdateError) {
      console.warn("Could not update legacy payout status:", payoutUpdateError);
    }

    return {
      success: true,
      message: "Transfer failure processed",
      reference: transferData.reference,
      transfer_code: transferData.transfer_code,
      failure_reason: transferData.failure_reason,
    };
  } catch (error) {
    console.error("Error handling failed transfer:", error);
    return {
      success: false,
      message: "Error processing transfer failure",
      error: error.message,
    };
  }
}
