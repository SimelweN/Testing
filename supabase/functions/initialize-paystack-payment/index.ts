import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { handleRequestBody } from "../_shared/request-utils.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

    try {
    // Handle request body and health checks safely
    const requestResult = await handleRequestBody(req, "initialize-paystack-payment", {
      environment: {
        paystack_configured: !!PAYSTACK_SECRET_KEY,
        supabase_configured: !!(SUPABASE_URL && SUPABASE_SERVICE_KEY),
      },
    });

    if (requestResult.isHealthCheck) {
      return requestResult.response!;
    }

    if (requestResult.response) {
      // Error occurred during body parsing
      return requestResult.response;
    }

    const requestBody = requestResult.body;

    // Validate request method for non-health endpoints
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "METHOD_NOT_ALLOWED",
          details: {
            provided_method: req.method,
            required_method: "POST",
            message:
              "Payment initialization endpoint only accepts POST requests",
          },
          fix_instructions:
            "Send payment initialization requests using POST method only",
        }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Parse request body if not already parsed
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

    const {
      user_id,
      items,
      total_amount,
      shipping_address,
      email,
      metadata = {},
    } = requestBody;

    // Validate required fields
    const missingFields = [];
    if (!user_id) missingFields.push("user_id");
    if (!items) missingFields.push("items");
    if (!total_amount) missingFields.push("total_amount");
    if (!email) missingFields.push("email");

    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "MISSING_REQUIRED_FIELDS",
          details: {
            missing_fields: missingFields,
            provided_fields: Object.keys(requestBody || {}),
            message: "Required fields are missing for payment initialization",
          },
          fix_instructions:
            "Provide all required fields: user_id, items, total_amount, email",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate field formats
    if (!Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_ITEMS_FORMAT",
          details: {
            items_type: typeof items,
            items_length: Array.isArray(items) ? items.length : "N/A",
            message: "Items must be a non-empty array",
          },
          fix_instructions: "Provide items as an array with at least one item",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (typeof total_amount !== "number" || total_amount <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_AMOUNT_FORMAT",
          details: {
            amount_type: typeof total_amount,
            amount_value: total_amount,
            message: "Total amount must be a positive number",
          },
          fix_instructions: "Provide total_amount as a positive number",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_EMAIL_FORMAT",
          details: {
            email: email,
            message: "Email address format is invalid",
          },
          fix_instructions: "Provide a valid email address",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // If Paystack is not configured, return mock response
    if (!PAYSTACK_SECRET_KEY) {
      console.warn(
        "Paystack not configured, returning mock payment initialization",
      );

      const mockReference = `test_ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            authorization_url: `https://checkout.paystack.com/mock/${mockReference}`,
            reference: mockReference,
            access_code: `mock_access_${Date.now()}`,
          },
          mock: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check if we need to create a split for multiple sellers
    const sellerIds = [...new Set(items.map((item: any) => item.seller_id))];
    let splitCode = null;

    if (
      sellerIds.length > 1 ||
      (sellerIds.length === 1 && sellerIds[0] !== null)
    ) {
      try {
        // Create a payment split using the split management function
        const splitResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/paystack-split-management`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
            body: JSON.stringify({
              name: `Order Split ${Date.now()}`,
              type: "flat",
              currency: "ZAR",
              order_items: items,
              bearer_type: "account",
            }),
          },
        );

        if (splitResponse.ok) {
          const splitResult = await splitResponse.json();
          if (splitResult.success) {
            splitCode = splitResult.split_code;
            console.log("Split created successfully:", splitCode);
          } else {
            console.warn("Split creation failed:", splitResult.error);
            // Continue without split - payment will go to main account
          }
        } else {
          console.warn("Split creation request failed:", splitResponse.status);
        }
      } catch (splitError) {
        console.warn("Error creating split:", splitError.message);
        // Continue without split - payment will go to main account
      }
    }

    // Initialize Paystack payment
    const paystackData: any = {
      email,
      amount: total_amount * 100, // Convert to kobo
      currency: "ZAR",
      callback_url: `${req.headers.get("origin") || "https://rebookedsolutions.co.za"}/payment/callback`,
      metadata: {
        user_id,
        items,
        shipping_address,
        split_code: splitCode,
        ...metadata,
      },
    };

    // Add split code if we have one
    if (splitCode) {
      paystackData.split_code = splitCode;
      console.log("Using split code for payment:", splitCode);
    } else {
      console.log("No split code - payment goes to main account");
    }

    try {
      let paystackResponse;
      try {
        paystackResponse = await fetch(
          "https://api.paystack.co/transaction/initialize",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(paystackData),
          },
        );
      } catch (fetchError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "PAYSTACK_API_CONNECTION_FAILED",
            details: {
              fetch_error: fetchError.message,
              api_endpoint: "https://api.paystack.co/transaction/initialize",
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
              message: "Paystack API returned error response",
            },
            fix_instructions:
              "Check Paystack API key and payment data validity",
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
            error: "PAYSTACK_INITIALIZATION_FAILED",
            details: {
              paystack_message: paystackResult.message,
              paystack_data: paystackResult.data || null,
              payment_amount: total_amount,
              customer_email: email,
              message: "Paystack payment initialization was unsuccessful",
            },
            fix_instructions:
              "Check payment amount, customer email, and Paystack account configuration",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Store transaction reference in database
      const { error: insertError } = await supabase
        .from("payment_transactions")
        .insert({
          reference: paystackResult.data.reference,
          user_id,
          amount: total_amount,
          status: "pending",
          items,
          shipping_address,
          split_code: splitCode,
          paystack_data: paystackResult.data,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("Failed to store transaction:", insertError);
        return new Response(
          JSON.stringify({
            success: false,
            error: "TRANSACTION_STORAGE_FAILED",
            details: {
              database_error: insertError.message,
              paystack_reference: paystackResult.data.reference,
              message:
                "Payment initialized but failed to store transaction record",
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

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            authorization_url: paystackResult.data.authorization_url,
            reference: paystackResult.data.reference,
            access_code: paystackResult.data.access_code,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (paystackError) {
      console.error("Paystack API error:", paystackError);

      // Return mock response if Paystack fails
      const mockReference = `fallback_ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            authorization_url: `https://checkout.paystack.com/mock/${mockReference}`,
            reference: mockReference,
            access_code: `fallback_access_${Date.now()}`,
          },
          fallback: true,
          paystack_error: paystackError.message,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } catch (error) {
    console.error("Initialize payment error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "UNEXPECTED_PAYMENT_INITIALIZATION_ERROR",
        details: {
          error_message: error.message,
          error_stack: error.stack,
          error_type: error.constructor.name,
          timestamp: new Date().toISOString(),
        },
        fix_instructions:
          "This is an unexpected server error during payment initialization. Check server logs for details.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
