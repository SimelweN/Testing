import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Verify webhook signature
function verifyPaystackSignature(payload: string, signature: string): boolean {
  const crypto = globalThis.crypto;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(PAYSTACK_SECRET_KEY!);
  const data = encoder.encode(payload);

  return crypto.subtle
    .importKey("raw", keyData, { name: "HMAC", hash: "SHA-512" }, false, [
      "sign",
    ])
    .then((key) => {
      return crypto.subtle.sign("HMAC", key, data);
    })
    .then((hashBuffer) => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return hashHex === signature;
    })
    .catch(() => false);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!signature) {
      return new Response("Missing signature", { status: 400 });
    }

    // Verify webhook signature
    const isValid = await verifyPaystackSignature(payload, signature);
    if (!isValid) {
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(payload);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    console.log("Paystack webhook event:", event.event);

    switch (event.event) {
      case "charge.success":
        await handleChargeSuccess(supabase, event.data);
        break;

      case "charge.failed":
        await handleChargeFailed(supabase, event.data);
        break;

      case "transfer.success":
        await handleTransferSuccess(supabase, event.data);
        break;

      case "transfer.failed":
        await handleTransferFailed(supabase, event.data);
        break;

      case "subscription.create":
      case "subscription.disable":
        // Handle subscription events if needed
        break;

      default:
        console.log("Unhandled webhook event:", event.event);
    }

    return new Response("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
});

async function handleChargeSuccess(supabase: any, data: any) {
  try {
    const { reference, amount, customer, metadata } = data;

    // Update transaction status
    await supabase
      .from("payment_transactions")
      .update({
        status: "success",
        paystack_response: data,
        verified_at: new Date().toISOString(),
      })
      .eq("reference", reference);

    // If this is a new payment that hasn't been processed yet
    if (metadata?.user_id && metadata?.items) {
      // Create orders for the successful payment
      const orderResponse = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_KEY")}`,
          },
          body: JSON.stringify({
            user_id: metadata.user_id,
            items: metadata.items,
            total_amount: amount / 100,
            shipping_address: metadata.shipping_address,
            payment_reference: reference,
            payment_data: data,
          }),
        },
      );

      console.log("Order creation response:", await orderResponse.text());
    }

    console.log("Charge success processed:", reference);
  } catch (error) {
    console.error("Error handling charge success:", error);
  }
}

async function handleChargeFailed(supabase: any, data: any) {
  try {
    const { reference } = data;

    await supabase
      .from("payment_transactions")
      .update({
        status: "failed",
        paystack_response: data,
        updated_at: new Date().toISOString(),
      })
      .eq("reference", reference);

    console.log("Charge failed processed:", reference);
  } catch (error) {
    console.error("Error handling charge failed:", error);
  }
}

async function handleTransferSuccess(supabase: any, data: any) {
  try {
    const { reference, recipient } = data;

    // Update payout status
    await supabase
      .from("seller_payouts")
      .update({
        status: "completed",
        transfer_response: data,
        completed_at: new Date().toISOString(),
      })
      .eq("transfer_reference", reference);

    console.log("Transfer success processed:", reference);
  } catch (error) {
    console.error("Error handling transfer success:", error);
  }
}

async function handleTransferFailed(supabase: any, data: any) {
  try {
    const { reference } = data;

    await supabase
      .from("seller_payouts")
      .update({
        status: "failed",
        transfer_response: data,
        updated_at: new Date().toISOString(),
      })
      .eq("transfer_reference", reference);

    console.log("Transfer failed processed:", reference);
  } catch (error) {
    console.error("Error handling transfer failed:", error);
  }
}
