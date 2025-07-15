import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      user_id,
      items,
      total_amount,
      shipping_address,
      email,
      metadata = {},
    } = await req.json();

    if (!user_id || !items || !total_amount || !email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Get seller information for split payments
    const sellerIds = [...new Set(items.map((item: any) => item.seller_id))];
    const { data: sellers, error: sellersError } = await supabase
      .from("profiles")
      .select("id, subaccount_code, name")
      .in("id", sellerIds);

    if (sellersError) {
      throw new Error(`Failed to fetch sellers: ${sellersError.message}`);
    }

    // Calculate split payments for sellers (90% of book prices)
    const splitPayments = sellers
      ?.map((seller) => {
        const sellerItems = items.filter(
          (item: any) => item.seller_id === seller.id,
        );
        const sellerBookTotal = sellerItems.reduce(
          (sum: number, item: any) => sum + item.price,
          0,
        );

        // Seller gets 90% of their book prices (not including delivery)
        const sellerAmount = sellerBookTotal * 0.9;

        return {
          subaccount: seller.subaccount_code,
          share: Math.round(sellerAmount * 100), // Convert to kobo, seller gets 90%
        };
      })
      .filter((split) => split.subaccount);

    // Initialize Paystack payment
    const paystackData = {
      email,
      amount: total_amount * 100, // Convert to kobo
      currency: "ZAR",
      callback_url: `${req.headers.get("origin")}/payment/callback`,
      metadata: {
        user_id,
        items,
        shipping_address,
        ...metadata,
      },
      split_code: undefined, // We'll use subaccounts instead
      subaccount: splitPayments[0]?.subaccount, // Primary seller for single seller
    };

    // If multiple sellers, we need to create a split payment
    if (splitPayments.length > 1) {
      paystackData.split = {
        type: "percentage",
        currency: "ZAR",
        subaccounts: splitPayments,
        bearer_type: "account",
        bearer_subaccount: splitPayments[0].subaccount,
      };
    }

    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paystackData),
      },
    );

    const paystackResult = await paystackResponse.json();

    if (!paystackResult.status) {
      throw new Error(`Paystack error: ${paystackResult.message}`);
    }

    // Store transaction reference in database
    const { error: insertError } = await supabase
      .from("payment_transactions")
      .insert({
        reference: paystackResult.data.reference,
        user_id,
        amount: total_amount,
        status: "pending",
        items,
        shipping_address,
        paystack_data: paystackResult.data,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Failed to store transaction:", insertError);
      // Continue anyway as Paystack payment is initialized
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          authorization_url: paystackResult.data.authorization_url,
          reference: paystackResult.data.reference,
          access_code: paystackResult.data.access_code,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Initialize payment error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to initialize payment",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
