import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface CreateSubaccountRequest {
  business_name: string;
  email: string;
  bank_name: string;
  bank_code: string;
  account_number: string;
  primary_contact_email?: string;
  primary_contact_name?: string;
  metadata?: {
    user_id: string;
    is_update?: boolean;
    existing_subaccount?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get user from authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing authorization header",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verify the session
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid authentication token",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const requestData: CreateSubaccountRequest = await req.json();

    const {
      business_name,
      email,
      bank_name,
      bank_code,
      account_number,
      primary_contact_email = email,
      primary_contact_name = business_name,
      metadata = {},
    } = requestData;

    // Validate required fields
    if (
      !business_name ||
      !email ||
      !bank_name ||
      !bank_code ||
      !account_number
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Missing required fields: business_name, email, bank_name, bank_code, account_number",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let subaccountCode: string;
    let paystackResponse: any = null;

    // Check if Paystack is configured
    if (PAYSTACK_SECRET_KEY && PAYSTACK_SECRET_KEY !== "your_secret_key_here") {
      // PRODUCTION: Create real Paystack subaccount
      console.log("Creating Paystack subaccount for:", business_name);

      const paystackData = {
        business_name,
        bank_code,
        account_number: account_number.replace(/\s/g, ""),
        primary_contact_email,
        primary_contact_name,
        metadata: {
          user_id: user.id,
          platform: "readswap",
          ...metadata,
        },
      };

      const paystackResult = await fetch("https://api.paystack.co/subaccount", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paystackData),
      });

      const paystackJson = await paystackResult.json();

      if (!paystackResult.ok || !paystackJson.status) {
        console.error("Paystack subaccount creation failed:", paystackJson);
        throw new Error(
          paystackJson.message || "Failed to create Paystack subaccount",
        );
      }

      subaccountCode = paystackJson.data.subaccount_code;
      paystackResponse = paystackJson.data;

      console.log("✅ Paystack subaccount created:", subaccountCode);
    } else {
      // DEVELOPMENT: Create mock subaccount
      console.warn("🛠️ Development mode: Creating mock subaccount");
      subaccountCode = `ACCT_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      paystackResponse = {
        mock: true,
        created_at: new Date().toISOString(),
        subaccount_code: subaccountCode,
        business_name,
        bank_name,
        account_number: account_number
          .slice(-4)
          .padStart(account_number.length, "*"),
      };
    }

    // Store subaccount details in database
    const { data: subaccountData, error: dbError } = await supabase
      .from("banking_subaccounts")
      .upsert(
        {
          user_id: user.id,
          subaccount_code: subaccountCode,
          business_name,
          bank_name,
          bank_code,
          account_number,
          email,
          status: "active",
          paystack_response: paystackResponse,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      )
      .select()
      .single();

    if (dbError) {
      console.error("Database error storing subaccount:", dbError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to store subaccount details in database",
          details: dbError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Update user profile with subaccount code
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        paystack_subaccount_code: subaccountCode,
        banking_verified: true,
        banking_setup_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      console.warn("Failed to update profile with subaccount:", profileError);
    }

    // Link all user's books to the subaccount
    const { error: booksError } = await supabase
      .from("books")
      .update({ paystack_subaccount_code: subaccountCode })
      .eq("seller_id", user.id)
      .is("paystack_subaccount_code", null);

    if (booksError) {
      console.warn("Failed to link books to subaccount:", booksError);
    }

    console.log(
      `✅ Subaccount ${subaccountCode} created and linked for user ${user.id}`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        subaccount_code: subaccountCode,
        data: {
          subaccount_code: subaccountCode,
          business_name,
          bank_name,
          account_number: account_number
            .slice(-4)
            .padStart(account_number.length, "*"),
          status: "active",
        },
        message: "Subaccount created successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Create subaccount error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to create subaccount",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
