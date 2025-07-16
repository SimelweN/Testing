import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  createSupabaseClient,
  createErrorResponse,
  createSuccessResponse,
  handleCORSPreflight,
  validateRequiredFields,
  parseRequestBody,
  retryWithBackoff,
  logFunction,
} from "../_shared/utils.ts";
import {
  validatePaystackConfig,
  validateSupabaseConfig,
  ENV,
} from "../_shared/config.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCORSPreflight(req);
  if (corsResponse) return corsResponse;

  try {
    logFunction("verify-paystack-payment", "Starting payment verification");

    // Validate configuration
    validatePaystackConfig();
    validateSupabaseConfig();

    const requestData = await parseRequestBody(req);
    validateRequiredFields(requestData, ["reference"]);

    const { reference } = requestData;
    logFunction("verify-paystack-payment", "Verifying reference", {
      reference,
    });

    // Verify payment with Paystack (with retry logic)
    const paystackResult = await retryWithBackoff(async () => {
      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${ENV.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Paystack API error: ${response.status} ${response.statusText}`,
        );
      }

      return await response.json();
    });

    if (!paystackResult.status) {
      throw new Error(
        `Paystack verification failed: ${paystackResult.message}`,
      );
    }

    const transaction = paystackResult.data;
    logFunction("verify-paystack-payment", "Payment verified with Paystack", {
      amount: transaction.amount,
      status: transaction.status,
    });

    // Use service key for database operations
    const supabase = createSupabaseClient();

    // Update transaction status
    const { error: updateError } = await supabase
      .from("payment_transactions")
      .update({
        status: transaction.status,
        paystack_response: transaction,
        verified_at: new Date().toISOString(),
      })
      .eq("reference", reference);

    if (updateError) {
      console.error("Failed to update transaction:", updateError);
    }

    // If payment is successful, create orders
    if (transaction.status === "success") {
      const metadata = transaction.metadata;

      // Call create-order function to process the successful payment
      const orderResponse = await fetch(
        `${req.headers.get("origin")}/functions/v1/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: req.headers.get("Authorization") || "",
          },
          body: JSON.stringify({
            user_id: metadata.user_id,
            items: metadata.items,
            total_amount: transaction.amount / 100, // Convert from kobo
            shipping_address: metadata.shipping_address,
            payment_reference: reference,
            payment_data: transaction,
          }),
        },
      );

      const orderResult = await orderResponse.json();

      if (!orderResult.success) {
        console.error("Order creation failed:", orderResult.error);
        // Don't fail the verification, just log the error
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            transaction,
            orders: orderResult.orders || [],
            verified: true,
            status: "success",
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Payment not successful
    return new Response(
      JSON.stringify({
        success: false,
        data: {
          transaction,
          verified: true,
          status: transaction.status,
        },
        error: "Payment was not successful",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to verify payment",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
