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
    // Handle health check first
    const url = new URL(req.url);
    const isHealthCheck =
      url.pathname.endsWith("/health") ||
      url.searchParams.get("health") === "true";

    // Check for health check in POST body as well
    let body = null;
    if (req.method === "POST") {
      try {
        // Clone the request to avoid consuming the body
        const clonedReq = req.clone();
        body = await clonedReq.json();
      } catch {
        // Ignore JSON parsing errors for health checks
      }
    }

    if (isHealthCheck || body?.health === true) {
      return new Response(
        JSON.stringify({
          success: true,
          service: "verify-paystack-payment",
          status: "healthy",
          timestamp: new Date().toISOString(),
          environment: {
            paystack_configured: !!PAYSTACK_SECRET_KEY,
            supabase_configured: !!(SUPABASE_URL && SUPABASE_SERVICE_KEY),
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate request method for non-health endpoints
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "METHOD_NOT_ALLOWED",
          details: {
            provided_method: req.method,
            required_method: "POST",
            message: "Payment verification endpoint only accepts POST requests",
          },
          fix_instructions:
            "Send payment verification requests using POST method only",
        }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check environment configuration
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const missingEnvVars = [];
    if (!supabaseUrl) missingEnvVars.push("SUPABASE_URL");
    if (!supabaseServiceKey) missingEnvVars.push("SUPABASE_SERVICE_ROLE_KEY");

    if (missingEnvVars.length > 0) {
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

    // Use body if already parsed for health check, otherwise parse now
    let requestBody;
    if (body) {
      requestBody = body;
    } else {
      try {
        requestBody = await req.json();
      } catch (parseError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "INVALID_JSON_PAYLOAD",
            details: {
              parse_error: parseError.message,
              message: "Request body must be valid JSON",
            },
            fix_instructions: "Ensure request body contains valid JSON format",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    const { reference } = requestBody;

    if (!reference) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "MISSING_PAYMENT_REFERENCE",
          details: {
            provided_fields: Object.keys(requestBody || {}),
            required_fields: ["reference"],
            message: "Payment reference is required for verification",
          },
          fix_instructions:
            "Provide 'reference' field in request body with valid payment reference",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Handle mock/test references
    if (
      reference.startsWith("test_ref_") ||
      reference.startsWith("fallback_ref_") ||
      reference.startsWith("mock_")
    ) {
      console.log("Processing test/mock payment reference:", reference);

      // Update transaction status if it exists
      const { error: updateError } = await supabase
        .from("payment_transactions")
        .update({
          status: "success",
          verified_at: new Date().toISOString(),
        })
        .eq("reference", reference);

      if (updateError) {
        console.warn("Failed to update mock transaction:", updateError);
        return new Response(
          JSON.stringify({
            success: false,
            error: "DATABASE_UPDATE_FAILED",
            details: {
              database_error: updateError.message,
              operation: "update mock transaction",
              reference: reference,
              message: "Failed to update mock transaction status",
            },
            fix_instructions:
              "Check database connectivity and transaction table structure",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Mock successful transaction
      const mockTransaction = {
        reference,
        status: "success",
        amount: 10000, // 100 ZAR in kobo
        currency: "ZAR",
        metadata: {
          user_id: "mock_user",
          items: [],
        },
      };

      // Try to create orders for mock transaction
      try {
        const orderResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/create-order`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
            body: JSON.stringify({
              user_id: mockTransaction.metadata.user_id,
              items: mockTransaction.metadata.items || [],
              total_amount: mockTransaction.amount / 100,
              shipping_address: {},
              payment_reference: reference,
              payment_data: mockTransaction,
            }),
          },
        );

        const orderResult = await orderResponse.json();

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              transaction: mockTransaction,
              orders: orderResult.orders || [],
              verified: true,
              status: "success",
              mock: true,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      } catch (orderError) {
        console.warn("Mock order creation failed:", orderError);

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              transaction: mockTransaction,
              verified: true,
              status: "success",
              mock: true,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Handle real Paystack verification
    if (!PAYSTACK_SECRET_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_NOT_CONFIGURED",
          details: {
            missing_env_vars: ["PAYSTACK_SECRET_KEY"],
            message: "Paystack integration is not properly configured",
          },
          fix_instructions:
            "Configure PAYSTACK_SECRET_KEY environment variable with your Paystack secret key",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verify payment with Paystack
    let paystackResponse;
    try {
      paystackResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          },
        },
      );
    } catch (fetchError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_API_CONNECTION_FAILED",
          details: {
            fetch_error: fetchError.message,
            api_endpoint: "https://api.paystack.co/transaction/verify",
            reference: reference,
            message: "Unable to connect to Paystack API",
          },
          fix_instructions:
            "Check network connectivity and Paystack API status",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!paystackResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_API_ERROR",
          details: {
            status_code: paystackResponse.status,
            status_text: paystackResponse.statusText,
            reference: reference,
            message: "Paystack API returned error response",
          },
          fix_instructions:
            "Check payment reference validity and Paystack API key",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let paystackResult;
    try {
      paystackResult = await paystackResponse.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_RESPONSE_PARSE_ERROR",
          details: {
            parse_error: parseError.message,
            message: "Unable to parse Paystack API response",
          },
          fix_instructions:
            "This indicates an issue with Paystack API response format",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!paystackResult.status) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_VERIFICATION_FAILED",
          details: {
            paystack_message: paystackResult.message,
            reference: reference,
            paystack_data: paystackResult.data,
            message: "Paystack verification was unsuccessful",
          },
          fix_instructions:
            "Check if payment reference is valid and payment was successful",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const transaction = paystackResult.data;

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
      return new Response(
        JSON.stringify({
          success: false,
          error: "DATABASE_UPDATE_FAILED",
          details: {
            database_error: updateError.message,
            operation: "update payment transaction",
            reference: reference,
            transaction_status: transaction.status,
            message: "Payment verified but failed to update database",
          },
          fix_instructions:
            "Check database connectivity and payment_transactions table structure",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // If payment is successful, create orders
    if (transaction.status === "success") {
      const metadata = transaction.metadata;

      // Call create-order function to process the successful payment
      try {
        const orderResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/create-order`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
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
      } catch (orderError) {
        console.error("Order creation failed:", orderError);

        return new Response(
          JSON.stringify({
            success: false,
            error: "ORDER_CREATION_FAILED",
            details: {
              payment_verified: true,
              transaction_status: "success",
              order_error: orderError.message,
              reference: reference,
              message:
                "Payment verified successfully but order creation failed",
            },
            fix_instructions:
              "Payment was successful but order processing failed. Check create-order function logs.",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Payment not successful
    return new Response(
      JSON.stringify({
        success: false,
        error: "PAYMENT_NOT_SUCCESSFUL",
        details: {
          transaction_status: transaction.status,
          transaction_data: transaction,
          verified: true,
          reference: reference,
          message:
            "Payment verification completed but payment was not successful",
        },
        fix_instructions:
          "Payment failed or was not completed. User should retry payment.",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "UNEXPECTED_VERIFICATION_ERROR",
        details: {
          error_message: error.message,
          error_stack: error.stack,
          error_type: error.constructor.name,
          timestamp: new Date().toISOString(),
        },
        fix_instructions:
          "This is an unexpected server error during payment verification. Check server logs for details.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
