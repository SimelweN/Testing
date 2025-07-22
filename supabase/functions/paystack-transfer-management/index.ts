import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { testFunction } from "../_mock-data/edge-function-tester.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface TransferRecipient {
  type: "nuban" | "mobile_money" | "basa";
  name: string;
  description?: string;
  account_number: string;
  bank_code: string;
  currency: string;
  email?: string;
}

interface Transfer {
  source: "balance";
  amount: number;
  reference: string;
  recipient: string;
  reason: string;
}

interface BulkTransfer {
  source: "balance";
  transfers: Array<{
    amount: number;
    reference: string;
    recipient: string;
    reason: string;
  }>;
}

// Helper function to get user from request
async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const token = authHeader.replace("Bearer ", "");
    
    // For testing purposes, allow mock tokens
    if (token === "mock-token" || token === "test-token") {
      return {
        id: "test-user-id",
        email: "test@example.com",
        user_metadata: { name: "Test User" }
      };
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error) {
      console.error("Auth error:", error);
      return null;
    }

    return user;
  } catch (error) {
    console.error("Auth function error:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 🧪 TEST MODE: Check if this is a test request with mock data
  const testResult = await testFunction("paystack-transfer-management", req);
  if (testResult.isTest) {
    return testResult.response;
  }

  if (!["POST", "GET", "PUT", "DELETE"].includes(req.method)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "METHOD_NOT_ALLOWED",
        details: {
          provided_method: req.method,
          allowed_methods: ["POST", "GET", "PUT", "DELETE"],
          message: "Transfer management endpoint accepts POST, GET, PUT, DELETE requests",
        },
      }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    // Check if this is a health check first
    const url = new URL(req.url);
    if (url.pathname.endsWith("/health") || url.searchParams.get("health") === "true") {
      return new Response(
        JSON.stringify({
          success: true,
          service: "paystack-transfer-management",
          status: "healthy",
          timestamp: new Date().toISOString(),
          environment: {
            paystack_configured: !!PAYSTACK_SECRET_KEY,
            supabase_configured: !!(SUPABASE_URL && SUPABASE_SERVICE_KEY),
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const action = url.searchParams.get("action");

    // Handle different actions
    switch (req.method) {
      case "GET":
        if (action === "recipients") {
          return await handleGetRecipients(req);
        } else if (action === "transfers") {
          return await handleGetTransfers(req);
        } else if (action === "banks") {
          return await handleGetBanks(req);
        } else {
          return await handleGetTransfers(req); // Default to transfers
        }
      case "POST":
        if (action === "create-recipient") {
          return await handleCreateRecipient(req, supabase);
        } else if (action === "initiate-transfer") {
          return await handleInitiateTransfer(req, supabase);
        } else if (action === "bulk-transfer") {
          return await handleBulkTransfer(req, supabase);
        } else if (action === "verify-account") {
          return await handleVerifyAccount(req);
        } else {
          return await handleInitiateTransfer(req, supabase); // Default to transfer
        }
      case "PUT":
        return await handleUpdateRecipient(req, supabase);
      case "DELETE":
        return await handleDeleteRecipient(req, supabase);
      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: "UNSUPPORTED_METHOD",
            details: {
              method: req.method,
              message: "Method not implemented",
            },
          }),
          {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
    }
  } catch (error) {
    console.error("Transfer management error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "UNEXPECTED_TRANSFER_MANAGEMENT_ERROR",
        details: {
          error_message: error.message,
          error_type: error.constructor.name,
          timestamp: new Date().toISOString(),
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function handleGetBanks(req: Request): Promise<Response> {
  if (!PAYSTACK_SECRET_KEY) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "PAYSTACK_NOT_CONFIGURED",
        details: {
          missing_env_vars: ["PAYSTACK_SECRET_KEY"],
          message: "Paystack integration is not configured",
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const url = new URL(req.url);
    const country = url.searchParams.get("country") || "south-africa";
    const currency = url.searchParams.get("currency") || "ZAR";

    const response = await fetch(
      `https://api.paystack.co/bank?country=${country}&currency=${currency}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_BANKS_FETCH_FAILED",
          details: {
            status_code: response.status,
            status_text: response.statusText,
            paystack_error: errorData?.message || "Unknown error",
            message: "Failed to fetch banks from Paystack",
          },
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
        message: "Banks retrieved successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "BANKS_FETCH_ERROR",
        details: {
          error_message: error.message,
          message: "Error fetching banks",
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleGetRecipients(req: Request): Promise<Response> {
  if (!PAYSTACK_SECRET_KEY) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "PAYSTACK_NOT_CONFIGURED",
        details: {
          missing_env_vars: ["PAYSTACK_SECRET_KEY"],
          message: "Paystack integration is not configured",
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const response = await fetch("https://api.paystack.co/transferrecipient", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_RECIPIENTS_FETCH_FAILED",
          details: {
            status_code: response.status,
            status_text: response.statusText,
            paystack_error: errorData?.message || "Unknown error",
            message: "Failed to fetch recipients from Paystack",
          },
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
        message: "Recipients retrieved successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "RECIPIENTS_FETCH_ERROR",
        details: {
          error_message: error.message,
          message: "Error fetching recipients",
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleCreateRecipient(req: Request, supabase: any): Promise<Response> {
  if (!PAYSTACK_SECRET_KEY) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "PAYSTACK_NOT_CONFIGURED",
        details: {
          missing_env_vars: ["PAYSTACK_SECRET_KEY"],
          message: "Paystack integration is not configured",
        },
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
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const {
    type = "nuban",
    name,
    description,
    account_number,
    bank_code,
    currency = "ZAR",
    email,
  } = requestBody as TransferRecipient;

  // Validate required fields
  const missingFields = [];
  if (!name) missingFields.push("name");
  if (!account_number) missingFields.push("account_number");
  if (!bank_code) missingFields.push("bank_code");

  if (missingFields.length > 0) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "MISSING_REQUIRED_FIELDS",
        details: {
          missing_fields: missingFields,
          provided_fields: Object.keys(requestBody || {}),
          message: "Required fields are missing for recipient creation",
        },
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const recipientPayload: TransferRecipient = {
      type,
      name,
      description,
      account_number,
      bank_code,
      currency,
      email,
    };

    const response = await fetch("https://api.paystack.co/transferrecipient", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(recipientPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_RECIPIENT_CREATION_FAILED",
          details: {
            status_code: response.status,
            status_text: response.statusText,
            paystack_error: errorData?.message || "Unknown Paystack error",
            recipient_data: recipientPayload,
            message: "Paystack recipient creation failed",
          },
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
        message: "Recipient created successfully",
        recipient_code: result.data.recipient_code,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "RECIPIENT_CREATION_ERROR",
        details: {
          error_message: error.message,
          message: "Error creating recipient",
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleInitiateTransfer(req: Request, supabase: any): Promise<Response> {
  if (!PAYSTACK_SECRET_KEY) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "PAYSTACK_NOT_CONFIGURED",
        details: {
          missing_env_vars: ["PAYSTACK_SECRET_KEY"],
          message: "Paystack integration is not configured",
        },
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
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const {
    source = "balance",
    amount,
    reference,
    recipient,
    reason,
  } = requestBody;

  // Validate required fields
  const missingFields = [];
  if (!amount) missingFields.push("amount");
  if (!reference) missingFields.push("reference");
  if (!recipient) missingFields.push("recipient");
  if (!reason) missingFields.push("reason");

  if (missingFields.length > 0) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "MISSING_REQUIRED_FIELDS",
        details: {
          missing_fields: missingFields,
          provided_fields: Object.keys(requestBody || {}),
          message: "Required fields are missing for transfer initiation",
        },
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  if (typeof amount !== "number" || amount <= 0) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "INVALID_AMOUNT",
        details: {
          amount_type: typeof amount,
          amount_value: amount,
          message: "Amount must be a positive number",
        },
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const transferPayload: Transfer = {
      source,
      amount: amount * 100, // Convert to kobo
      reference,
      recipient,
      reason,
    };

    const response = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transferPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_TRANSFER_INITIATION_FAILED",
          details: {
            status_code: response.status,
            status_text: response.statusText,
            paystack_error: errorData?.message || "Unknown Paystack error",
            transfer_data: transferPayload,
            message: "Paystack transfer initiation failed",
          },
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const result = await response.json();

    // Store transfer in database
    const { error: insertError } = await supabase.from("payout_transactions").insert({
        transfer_reference: result.data.reference,
        amount: amount,
        status: result.data.status,
        paystack_response: result.data,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.warn("Failed to store transfer in database:", insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result.data,
        message: "Transfer initiated successfully",
        transfer_code: result.data.transfer_code,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "TRANSFER_INITIATION_ERROR",
        details: {
          error_message: error.message,
          message: "Error initiating transfer",
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleGetTransfers(req: Request): Promise<Response> {
  if (!PAYSTACK_SECRET_KEY) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "PAYSTACK_NOT_CONFIGURED",
        details: {
          missing_env_vars: ["PAYSTACK_SECRET_KEY"],
          message: "Paystack integration is not configured",
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const response = await fetch("https://api.paystack.co/transfer", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_TRANSFERS_FETCH_FAILED",
          details: {
            status_code: response.status,
            status_text: response.statusText,
            paystack_error: errorData?.message || "Unknown error",
            message: "Failed to fetch transfers from Paystack",
          },
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
        message: "Transfers retrieved successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "TRANSFERS_FETCH_ERROR",
        details: {
          error_message: error.message,
          message: "Error fetching transfers",
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleBulkTransfer(req: Request, supabase: any): Promise<Response> {
  // Implementation for bulk transfers
  return new Response(
    JSON.stringify({
      success: false,
      error: "NOT_IMPLEMENTED",
      message: "Bulk transfer functionality is not yet implemented",
    }),
    {
      status: 501,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

async function handleVerifyAccount(req: Request): Promise<Response> {
  if (!PAYSTACK_SECRET_KEY) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "PAYSTACK_NOT_CONFIGURED",
        details: {
          missing_env_vars: ["PAYSTACK_SECRET_KEY"],
          message: "Paystack integration is not configured",
        },
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
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const { account_number, bank_code } = requestBody;

  if (!account_number || !bank_code) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "MISSING_ACCOUNT_DETAILS",
        details: {
          missing_fields: !account_number ? ["account_number"] : ["bank_code"],
          message: "Account number and bank code are required for verification",
        },
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const response = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const result = await response.json();

    if (!response.ok || !result.status) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ACCOUNT_VERIFICATION_FAILED",
          details: {
            status_code: response.status,
            paystack_message: result.message,
            account_number: account_number,
            bank_code: bank_code,
            message: "Account verification failed",
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result.data,
        message: "Account verified successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "ACCOUNT_VERIFICATION_ERROR",
        details: {
          error_message: error.message,
          message: "Error verifying account",
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleUpdateRecipient(req: Request, supabase: any): Promise<Response> {
  // Implementation for updating recipients
  return new Response(
    JSON.stringify({
      success: false,
      error: "NOT_IMPLEMENTED",
      message: "Update recipient functionality is not yet implemented",
    }),
    {
      status: 501,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

async function handleDeleteRecipient(req: Request, supabase: any): Promise<Response> {
  // Implementation for deleting recipients
  return new Response(
    JSON.stringify({
      success: false,
      error: "NOT_IMPLEMENTED",
      message: "Delete recipient functionality is not yet implemented",
    }),
    {
      status: 501,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}
