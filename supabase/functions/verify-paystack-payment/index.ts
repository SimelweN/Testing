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
    const { reference } = await req.json();

    if (!reference) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Payment reference is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verify payment with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      },
    );

    const paystackResult = await paystackResponse.json();

    if (!paystackResult.status) {
      throw new Error(
        `Paystack verification failed: ${paystackResult.message}`,
      );
    }

    const transaction = paystackResult.data;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Update transaction status
    const { error: updateError } = await supabase
      .from("payment_transactions")
      .update({
        status: transaction.status,
        paystack_response: transaction,
        verified_at: new Date().toISOString(),
      })
      .eq("reference", reference);

    if (updateError) {
      console.error("Failed to update transaction:", updateError);
    }

    // If payment is successful, create orders
    if (transaction.status === "success") {
      const metadata = transaction.metadata;

      // Call create-order function to process the successful payment
      const orderResponse = await fetch(
        `${req.headers.get("origin")}/functions/v1/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: req.headers.get("Authorization") || "",
          },
          body: JSON.stringify({
            user_id: metadata.user_id,
            items: metadata.items,
            total_amount: transaction.amount / 100, // Convert from kobo
            shipping_address: metadata.shipping_address,
            payment_reference: reference,
            payment_data: transaction,
          }),
        },
      );

      const orderResult = await orderResponse.json();

      if (!orderResult.success) {
        console.error("Order creation failed:", orderResult.error);
        // Don't fail the verification, just log the error
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            transaction,
            orders: orderResult.orders || [],
            verified: true,
            status: "success",
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Payment not successful
    return new Response(
      JSON.stringify({
        success: false,
        data: {
          transaction,
          verified: true,
          status: transaction.status,
        },
        error: "Payment was not successful",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to verify payment",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
