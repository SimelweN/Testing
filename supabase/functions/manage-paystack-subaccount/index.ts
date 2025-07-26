import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { testFunction } from "../_mock-data/edge-function-tester.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface SubaccountUpdateRequest {
  business_name?: string;
  settlement_bank?: string;
  account_number?: string;
  percentage_charge?: number;
  description?: string;
  primary_contact_email?: string;
  primary_contact_name?: string;
  primary_contact_phone?: string;
  metadata?: Record<string, any>;
  settlement_schedule?: "auto" | "weekly" | "monthly" | "manual";
}

interface SubaccountCreateRequest extends SubaccountUpdateRequest {
  business_name: string;
  settlement_bank: string;
  account_number: string;
}

// Helper function to get user from request
async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return null;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error) {
    console.error("Auth error:", error);
    return null;
  }

  return user;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 🧪 TEST MODE: Check if this is a test request with mock data
  const testResult = await testFunction("manage-paystack-subaccount", req);
  if (testResult.isTest) {
    return testResult.response;
  }

  try {
    console.log("=== Paystack Subaccount Management Request ===");

    // Handle health check
    const url = new URL(req.url);
    const isHealthCheck =
      url.pathname.endsWith("/health") ||
      url.searchParams.get("health") === "true";

        // For health checks, check URL params only (no body consumption)
    if (isHealthCheck) {
      return new Response(
        JSON.stringify({
          success: true,
          service: "manage-paystack-subaccount",
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

    // Check environment variables
    if (!PAYSTACK_SECRET_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_NOT_CONFIGURED",
          details: {
            message: "Paystack integration not configured",
          },
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
    const subaccountId = url.searchParams.get("subaccount_id");

    // Handle different HTTP methods and actions
    switch (req.method) {
      case "GET":
        if (action === "fetch" && subaccountId) {
          return await handleFetchSubaccount(subaccountId);
        } else if (action === "list") {
          return await handleListSubaccounts(url);
        } else {
          // Get user subaccount requires authentication
          const user = await getUserFromRequest(req);
          if (!user) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "AUTHENTICATION_FAILED",
                details: {
                  message: "User authentication required for this operation",
                },
              }),
              {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              },
            );
          }
          return await handleGetUserSubaccount(user.id, supabase);
        }

      case "POST":
        if (action === "create") {
          // Authenticate user for subaccount creation
          const user = await getUserFromRequest(req);
          if (!user) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "AUTHENTICATION_FAILED",
                details: {
                  message:
                    "User authentication required for subaccount creation",
                },
              }),
              {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              },
            );
          }

          // Parse request body
          let requestBody;
          try {
            requestBody = await req.json();
          } catch (error) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "INVALID_JSON_PAYLOAD",
                details: {
                  error_message: error.message,
                  message: "Request body must be valid JSON",
                },
              }),
              {
                status: 400,
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                },
              },
            );
          }
          return await handleCreateSubaccount(requestBody, user, supabase);
        } else {
          return new Response(
            JSON.stringify({
              success: false,
              error: "INVALID_ACTION",
              details: { message: "Use action=create for POST requests" },
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

      case "PUT":
        if (action === "update" && subaccountId) {
          // Authenticate user for subaccount update
          const user = await getUserFromRequest(req);
          if (!user) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "AUTHENTICATION_FAILED",
                details: {
                  message: "User authentication required for subaccount update",
                },
              }),
              {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              },
            );
          }

          // Parse request body
          let requestBody;
          try {
            requestBody = await req.json();
          } catch (error) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "INVALID_JSON_PAYLOAD",
                details: {
                  error_message: error.message,
                  message: "Request body must be valid JSON",
                },
              }),
              {
                status: 400,
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                },
              },
            );
          }
          return await handleUpdateSubaccount(
            requestBody,
            user,
            subaccountId,
            supabase,
          );
        } else {
          return new Response(
            JSON.stringify({
              success: false,
              error: "INVALID_UPDATE_REQUEST",
              details: {
                message: "Use action=update&subaccount_id=ID for PUT requests",
              },
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: "METHOD_NOT_ALLOWED",
            details: { allowed_methods: ["GET", "POST", "PUT"] },
          }),
          {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
    }
  } catch (error) {
    console.error("Subaccount management error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "UNEXPECTED_ERROR",
        details: {
          error_message: error.message,
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

// Fetch specific subaccount from Paystack
async function handleFetchSubaccount(subaccountId: string): Promise<Response> {
  try {
    const response = await fetch(
      `https://api.paystack.co/subaccount/${subaccountId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_FETCH_FAILED",
          details: {
            paystack_error: data.message || "Failed to fetch subaccount",
            subaccount_id: subaccountId,
          },
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: data.data,
        message: "Subaccount fetched successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "FETCH_ERROR",
        details: { error_message: error.message },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

// List subaccounts with pagination
async function handleListSubaccounts(url: URL): Promise<Response> {
  try {
    const page = url.searchParams.get("page") || "1";
    const perPage = url.searchParams.get("perPage") || "50";
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    let endpoint = `https://api.paystack.co/subaccount?page=${page}&perPage=${perPage}`;
    if (from) endpoint += `&from=${from}`;
    if (to) endpoint += `&to=${to}`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_LIST_FAILED",
          details: {
            paystack_error: data.message || "Failed to list subaccounts",
          },
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: data.data,
        meta: data.meta,
        message: "Subaccounts listed successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "LIST_ERROR",
        details: { error_message: error.message },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

// Get user's subaccount from database
async function handleGetUserSubaccount(
  userId: string,
  supabase: any,
): Promise<Response> {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("subaccount_code, preferences")
      .eq("id", userId)
      .single();

    if (error || !profile?.subaccount_code) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "NO_SUBACCOUNT_FOUND",
          details: { message: "User has no subaccount setup" },
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get banking details
    const { data: bankingData } = await supabase
      .from("banking_subaccounts")
      .select("*")
      .eq("subaccount_code", profile.subaccount_code)
      .single();

    // Fetch live data from Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/subaccount/${profile.subaccount_code}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      },
    );

    let paystackData = null;
    if (paystackResponse.ok) {
      const result = await paystackResponse.json();
      if (result.status) {
        paystackData = result.data;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          subaccount_code: profile.subaccount_code,
          banking_details: bankingData,
          paystack_data: paystackData,
          profile_preferences: profile.preferences,
        },
        message: "User subaccount details retrieved",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "GET_USER_SUBACCOUNT_ERROR",
        details: { error_message: error.message },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

// Create new subaccount
async function handleCreateSubaccount(
  requestBody: any,
  user: any,
  supabase: any,
): Promise<Response> {
  const {
    business_name,
    settlement_bank,
    account_number,
    percentage_charge = 10,
    description,
    primary_contact_email,
    primary_contact_name,
    primary_contact_phone,
    metadata = {},
    settlement_schedule = "auto",
  } = requestBody as SubaccountCreateRequest;

  // Validation
  const validationErrors = [];
  if (!business_name) validationErrors.push("business_name is required");
  if (!settlement_bank) validationErrors.push("settlement_bank is required");
  if (!account_number) validationErrors.push("account_number is required");

  if (validationErrors.length > 0) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "VALIDATION_FAILED",
        details: { validation_errors: validationErrors },
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const paystackPayload = {
      business_name,
      settlement_bank,
      account_number,
      percentage_charge,
      description:
        description || `ReBooked seller subaccount for ${business_name}`,
      primary_contact_email: primary_contact_email || user.email,
      primary_contact_name: primary_contact_name || business_name,
      primary_contact_phone,
      settlement_schedule,
      metadata: {
        ...metadata,
        user_id: user.id,
        created_via: "rebooked_management_portal",
        created_at: new Date().toISOString(),
      },
    };

    const response = await fetch("https://api.paystack.co/subaccount", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackPayload),
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_CREATE_FAILED",
          details: {
            paystack_error: data.message || "Unknown Paystack error",
            status_code: response.status,
          },
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const subaccountCode = data.data.subaccount_code;

    // Store in database
    await supabase.from("banking_subaccounts").insert({
      user_id: user.id,
      business_name,
      email: primary_contact_email || user.email,
      bank_name: settlement_bank,
      bank_code: settlement_bank,
      account_number,
      subaccount_code: subaccountCode,
      paystack_response: data.data,
      status: "active",
    });

    // Update profile
    await supabase
      .from("profiles")
      .update({
        subaccount_code: subaccountCode,
      })
      .eq("id", user.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: data.data,
        message: "Subaccount created successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "CREATE_ERROR",
        details: { error_message: error.message },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

// Update existing subaccount
async function handleUpdateSubaccount(
  requestBody: any,
  user: any,
  subaccountId: string,
  supabase: any,
): Promise<Response> {
  const {
    business_name,
    settlement_bank,
    account_number,
    percentage_charge,
    description,
    primary_contact_email,
    primary_contact_name,
    primary_contact_phone,
    metadata = {},
    settlement_schedule,
  } = requestBody as SubaccountUpdateRequest;

  // Verify user owns this subaccount
  const { data: profile } = await supabase
    .from("profiles")
    .select("subaccount_code")
    .eq("id", user.id)
    .single();

  if (!profile || profile.subaccount_code !== subaccountId) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "UNAUTHORIZED_SUBACCOUNT_ACCESS",
        details: { message: "User does not own this subaccount" },
      }),
      {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const updatePayload: SubaccountUpdateRequest = {
      metadata: {
        ...metadata,
        user_id: user.id,
        updated_via: "rebooked_management_portal",
        last_updated: new Date().toISOString(),
      },
    };

    // Only include fields that are being updated
    if (business_name) updatePayload.business_name = business_name;
    if (settlement_bank) updatePayload.settlement_bank = settlement_bank;
    if (account_number) updatePayload.account_number = account_number;
    if (percentage_charge !== undefined)
      updatePayload.percentage_charge = percentage_charge;
    if (description) updatePayload.description = description;
    if (primary_contact_email)
      updatePayload.primary_contact_email = primary_contact_email;
    if (primary_contact_name)
      updatePayload.primary_contact_name = primary_contact_name;
    if (primary_contact_phone)
      updatePayload.primary_contact_phone = primary_contact_phone;
    if (settlement_schedule)
      updatePayload.settlement_schedule = settlement_schedule;

    const response = await fetch(
      `https://api.paystack.co/subaccount/${subaccountId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      },
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_UPDATE_FAILED",
          details: {
            paystack_error: data.message || "Unknown Paystack error",
            status_code: response.status,
          },
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Update database record
    const dbUpdateData: any = {
      paystack_response: data.data,
      updated_at: new Date().toISOString(),
    };

    if (business_name) dbUpdateData.business_name = business_name;
    if (primary_contact_email) dbUpdateData.email = primary_contact_email;
    if (settlement_bank) {
      dbUpdateData.bank_name = settlement_bank;
      dbUpdateData.bank_code = settlement_bank;
    }
    if (account_number) dbUpdateData.account_number = account_number;

    await supabase
      .from("banking_subaccounts")
      .update(dbUpdateData)
      .eq("subaccount_code", subaccountId);

    return new Response(
      JSON.stringify({
        success: true,
        data: data.data,
        message: "Subaccount updated successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "UPDATE_ERROR",
        details: { error_message: error.message },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}
