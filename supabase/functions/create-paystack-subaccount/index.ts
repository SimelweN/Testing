import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Helper function to get user from request
async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return null;
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Paystack Subaccount Creation Request ===");

    // Step 1: Authenticate the user
    const user = await getUserFromRequest(req);
    if (!user) {
      console.error("Authentication failed - no user found");
      return new Response(
        JSON.stringify({
          success: false,
          error: "AUTHENTICATION_FAILED",
          details: {
            auth_header: req.headers.get("Authorization")
              ? "present"
              : "missing",
            message: "User authentication failed - please login first",
            auth_method: "Bearer token required",
          },
          fix_instructions:
            "Ensure user is logged in and provide valid Bearer token in Authorization header. Check if session has expired.",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("Authenticated user:", user.id, user.email);

    // Step 2: Initialize Supabase client for database operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Check environment variables
    const missingEnvVars = [];
    if (!Deno.env.get("SUPABASE_URL")) missingEnvVars.push("SUPABASE_URL");
    if (!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"))
      missingEnvVars.push("SUPABASE_SERVICE_ROLE_KEY");

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
            "Configure missing environment variables in your deployment settings",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Step 3: Check if user already has a subaccount
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("subaccount_code, preferences")
      .eq("id", user.id)
      .single();

    console.log("Existing profile data:", existingProfile);

    // Step 4: Parse request body
    const requestBody = await req.json();
    console.log("Request body received:", requestBody);

    const {
      business_name,
      email,
      bank_name,
      bank_code,
      account_number,
      is_update = false,
    } = requestBody;

    // Enhanced validation with specific error messages
    const validationErrors = [];
    if (!business_name) validationErrors.push("business_name is required");
    if (!email) validationErrors.push("email is required");
    if (!bank_name) validationErrors.push("bank_name is required");
    if (!bank_code) validationErrors.push("bank_code is required");
    if (!account_number) validationErrors.push("account_number is required");

    // Email format validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.push("email format is invalid");
    }

    // Bank code validation (should be 3 digits for South African banks)
    if (bank_code && !/^\d{3}$/.test(bank_code)) {
      validationErrors.push(
        "bank_code must be 3 digits (e.g., '058' for Standard Bank)",
      );
    }

    // Account number validation (basic length check)
    if (
      account_number &&
      (account_number.length < 8 || account_number.length > 12)
    ) {
      validationErrors.push("account_number must be between 8-12 digits");
    }

    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "VALIDATION_FAILED",
          details: {
            validation_errors: validationErrors,
            provided_fields: Object.keys(requestBody),
            message: `Validation failed: ${validationErrors.join(", ")}`,
            field_requirements: {
              business_name: "String, company/individual name",
              email: "Valid email address",
              bank_name: "String, bank name (e.g., 'Standard Bank')",
              bank_code: "3-digit bank code (e.g., '058')",
              account_number: "8-12 digit bank account number",
              is_update: "Boolean, optional (default: false)",
            },
          },
          fix_instructions:
            "Provide all required fields with correct formats. Check bank code with your bank - common codes: Standard Bank (058), FNB (250), ABSA (632), Nedbank (198).",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check if this is an update and user has existing subaccount
    const hasExistingSubaccount = existingProfile?.subaccount_code;
    const shouldUpdate = is_update || hasExistingSubaccount;

    // Step 5: Get Paystack secret key
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      console.warn(
        "PAYSTACK_SECRET_KEY not configured, creating mock subaccount",
      );

      // Create mock subaccount for testing
      const mockSubaccountCode = `ACCT_mock_${Date.now()}`;

      // Update user profile with mock subaccount
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        name: user.user_metadata?.name || business_name,
        email: user.email,
        subaccount_code: mockSubaccountCode,
        preferences: {
          ...(existingProfile?.preferences || {}),
          subaccount_code: mockSubaccountCode,
          banking_setup_complete: true,
          business_name: business_name,
          bank_details: {
            bank_name,
            account_number: account_number.slice(-4),
            bank_code,
          },
        },
      });

      if (profileError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "DATABASE_UPDATE_FAILED",
            details: {
              error_code: profileError.code,
              error_message: profileError.message,
              operation: "profile update with mock subaccount",
            },
            fix_instructions:
              "Check database permissions and profile table structure",
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
          message:
            "Mock banking details created successfully (Paystack not configured)!",
          subaccount_code: mockSubaccountCode,
          user_id: user.id,
          is_update: shouldUpdate,
          mock: true,
          data: {
            subaccount_code: mockSubaccountCode,
            business_name,
            bank_name,
            account_number_masked: `****${account_number.slice(-4)}`,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let subaccount_code = existingProfile?.subaccount_code;
    let paystackData;

    if (shouldUpdate && subaccount_code) {
      // Update existing subaccount
      console.log("Updating existing Paystack subaccount:", subaccount_code);

      const updatePayload = {
        business_name: business_name,
        settlement_bank: bank_code,
        account_number: account_number,
        percentage_charge: 10, // 10% platform fee
        description: `ReBooked seller subaccount for ${business_name}`,
        primary_contact_email: email,
        primary_contact_name: business_name,
        metadata: {
          updated_via: "rebooked_banking_portal",
          bank_name: bank_name,
          user_id: user.id,
          last_updated: new Date().toISOString(),
        },
      };

      try {
        const paystackResponse = await fetch(
          `https://api.paystack.co/subaccount/${subaccount_code}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${paystackSecretKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatePayload),
          },
        );

        paystackData = await paystackResponse.json();
        console.log("Paystack update response:", paystackData);

        if (!paystackResponse.ok || !paystackData.status) {
          console.error("Paystack update error:", paystackData);

          // Specific Paystack error handling
          if (paystackData.message?.includes("Invalid account number")) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "INVALID_BANK_ACCOUNT",
                details: {
                  paystack_error: paystackData.message,
                  account_number: account_number,
                  bank_code: bank_code,
                  bank_name: bank_name,
                  message:
                    "Bank account number is invalid for the specified bank",
                },
                fix_instructions:
                  "Verify the account number is correct for the selected bank. Contact your bank to confirm account details if needed.",
              }),
              {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              },
            );
          }

          if (paystackData.message?.includes("Invalid bank code")) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "INVALID_BANK_CODE",
                details: {
                  paystack_error: paystackData.message,
                  provided_bank_code: bank_code,
                  common_bank_codes: {
                    "Standard Bank": "058",
                    FNB: "250",
                    ABSA: "632",
                    Nedbank: "198",
                    Capitec: "470",
                  },
                  message: "Bank code is invalid or not supported",
                },
                fix_instructions:
                  "Use correct 3-digit bank code. Check with your bank or use common codes: Standard Bank (058), FNB (250), ABSA (632), Nedbank (198), Capitec (470).",
              }),
              {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              },
            );
          }

          return new Response(
            JSON.stringify({
              success: false,
              error: "PAYSTACK_SUBACCOUNT_UPDATE_FAILED",
              details: {
                paystack_error:
                  paystackData.message || "Unknown Paystack error",
                error_code: paystackData.code,
                full_response: paystackData,
                operation: "update existing subaccount",
              },
              fix_instructions:
                "Check the Paystack error details above. Verify bank details are correct and account is active.",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
      } catch (paystackError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "PAYSTACK_API_CONNECTION_FAILED",
            details: {
              error_message: paystackError.message,
              api_endpoint: `https://api.paystack.co/subaccount/${subaccount_code}`,
              operation: "update subaccount",
              network_error: true,
            },
            fix_instructions:
              "Check internet connection and Paystack API status. Verify Paystack secret key is correct.",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    } else {
      // Create new subaccount
      console.log("Creating new Paystack subaccount for:", {
        business_name,
        email,
        bank_name,
      });

      const paystackPayload = {
        business_name: business_name,
        settlement_bank: bank_code,
        account_number: account_number,
        percentage_charge: 10, // 10% platform fee
        description: `ReBooked seller subaccount for ${business_name}`,
        primary_contact_email: email,
        primary_contact_name: business_name,
        metadata: {
          created_via: "rebooked_banking_portal",
          bank_name: bank_name,
          user_id: user.id,
        },
      };

      console.log("Paystack payload:", paystackPayload);

      try {
        const paystackResponse = await fetch(
          "https://api.paystack.co/subaccount",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${paystackSecretKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(paystackPayload),
          },
        );

        paystackData = await paystackResponse.json();
        console.log("Paystack response status:", paystackResponse.status);
        console.log("Paystack response data:", paystackData);

        if (!paystackResponse.ok || !paystackData.status) {
          console.error("Paystack API error:", paystackData);

          // Enhanced Paystack error handling
          if (paystackData.message?.includes("Invalid account number")) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "INVALID_BANK_ACCOUNT",
                details: {
                  paystack_error: paystackData.message,
                  account_number: account_number,
                  bank_code: bank_code,
                  bank_name: bank_name,
                  message:
                    "Bank account number is invalid for the specified bank",
                },
                fix_instructions:
                  "Verify the account number is correct for the selected bank. Contact your bank to confirm account details if needed.",
              }),
              {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              },
            );
          }

          if (paystackData.message?.includes("Invalid bank code")) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "INVALID_BANK_CODE",
                details: {
                  paystack_error: paystackData.message,
                  provided_bank_code: bank_code,
                  common_bank_codes: {
                    "Standard Bank": "058",
                    FNB: "250",
                    ABSA: "632",
                    Nedbank: "198",
                    Capitec: "470",
                  },
                  message: "Bank code is invalid or not supported",
                },
                fix_instructions:
                  "Use correct 3-digit bank code. Check with your bank or use common codes: Standard Bank (058), FNB (250), ABSA (632), Nedbank (198), Capitec (470).",
              }),
              {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              },
            );
          }

          if (paystackData.message?.includes("already exists")) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "DUPLICATE_SUBACCOUNT",
                details: {
                  paystack_error: paystackData.message,
                  business_name: business_name,
                  email: email,
                  message: "A subaccount with these details already exists",
                },
                fix_instructions:
                  "This bank account is already linked to another Paystack subaccount. Use a different account or contact support if this is an error.",
              }),
              {
                status: 409,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              },
            );
          }

          return new Response(
            JSON.stringify({
              success: false,
              error: "PAYSTACK_SUBACCOUNT_CREATION_FAILED",
              details: {
                paystack_error:
                  paystackData.message || "Unknown Paystack error",
                error_code: paystackData.code,
                full_response: paystackData,
                operation: "create new subaccount",
              },
              fix_instructions:
                "Check the Paystack error details above. Verify bank details are correct and account is active.",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        subaccount_code = paystackData.data?.subaccount_code;
        console.log("Generated subaccount_code:", subaccount_code);
      } catch (paystackError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "PAYSTACK_API_CONNECTION_FAILED",
            details: {
              error_message: paystackError.message,
              api_endpoint: "https://api.paystack.co/subaccount",
              operation: "create subaccount",
              network_error: true,
            },
            fix_instructions:
              "Check internet connection and Paystack API status. Verify Paystack secret key is correct.",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Step 6: Store in banking_subaccounts table for record keeping
    if (shouldUpdate) {
      // Update existing record
      const { error: subaccountError } = await supabase
        .from("banking_subaccounts")
        .update({
          business_name,
          email,
          bank_name,
          bank_code,
          account_number,
          paystack_response: paystackData,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("subaccount_code", subaccount_code);

      if (subaccountError) {
        console.error(
          "Database error updating banking_subaccounts:",
          subaccountError,
        );
      }
    } else {
      // Insert new record
      const { data: subaccountData, error: subaccountError } = await supabase
        .from("banking_subaccounts")
        .insert({
          user_id: user.id,
          business_name,
          email,
          bank_name,
          bank_code,
          account_number,
          subaccount_code: subaccount_code,
          paystack_response: paystackData,
          status: "active",
        })
        .select()
        .single();

      if (subaccountError) {
        console.error("Database error (banking_subaccounts):", subaccountError);
      }
    }

    // Step 7: Update user profile with subaccount_code
    const updatedPreferences = {
      ...(existingProfile?.preferences || {}),
      subaccount_code: subaccount_code,
      banking_setup_complete: true,
      business_name: business_name,
      bank_details: {
        bank_name,
        account_number: account_number.slice(-4), // Store only last 4 digits for security
        bank_code,
      },
    };

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      name: user.user_metadata?.name || business_name,
      email: user.email,
      subaccount_code: subaccount_code,
      preferences: updatedPreferences,
    });

    if (profileError) {
      console.error("Profile update error:", profileError);
      // Don't fail the request if profile update fails, subaccount is still created
    }

    // Step 8: Update all user's books with the subaccount_code
    const { error: booksUpdateError } = await supabase
      .from("books")
      .update({ subaccount_code: subaccount_code })
      .eq("seller_id", user.id);

    if (booksUpdateError) {
      console.error(
        "Error updating books with subaccount_code:",
        booksUpdateError,
      );
    }

    console.log(
      `Successfully ${shouldUpdate ? "updated" : "created"} subaccount and updated profile`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: `Banking details and subaccount ${shouldUpdate ? "updated" : "created"} successfully!`,
        subaccount_code: subaccount_code,
        user_id: user.id,
        is_update: shouldUpdate,
        data: {
          subaccount_code,
          business_name,
          bank_name,
          account_number_masked: `****${account_number.slice(-4)}`,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Unexpected error in create-paystack-subaccount:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "UNEXPECTED_ERROR",
        details: {
          error_message: error.message,
          error_stack: error.stack,
          error_type: error.constructor.name,
          timestamp: new Date().toISOString(),
        },
        fix_instructions:
          "This is an unexpected server error. Check the server logs for more details and contact support if the issue persists.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
