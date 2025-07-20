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

        // For health checks, check URL params only (no body consumption)
    if (isHealthCheck) {
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
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate request method for non-health endpoints
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

    // Check environment configuration
    if (!PAYSTACK_SECRET_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_NOT_CONFIGURED",
          details: {
            missing_env_vars: ["PAYSTACK_SECRET_KEY"],
            message: "Paystack integration is not configured",
          },
          fix_instructions:
            "Configure PAYSTACK_SECRET_KEY environment variable",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Handle different HTTP methods
    switch (req.method) {
      case "POST":
        return await handleCreateTransfer(req);
      case "GET":
        return await handleGetTransfers(req);
      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: "METHOD_NOT_SUPPORTED",
            message: `Method ${req.method} is not fully implemented yet`,
          }),
          {
            status: 501,
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

async function handleCreateTransfer(req: Request): Promise<Response> {
  try {
    const transferData: Transfer = await req.json();

    const response = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transferData),
    });

    const result = await response.json();

    return new Response(
      JSON.stringify({
        success: response.ok,
        data: result,
        timestamp: new Date().toISOString(),
      }),
      {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "CREATE_TRANSFER_FAILED",
        details: { error_message: error.message },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleGetTransfers(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const transferCode = url.searchParams.get("transfer_code");

    let apiUrl = "https://api.paystack.co/transfer";
    if (transferCode) {
      apiUrl += `/${transferCode}`;
    }

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    return new Response(
      JSON.stringify({
        success: response.ok,
        data: result,
        timestamp: new Date().toISOString(),
      }),
      {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "GET_TRANSFERS_FAILED",
        details: { error_message: error.message },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}
