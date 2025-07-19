import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface RefundRequest {
  transaction: string;
  amount?: number;
  currency?: string;
  customer_note?: string;
  merchant_note?: string;
}

interface RefundScenario {
  type:
    | "full"
    | "partial"
    | "dispute"
    | "cancellation"
    | "return"
    | "damage"
    | "seller_fault";
  reason: string;
  amount?: number;
  customer_note?: string;
  merchant_note?: string;
  order_id?: string;
  user_id?: string;
  seller_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Validate request method
  if (!["POST", "GET", "PUT"].includes(req.method)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "METHOD_NOT_ALLOWED",
        details: {
          provided_method: req.method,
          allowed_methods: ["POST", "GET", "PUT"],
          message: "Refund management endpoint accepts POST, GET, PUT requests",
        },
        fix_instructions:
          "Use POST to create refunds, GET to retrieve, PUT to update",
      }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    // Check environment configuration
    const missingEnvVars = [];
    if (!SUPABASE_URL) missingEnvVars.push("SUPABASE_URL");
    if (!SUPABASE_SERVICE_KEY) missingEnvVars.push("SUPABASE_SERVICE_ROLE_KEY");

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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Handle different actions
    switch (req.method) {
      case "GET":
        if (action === "refunds") {
          return await handleGetRefunds(req);
        } else if (action === "refund") {
          return await handleGetRefund(req);
        } else {
          return await handleGetRefunds(req); // Default to list refunds
        }
      case "POST":
        if (action === "create-refund") {
          return await handleCreateRefund(req, supabase);
        } else if (action === "scenario-refund") {
          return await handleScenarioRefund(req, supabase);
        } else {
          return await handleCreateRefund(req, supabase); // Default to create refund
        }
      case "PUT":
        return await handleUpdateRefund(req, supabase);
      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: "UNSUPPORTED_METHOD",
            details: {
              method: req.method,
              message: "Method not implemented",
            },
            fix_instructions: "Use supported methods: GET, POST, PUT",
          }),
          {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
    }
  } catch (error) {
    console.error("Refund management error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "UNEXPECTED_REFUND_MANAGEMENT_ERROR",
        details: {
          error_message: error.message,
          error_stack: error.stack,
          error_type: error.constructor.name,
          timestamp: new Date().toISOString(),
        },
        fix_instructions:
          "This is an unexpected server error. Check server logs for details.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function handleGetRefunds(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const page = url.searchParams.get("page") || "1";
  const perPage = url.searchParams.get("perPage") || "50";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const currency = url.searchParams.get("currency");

  if (!PAYSTACK_SECRET_KEY) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "PAYSTACK_NOT_CONFIGURED",
        details: {
          missing_env_vars: ["PAYSTACK_SECRET_KEY"],
          message: "Paystack integration is not configured",
        },
        fix_instructions: "Configure PAYSTACK_SECRET_KEY environment variable",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    let endpoint = `https://api.paystack.co/refund?page=${page}&perPage=${perPage}`;
    if (from) endpoint += `&from=${from}`;
    if (to) endpoint += `&to=${to}`;
    if (currency) endpoint += `&currency=${currency}`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_REFUNDS_FETCH_FAILED",
          details: {
            status_code: response.status,
            status_text: response.statusText,
            message: "Failed to fetch refunds from Paystack",
          },
          fix_instructions: "Check Paystack API access and parameters",
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const result = await response.json();
    return new Response(
      JSON.stringify({
        success: true,
        data: result.data,
        meta: result.meta,
        message: "Refunds retrieved successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "REFUNDS_FETCH_ERROR",
        details: {
          error_message: error.message,
          message: "Error fetching refunds",
        },
        fix_instructions: "Check network connectivity and Paystack API status",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleGetRefund(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const refundId = url.searchParams.get("refund_id");

  if (!refundId) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "MISSING_REFUND_ID",
        details: {
          message: "Refund ID is required to fetch specific refund",
        },
        fix_instructions: "Provide refund_id as query parameter",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  if (!PAYSTACK_SECRET_KEY) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "PAYSTACK_NOT_CONFIGURED",
        details: {
          missing_env_vars: ["PAYSTACK_SECRET_KEY"],
          message: "Paystack integration is not configured",
        },
        fix_instructions: "Configure PAYSTACK_SECRET_KEY environment variable",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const response = await fetch(`https://api.paystack.co/refund/${refundId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_REFUND_FETCH_FAILED",
          details: {
            status_code: response.status,
            status_text: response.statusText,
            refund_id: refundId,
            message: "Failed to fetch refund from Paystack",
          },
          fix_instructions: "Check refund ID validity and Paystack API access",
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const result = await response.json();
    return new Response(
      JSON.stringify({
        success: true,
        data: result.data,
        message: "Refund retrieved successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "REFUND_FETCH_ERROR",
        details: {
          error_message: error.message,
          refund_id: refundId,
          message: "Error fetching refund",
        },
        fix_instructions: "Check network connectivity and Paystack API status",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleCreateRefund(
  req: Request,
  supabase: any,
): Promise<Response> {
  if (!PAYSTACK_SECRET_KEY) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "PAYSTACK_NOT_CONFIGURED",
        details: {
          missing_env_vars: ["PAYSTACK_SECRET_KEY"],
          message: "Paystack integration is not configured",
        },
        fix_instructions: "Configure PAYSTACK_SECRET_KEY environment variable",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  let requestBody;
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

  const {
    transaction,
    amount,
    currency = "ZAR",
    customer_note,
    merchant_note,
    user_id,
    order_id,
  } = requestBody as RefundRequest & { user_id?: string; order_id?: string };

  // Validate required fields
  if (!transaction) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "MISSING_TRANSACTION_REFERENCE",
        details: {
          provided_fields: Object.keys(requestBody || {}),
          required_fields: ["transaction"],
          message: "Transaction reference is required for refund",
        },
        fix_instructions:
          "Provide transaction reference for the payment to refund",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Validate amount if provided
  if (amount !== undefined && (typeof amount !== "number" || amount <= 0)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "INVALID_REFUND_AMOUNT",
        details: {
          amount_type: typeof amount,
          amount_value: amount,
          message: "Refund amount must be a positive number if specified",
        },
        fix_instructions:
          "Provide amount as positive number in kobo/cents, or omit for full refund",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const refundPayload: RefundRequest = {
      transaction,
      customer_note,
      merchant_note,
    };

    // Add amount for partial refund
    if (amount !== undefined) {
      refundPayload.amount = amount;
    }

    const response = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(refundPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_REFUND_CREATION_FAILED",
          details: {
            status_code: response.status,
            status_text: response.statusText,
            paystack_error: errorData?.message || "Unknown Paystack error",
            transaction_reference: transaction,
            refund_amount: amount,
            message: "Paystack refund creation failed",
          },
          fix_instructions:
            "Check transaction reference validity and refund eligibility",
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const result = await response.json();

    // Store refund information in database for tracking
    try {
      await supabase.from("refunds").insert({
        refund_id: result.data.id,
        transaction_reference: result.data.transaction.reference,
        user_id: user_id,
        order_id: order_id,
        amount: result.data.amount,
        currency: result.data.currency,
        status: result.data.status,
        customer_note: result.data.customer_note,
        merchant_note: result.data.merchant_note,
        refund_type: amount ? "partial" : "full",
        created_at: new Date().toISOString(),
        paystack_data: result.data,
      });
    } catch (dbError) {
      console.warn("Failed to store refund in database:", dbError);
      // Continue as refund was created successfully in Paystack
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result.data,
        message: "Refund created successfully",
        refund_id: result.data.id,
        status: result.data.status,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "REFUND_CREATION_ERROR",
        details: {
          error_message: error.message,
          transaction_reference: transaction,
          message: "Error creating refund",
        },
        fix_instructions: "Check network connectivity and transaction validity",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleScenarioRefund(
  req: Request,
  supabase: any,
): Promise<Response> {
  if (!PAYSTACK_SECRET_KEY) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "PAYSTACK_NOT_CONFIGURED",
        details: {
          missing_env_vars: ["PAYSTACK_SECRET_KEY"],
          message: "Paystack integration is not configured",
        },
        fix_instructions: "Configure PAYSTACK_SECRET_KEY environment variable",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  let requestBody;
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

  const {
    type,
    reason,
    transaction,
    amount,
    customer_note,
    merchant_note,
    order_id,
    user_id,
    seller_id,
  } = requestBody as RefundScenario & { transaction: string };

  // Validate required fields
  const missingFields = [];
  if (!type) missingFields.push("type");
  if (!reason) missingFields.push("reason");
  if (!transaction) missingFields.push("transaction");

  if (missingFields.length > 0) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "MISSING_REQUIRED_FIELDS",
        details: {
          missing_fields: missingFields,
          provided_fields: Object.keys(requestBody || {}),
          message: "Required fields are missing for scenario refund",
        },
        fix_instructions:
          "Provide all required fields: type, reason, transaction",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Validate refund scenario type
  const validTypes = [
    "full",
    "partial",
    "dispute",
    "cancellation",
    "return",
    "damage",
    "seller_fault",
  ];
  if (!validTypes.includes(type)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "INVALID_REFUND_TYPE",
        details: {
          provided_type: type,
          valid_types: validTypes,
          message: "Invalid refund scenario type",
        },
        fix_instructions:
          "Use one of the valid refund types: " + validTypes.join(", "),
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    // Process different refund scenarios
    let refundAmount = amount;
    let notes = {
      customer_note: customer_note || generateCustomerNote(type, reason),
      merchant_note: merchant_note || generateMerchantNote(type, reason),
    };

    // Handle specific scenarios
    switch (type) {
      case "cancellation":
        // Full refund for order cancellations
        refundAmount = undefined; // Full refund
        break;
      case "return":
        // Typically full refund minus any processing fees
        if (!refundAmount) {
          refundAmount = undefined; // Full refund
        }
        break;
      case "damage":
        // Full refund for damaged items
        refundAmount = undefined;
        break;
      case "dispute":
        // Amount determined by dispute resolution
        if (!refundAmount) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "DISPUTE_AMOUNT_REQUIRED",
              details: {
                message: "Dispute refunds require specific amount",
              },
              fix_instructions:
                "Provide amount for dispute refunds based on resolution",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
        break;
      case "partial":
        // Partial refund amount must be specified
        if (!refundAmount) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "PARTIAL_AMOUNT_REQUIRED",
              details: {
                message: "Partial refunds require specific amount",
              },
              fix_instructions: "Provide amount for partial refunds",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
        break;
      case "seller_fault":
        // Full refund for seller issues
        refundAmount = undefined;
        break;
    }

    // Create the refund
    const refundPayload: RefundRequest = {
      transaction,
      customer_note: notes.customer_note,
      merchant_note: notes.merchant_note,
    };

    if (refundAmount !== undefined) {
      refundPayload.amount = refundAmount;
    }

    const response = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(refundPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_SCENARIO_REFUND_FAILED",
          details: {
            status_code: response.status,
            status_text: response.statusText,
            paystack_error: errorData?.message || "Unknown Paystack error",
            scenario_type: type,
            transaction_reference: transaction,
            message: "Paystack scenario refund failed",
          },
          fix_instructions:
            "Check transaction reference and scenario parameters",
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const result = await response.json();

    // Store scenario refund information in database
    try {
      await supabase.from("refunds").insert({
        refund_id: result.data.id,
        transaction_reference: result.data.transaction.reference,
        user_id: user_id,
        order_id: order_id,
        seller_id: seller_id,
        amount: result.data.amount,
        currency: result.data.currency,
        status: result.data.status,
        customer_note: result.data.customer_note,
        merchant_note: result.data.merchant_note,
        refund_type: type,
        refund_reason: reason,
        scenario_data: {
          type,
          reason,
          original_amount: amount,
          processed_amount: result.data.amount,
        },
        created_at: new Date().toISOString(),
        paystack_data: result.data,
      });
    } catch (dbError) {
      console.warn("Failed to store scenario refund in database:", dbError);
      // Continue as refund was created successfully in Paystack
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result.data,
        scenario: {
          type,
          reason,
          processing_notes: notes,
        },
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} refund created successfully`,
        refund_id: result.data.id,
        status: result.data.status,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "SCENARIO_REFUND_ERROR",
        details: {
          error_message: error.message,
          scenario_type: type,
          transaction_reference: transaction,
          message: "Error creating scenario refund",
        },
        fix_instructions: "Check network connectivity and scenario parameters",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleUpdateRefund(
  req: Request,
  supabase: any,
): Promise<Response> {
  // Note: Paystack doesn't support updating refunds via API
  // This could be used for updating local database records
  return new Response(
    JSON.stringify({
      success: false,
      error: "OPERATION_NOT_SUPPORTED",
      details: {
        operation: "update",
        message: "Paystack does not support updating refunds via API",
      },
      fix_instructions:
        "Refunds cannot be modified once created. Create a new refund if needed.",
    }),
    {
      status: 501,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

function generateCustomerNote(type: string, reason: string): string {
  const templates = {
    full: `Full refund processed for: ${reason}`,
    partial: `Partial refund processed for: ${reason}`,
    dispute: `Refund issued following dispute resolution: ${reason}`,
    cancellation: `Order cancellation refund: ${reason}`,
    return: `Return processed - refund issued: ${reason}`,
    damage: `Refund for damaged item: ${reason}`,
    seller_fault: `Refund due to seller issue: ${reason}`,
  };

  return (
    templates[type as keyof typeof templates] || `Refund processed: ${reason}`
  );
}

function generateMerchantNote(type: string, reason: string): string {
  const templates = {
    full: `Full refund - ${type}: ${reason}`,
    partial: `Partial refund - ${type}: ${reason}`,
    dispute: `Dispute resolution refund: ${reason}`,
    cancellation: `Order cancellation before fulfillment: ${reason}`,
    return: `Customer return accepted: ${reason}`,
    damage: `Product damage claim: ${reason}`,
    seller_fault: `Seller fault refund: ${reason}`,
  };

  return (
    templates[type as keyof typeof templates] || `${type} refund: ${reason}`
  );
}
