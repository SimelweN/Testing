import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Enhanced fetch with timeout for better reliability
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 30000,
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Request timeout after " + timeoutMs + "ms");
    }
    throw error;
  }
}

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

    // Handle different HTTP methods
    switch (req.method) {
      case "GET":
        return await handleGetSplits(req);
      case "POST":
        return await handleCreateSplit(req, supabase);
      case "PUT":
        return await handleUpdateSplit(req, supabase);
      case "DELETE":
        return await handleDeleteSplit(req);
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

async function handleGetSplits(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const splitCode = url.searchParams.get("split_code");

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
    let endpoint = "https://api.paystack.co/split";
    if (splitCode) {
      endpoint += `/${splitCode}`;
    }

    const response = await fetchWithTimeout(endpoint, {
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
          error: "PAYSTACK_SPLIT_FETCH_FAILED",
          details: {
            status_code: response.status,
            status_text: response.statusText,
            split_code: splitCode,
            message: "Failed to fetch split information from Paystack",
          },
          fix_instructions: "Check split code validity and Paystack API access",
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
        message: splitCode
          ? "Split retrieved successfully"
          : "Splits listed successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "SPLIT_FETCH_ERROR",
        details: {
          error_message: error.message,
          split_code: splitCode,
          message: "Error fetching split information",
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

async function handleCreateSplit(
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
    name,
    type = "percentage",
    currency = "ZAR",
    subaccounts,
    bearer_type = "account",
    bearer_subaccount,
    order_items,
  } = requestBody as SplitRequest & { order_items?: any[] };

  // Validate required fields
  const missingFields = [];
  if (!name) missingFields.push("name");
  if (!subaccounts || !Array.isArray(subaccounts) || subaccounts.length === 0) {
    missingFields.push("subaccounts");
  }

  if (missingFields.length > 0) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "MISSING_REQUIRED_FIELDS",
        details: {
          missing_fields: missingFields,
          provided_fields: Object.keys(requestBody || {}),
          message: "Required fields are missing for split creation",
        },
        fix_instructions:
          "Provide all required fields: name, subaccounts (array)",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Validate split data
  if (type === "percentage") {
    const totalPercentage = subaccounts.reduce(
      (sum, sub) => sum + sub.share,
      0,
    );
    if (totalPercentage > 100) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_PERCENTAGE_SPLIT",
          details: {
            total_percentage: totalPercentage,
            max_allowed: 100,
            subaccounts: subaccounts,
            message: "Total percentage split cannot exceed 100%",
          },
          fix_instructions:
            "Ensure the sum of all subaccount shares does not exceed 100%",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  }

  // If order_items are provided, auto-calculate splits based on seller amounts
  let finalSubaccounts = subaccounts;
  if (order_items && order_items.length > 0) {
    try {
      finalSubaccounts = await calculateSplitsFromItems(order_items, supabase);
    } catch (calcError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "SPLIT_CALCULATION_FAILED",
          details: {
            calculation_error: calcError.message,
            order_items: order_items,
            message: "Failed to calculate splits from order items",
          },
          fix_instructions:
            "Check order items format and seller subaccount configuration",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  }

  try {
    const splitPayload: SplitRequest = {
      name,
      type,
      currency,
      subaccounts: finalSubaccounts,
      bearer_type,
      bearer_subaccount,
    };

    const response = await fetch("https://api.paystack.co/split", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(splitPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_SPLIT_CREATION_FAILED",
          details: {
            status_code: response.status,
            status_text: response.statusText,
            paystack_error: errorData?.message || "Unknown Paystack error",
            split_data: splitPayload,
            message: "Paystack split creation failed",
          },
          fix_instructions:
            "Check subaccount codes validity and split configuration",
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const result = await response.json();

    // Store split information in database for future reference
    try {
      await supabase.from("payment_splits").insert({
        split_code: result.data.split_code,
        name: result.data.name,
        type: result.data.type,
        currency: result.data.currency,
        subaccounts: result.data.subaccounts,
        total_subaccounts: result.data.total_subaccounts,
        active: result.data.active,
        created_at: new Date().toISOString(),
        paystack_data: result.data,
      });
    } catch (dbError) {
      console.warn("Failed to store split in database:", dbError);
      // Continue as split was created successfully in Paystack
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result.data,
        message: "Split created successfully",
        split_code: result.data.split_code,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "SPLIT_CREATION_ERROR",
        details: {
          error_message: error.message,
          split_data: { name, type, currency, subaccounts },
          message: "Error creating split",
        },
        fix_instructions: "Check network connectivity and split configuration",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleUpdateSplit(
  req: Request,
  supabase: any,
): Promise<Response> {
  const url = new URL(req.url);
  const splitCode = url.searchParams.get("split_code");

  if (!splitCode) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "MISSING_SPLIT_CODE",
        details: {
          message: "Split code is required for updating splits",
        },
        fix_instructions: "Provide split_code as query parameter",
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
    const response = await fetch(`https://api.paystack.co/split/${splitCode}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_SPLIT_UPDATE_FAILED",
          details: {
            status_code: response.status,
            status_text: response.statusText,
            paystack_error: errorData?.message || "Unknown Paystack error",
            split_code: splitCode,
            message: "Paystack split update failed",
          },
          fix_instructions: "Check split code validity and update data",
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const result = await response.json();

    // Update split information in database
    try {
      await supabase
        .from("payment_splits")
        .update({
          name: result.data.name,
          active: result.data.active,
          updated_at: new Date().toISOString(),
          paystack_data: result.data,
        })
        .eq("split_code", splitCode);
    } catch (dbError) {
      console.warn("Failed to update split in database:", dbError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result.data,
        message: "Split updated successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "SPLIT_UPDATE_ERROR",
        details: {
          error_message: error.message,
          split_code: splitCode,
          message: "Error updating split",
        },
        fix_instructions: "Check network connectivity and split data",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleDeleteSplit(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const splitCode = url.searchParams.get("split_code");

  if (!splitCode) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "MISSING_SPLIT_CODE",
        details: {
          message: "Split code is required for deleting splits",
        },
        fix_instructions: "Provide split_code as query parameter",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Note: Paystack doesn't support deleting splits via API
  // This is a placeholder for future implementation or deactivation
  return new Response(
    JSON.stringify({
      success: false,
      error: "OPERATION_NOT_SUPPORTED",
      details: {
        operation: "delete",
        split_code: splitCode,
        message: "Paystack does not support deleting splits via API",
      },
      fix_instructions:
        "Use the Paystack dashboard to manage split deletion or deactivation",
    }),
    {
      status: 501,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

async function calculateSplitsFromItems(
  items: any[],
  supabase: any,
): Promise<PaystackSubaccount[]> {
  // Get unique seller IDs
  const sellerIds = [...new Set(items.map((item) => item.seller_id))];

  // Fetch seller subaccount information
  const { data: sellers, error: sellersError } = await supabase
    .from("profiles")
    .select("id, subaccount_code, name")
    .in("id", sellerIds);

  if (sellersError) {
    throw new Error(`Failed to fetch seller data: ${sellersError.message}`);
  }

  const splitSubaccounts: PaystackSubaccount[] = [];

  for (const seller of sellers) {
    if (!seller.subaccount_code) {
      throw new Error(
        `Seller ${seller.name} (${seller.id}) does not have a subaccount configured`,
      );
    }

    // Calculate total for this seller (90% of book prices, platform keeps 10%)
    const sellerItems = items.filter((item) => item.seller_id === seller.id);
    const sellerTotal = sellerItems.reduce(
      (sum, item) => sum + (item.price || 0),
      0,
    );
    const sellerShare = sellerTotal * 0.9; // 90% to seller, 10% to platform

    if (sellerShare > 0) {
      splitSubaccounts.push({
        subaccount: seller.subaccount_code,
        share: Math.round(sellerShare * 100), // Convert to kobo for flat amounts
      });
    }
  }

  return splitSubaccounts;
}
