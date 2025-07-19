import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Validate request method
  if (!["POST", "GET", "PUT", "DELETE"].includes(req.method)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "METHOD_NOT_ALLOWED",
        details: {
          provided_method: req.method,
          allowed_methods: ["POST", "GET", "PUT", "DELETE"],
          message:
            "Transfer management endpoint accepts POST, GET, PUT, DELETE requests",
        },
        fix_instructions:
          "Use POST to create, GET to retrieve, PUT to update, DELETE to remove",
      }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    // Handle health check
    const url = new URL(req.url);
    if (
      url.pathname.endsWith("/health") ||
      url.searchParams.get("health") === "true"
    ) {
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
            fix_instructions: "Use supported methods: GET, POST, PUT, DELETE",
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
        fix_instructions: "Configure PAYSTACK_SECRET_KEY environment variable",
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
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_BANKS_FETCH_FAILED",
          details: {
            status_code: response.status,
            status_text: response.statusText,
            message: "Failed to fetch banks from Paystack",
          },
          fix_instructions:
            "Check Paystack API access and country/currency parameters",
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
        fix_instructions: "Check network connectivity and Paystack API status",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
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
        fix_instructions: "Provide both account_number and bank_code",
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
          fix_instructions: "Check account number and bank code are valid",
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
        fix_instructions: "Check network connectivity and account details",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleGetRecipients(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const recipientCode = url.searchParams.get("recipient_code");

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
    let endpoint = "https://api.paystack.co/transferrecipient";
    if (recipientCode) {
      endpoint += `/${recipientCode}`;
    }

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
          error: "PAYSTACK_RECIPIENTS_FETCH_FAILED",
          details: {
            status_code: response.status,
            status_text: response.statusText,
            recipient_code: recipientCode,
            message: "Failed to fetch recipients from Paystack",
          },
          fix_instructions:
            "Check recipient code validity and Paystack API access",
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
        message: recipientCode
          ? "Recipient retrieved successfully"
          : "Recipients listed successfully",
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
          recipient_code: recipientCode,
          message: "Error fetching recipients",
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

async function handleCreateRecipient(
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
    type = "nuban",
    name,
    description,
    account_number,
    bank_code,
    currency = "ZAR",
    email,
    user_id,
  } = requestBody as TransferRecipient & { user_id?: string };

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
        fix_instructions:
          "Provide all required fields: name, account_number, bank_code",
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
      description: description || `Transfer recipient for ${name}`,
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
          fix_instructions: "Check account details validity and bank code",
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const result = await response.json();

    // Store recipient information in database for future reference
    try {
      await supabase.from("transfer_recipients").insert({
        recipient_code: result.data.recipient_code,
        user_id: user_id,
        name: result.data.name,
        type: result.data.type,
        currency: result.data.currency,
        account_number: result.data.details.account_number,
        account_name: result.data.details.account_name,
        bank_code: result.data.details.bank_code,
        bank_name: result.data.details.bank_name,
        active: result.data.active,
        created_at: new Date().toISOString(),
        paystack_data: result.data,
      });
    } catch (dbError) {
      console.warn("Failed to store recipient in database:", dbError);
      // Continue as recipient was created successfully in Paystack
    }

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
          recipient_data: { name, account_number, bank_code },
          message: "Error creating recipient",
        },
        fix_instructions: "Check network connectivity and recipient data",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleInitiateTransfer(
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
    source = "balance",
    amount,
    reference,
    recipient,
    reason,
    user_id,
    order_id,
  } = requestBody as Transfer & { user_id?: string; order_id?: string };

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
        fix_instructions:
          "Provide all required fields: amount, reference, recipient, reason",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Validate amount
  if (typeof amount !== "number" || amount <= 0) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "INVALID_AMOUNT_FORMAT",
        details: {
          amount_type: typeof amount,
          amount_value: amount,
          message: "Amount must be a positive number",
        },
        fix_instructions:
          "Provide amount as a positive number in kobo (ZAR cents)",
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
      amount,
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
          fix_instructions: "Check recipient code, amount, and account balance",
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const result = await response.json();

    // Store transfer information in database for tracking
    try {
      await supabase.from("transfers").insert({
        transfer_code: result.data.transfer_code,
        reference: result.data.reference,
        user_id: user_id,
        order_id: order_id,
        recipient_code: recipient,
        amount: result.data.amount,
        currency: result.data.currency,
        source: result.data.source,
        reason: result.data.reason,
        status: result.data.status,
        created_at: new Date().toISOString(),
        paystack_data: result.data,
      });
    } catch (dbError) {
      console.warn("Failed to store transfer in database:", dbError);
      // Continue as transfer was initiated successfully in Paystack
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
          transfer_data: { amount, reference, recipient, reason },
          message: "Error initiating transfer",
        },
        fix_instructions: "Check network connectivity and transfer data",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleBulkTransfer(
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

  const { source = "balance", transfers } = requestBody as BulkTransfer;

  if (!transfers || !Array.isArray(transfers) || transfers.length === 0) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "INVALID_TRANSFERS_FORMAT",
        details: {
          transfers_type: typeof transfers,
          transfers_length: Array.isArray(transfers) ? transfers.length : "N/A",
          message: "Transfers must be a non-empty array",
        },
        fix_instructions:
          "Provide transfers as an array with at least one transfer",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const bulkPayload: BulkTransfer = {
      source,
      transfers,
    };

    const response = await fetch("https://api.paystack.co/transfer/bulk", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bulkPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_BULK_TRANSFER_FAILED",
          details: {
            status_code: response.status,
            status_text: response.statusText,
            paystack_error: errorData?.message || "Unknown Paystack error",
            transfer_count: transfers.length,
            message: "Paystack bulk transfer failed",
          },
          fix_instructions: "Check all transfer details and account balance",
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const result = await response.json();

    // Store bulk transfer information in database
    try {
      const transferRecords = result.data.map((transfer: any) => ({
        transfer_code: transfer.transfer_code,
        reference: transfer.reference,
        recipient_code: transfer.recipient,
        amount: transfer.amount,
        currency: transfer.currency,
        source: transfer.source,
        reason: transfer.reason,
        status: transfer.status,
        created_at: new Date().toISOString(),
        paystack_data: transfer,
        bulk_transfer: true,
      }));

      await supabase.from("transfers").insert(transferRecords);
    } catch (dbError) {
      console.warn("Failed to store bulk transfers in database:", dbError);
      // Continue as transfers were initiated successfully in Paystack
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result.data,
        message: "Bulk transfer initiated successfully",
        transfer_count: result.data.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "BULK_TRANSFER_ERROR",
        details: {
          error_message: error.message,
          transfer_count: transfers.length,
          message: "Error initiating bulk transfer",
        },
        fix_instructions: "Check network connectivity and transfer data",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleGetTransfers(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const transferCode = url.searchParams.get("transfer_code");

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
    let endpoint = "https://api.paystack.co/transfer";
    if (transferCode) {
      endpoint += `/${transferCode}`;
    }

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
          error: "PAYSTACK_TRANSFERS_FETCH_FAILED",
          details: {
            status_code: response.status,
            status_text: response.statusText,
            transfer_code: transferCode,
            message: "Failed to fetch transfers from Paystack",
          },
          fix_instructions:
            "Check transfer code validity and Paystack API access",
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
        message: transferCode
          ? "Transfer retrieved successfully"
          : "Transfers listed successfully",
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
          transfer_code: transferCode,
          message: "Error fetching transfers",
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

async function handleUpdateRecipient(
  req: Request,
  supabase: any,
): Promise<Response> {
  const url = new URL(req.url);
  const recipientCode = url.searchParams.get("recipient_code");

  if (!recipientCode) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "MISSING_RECIPIENT_CODE",
        details: {
          message: "Recipient code is required for updating recipients",
        },
        fix_instructions: "Provide recipient_code as query parameter",
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

  try {
    const response = await fetch(
      `https://api.paystack.co/transferrecipient/${recipientCode}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_RECIPIENT_UPDATE_FAILED",
          details: {
            status_code: response.status,
            status_text: response.statusText,
            paystack_error: errorData?.message || "Unknown Paystack error",
            recipient_code: recipientCode,
            message: "Paystack recipient update failed",
          },
          fix_instructions: "Check recipient code validity and update data",
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const result = await response.json();

    // Update recipient information in database
    try {
      await supabase
        .from("transfer_recipients")
        .update({
          name: result.data.name,
          active: result.data.active,
          updated_at: new Date().toISOString(),
          paystack_data: result.data,
        })
        .eq("recipient_code", recipientCode);
    } catch (dbError) {
      console.warn("Failed to update recipient in database:", dbError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result.data,
        message: "Recipient updated successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "RECIPIENT_UPDATE_ERROR",
        details: {
          error_message: error.message,
          recipient_code: recipientCode,
          message: "Error updating recipient",
        },
        fix_instructions: "Check network connectivity and recipient data",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleDeleteRecipient(
  req: Request,
  supabase: any,
): Promise<Response> {
  const url = new URL(req.url);
  const recipientCode = url.searchParams.get("recipient_code");

  if (!recipientCode) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "MISSING_RECIPIENT_CODE",
        details: {
          message: "Recipient code is required for deleting recipients",
        },
        fix_instructions: "Provide recipient_code as query parameter",
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
    const response = await fetch(
      `https://api.paystack.co/transferrecipient/${recipientCode}`,
      {
        method: "DELETE",
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
          error: "PAYSTACK_RECIPIENT_DELETE_FAILED",
          details: {
            status_code: response.status,
            status_text: response.statusText,
            paystack_error: errorData?.message || "Unknown Paystack error",
            recipient_code: recipientCode,
            message: "Paystack recipient deletion failed",
          },
          fix_instructions: "Check recipient code validity",
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const result = await response.json();

    // Soft delete recipient in database
    try {
      await supabase
        .from("transfer_recipients")
        .update({
          active: false,
          deleted_at: new Date().toISOString(),
        })
        .eq("recipient_code", recipientCode);
    } catch (dbError) {
      console.warn("Failed to delete recipient in database:", dbError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result.data,
        message: "Recipient deleted successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "RECIPIENT_DELETE_ERROR",
        details: {
          error_message: error.message,
          recipient_code: recipientCode,
          message: "Error deleting recipient",
        },
        fix_instructions: "Check network connectivity and recipient code",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}
