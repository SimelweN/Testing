import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, getCorsHeaders } from "../_shared/cors.ts";
import { handleOptionsRequest, isOptionsRequest } from "../_shared/options-handler.ts";
import { testFunction } from "../_mock-data/edge-function-tester.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface PaystackSubaccount {
  subaccount: string;
  share: number;
}

interface SplitRequest {
  name: string;
  type: "percentage" | "flat";
  currency: string;
  subaccounts: PaystackSubaccount[];
  bearer_type?: "account" | "subaccount";
  bearer_subaccount?: string;
}

serve(async (req) => {
  // Handle OPTIONS requests with enhanced CORS
  if (isOptionsRequest(req)) {
    return handleOptionsRequest(req);
  }

  // 🧪 TEST MODE: Check if this is a test request with mock data
  const testResult = await testFunction("paystack-split-management", req);
  if (testResult.isTest) {
    return testResult.response;
  }

  try {
    // Handle health check first (no body consumption)
    const url = new URL(req.url);
    const isHealthCheck =
      url.pathname.endsWith("/health") ||
      url.searchParams.get("health") === "true";

    if (isHealthCheck) {
      return new Response(
        JSON.stringify({
          success: true,
          service: "paystack-split-management",
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
              "Split management endpoint accepts POST, GET, PUT, DELETE requests",
          },
          fix_instructions:
            "Use POST to create, GET to retrieve, PUT to update, DELETE to remove splits",
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

    // Read request body ONCE for POST/PUT methods (ChatGPT's advice)
    let requestBody = null;
    if (req.method === "POST" || req.method === "PUT") {
      try {
        console.log("🔍 bodyUsed before read:", req.bodyUsed);
        requestBody = await req.json();
        console.log("✅ Body read successfully");
      } catch (error) {
        console.error("❌ Body read failed:", error.message);
        return new Response(
          JSON.stringify({
            success: false,
            error: "BODY_READ_ERROR",
            details: { error: error.message, bodyUsed: req.bodyUsed },
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

        // Handle different HTTP methods
    switch (req.method) {
      case "POST":
        return await handleCreateSplit(requestBody);
      case "GET":
        return await handleGetSplits(req);
            case "PUT":
        return await handleUpdateSplit(req, requestBody);
      case "DELETE":
        return await handleDeleteSplit(req);
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
    console.error("Split management error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "UNEXPECTED_SPLIT_MANAGEMENT_ERROR",
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

async function handleCreateSplit(splitData: SplitRequest): Promise<Response> {
  try {

    const response = await fetch("https://api.paystack.co/split", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(splitData),
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
        error: "CREATE_SPLIT_FAILED",
        details: { error_message: error.message },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleGetSplits(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const splitCode = url.searchParams.get("split_code");

    let apiUrl = "https://api.paystack.co/split";
    if (splitCode) {
      apiUrl += `/${splitCode}`;
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
        error: "GET_SPLITS_FAILED",
        details: { error_message: error.message },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleUpdateSplit(req: Request, updateData: any): Promise<Response> {
  try {
    const url = new URL(req.url);
    const splitCode = url.searchParams.get("split_code");

    if (!splitCode) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "SPLIT_CODE_REQUIRED",
          details: {
            message: "split_code query parameter is required for updates",
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

            // updateData is passed as parameter - no need to read body again

    const response = await fetch(`https://api.paystack.co/split/${splitCode}`, {
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
        error: "UPDATE_SPLIT_FAILED",
        details: { error_message: error.message },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleDeleteSplit(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const splitCode = url.searchParams.get("split_code");

    if (!splitCode) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "SPLIT_CODE_REQUIRED",
          details: {
            message: "split_code query parameter is required for deletion",
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const response = await fetch(`https://api.paystack.co/split/${splitCode}`, {
      method: "DELETE",
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
        error: "DELETE_SPLIT_FAILED",
        details: { error_message: error.message },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}
