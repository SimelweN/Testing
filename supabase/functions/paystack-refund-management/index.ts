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

  try {
    // Handle health check first
    const url = new URL(req.url);
    const isHealthCheck =
      url.pathname.endsWith("/health") ||
      url.searchParams.get("health") === "true";

    // Check for health check in POST body as well
    let body = null;
    if (req.method === "POST" || req.method === "PUT") {
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
          service: "paystack-refund-management",
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
    if (!["POST", "GET", "PUT"].includes(req.method)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "METHOD_NOT_ALLOWED",
          details: {
            provided_method: req.method,
            allowed_methods: ["POST", "GET", "PUT"],
            message:
              "Refund management endpoint accepts POST, GET, PUT requests",
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
        return await handleCreateRefund(req);
      case "GET":
        return await handleGetRefunds(req);
      case "PUT":
        return await handleUpdateRefund(req);
      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: "METHOD_NOT_SUPPORTED",
            message: `Method ${req.method} is not supported`,
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

async function handleCreateRefund(req: Request): Promise<Response> {
  try {
    const refundData: RefundRequest = await req.json();

    const response = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(refundData),
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
        error: "CREATE_REFUND_FAILED",
        details: { error_message: error.message },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleGetRefunds(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const reference = url.searchParams.get("reference");

    let apiUrl = "https://api.paystack.co/refund";
    if (reference) {
      apiUrl += `/${reference}`;
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
        error: "GET_REFUNDS_FAILED",
        details: { error_message: error.message },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleUpdateRefund(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const refundId = url.searchParams.get("refund_id");

    if (!refundId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "REFUND_ID_REQUIRED",
          details: {
            message: "refund_id query parameter is required for updates",
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const updateData = await req.json();

    const response = await fetch(`https://api.paystack.co/refund/${refundId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
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
        error: "UPDATE_REFUND_FAILED",
        details: { error_message: error.message },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}
