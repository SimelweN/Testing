import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  createSupabaseClient,
  createErrorResponse,
  createSuccessResponse,
  handleCORSPreflight,
  validateRequiredFields,
  parseRequestBody,
  logFunction,
} from "../_shared/utils.ts";
import { validateSupabaseConfig, ENV } from "../_shared/config.ts";
import { isDevelopmentMode, createMockResponse } from "../_shared/dev-mode.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCORSPreflight(req);
  if (corsResponse) return corsResponse;

  try {
    logFunction("pay-seller", "Processing seller payment");

    validateSupabaseConfig();

    const requestData = await parseRequestBody(req);
    validateRequiredFields(requestData, ["order_id", "seller_id", "amount"]);

    const { order_id, seller_id, amount, trigger = "manual" } = requestData;

    // In development mode, return mock response
    if (isDevelopmentMode() || !ENV.PAYSTACK_SECRET_KEY) {
      logFunction(
        "pay-seller",
        "Using mock response (development mode or no Paystack key)",
      );
      const mockResponse = {
        success: true,
        payment_sent: true,
        transfer_reference: "TXN" + Date.now(),
        amount: amount,
        seller_id: seller_id,
        status: "success",
      };
      return createSuccessResponse(mockResponse);
    }

    const supabase = createSupabaseClient();

    // Get order and seller details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        *,
                        seller:profiles!orders_seller_id_fkey(id, name, email, subaccount_code)
      `,
      )
      .eq("id", order_id)
      .eq("seller_id", seller_id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found or access denied");
    }

    // Check if order is in a state that allows payout
    if (!["delivered", "completed"].includes(order.status)) {
      throw new Error("Order must be delivered or completed before payout");
    }

    // Check if payout already exists
    const { data: existingPayout } = await supabase
      .from("seller_payouts")
      .select("*")
      .eq("order_id", order_id)
      .eq("seller_id", seller_id)
      .single();

    if (existingPayout && existingPayout.status === "completed") {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Payout already completed",
          payout: existingPayout,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const seller = order.seller;
    if (!seller?.subaccount_code) {
      throw new Error("Seller subaccount not found. Banking details required.");
    }

    // Calculate platform fee (e.g., 5%)
    const platformFeeRate = 0.05;
    const platformFee = amount * platformFeeRate;
    const sellerAmount = amount - platformFee;

    // Create transfer to seller's subaccount
    const transferData = {
      source: "balance",
      amount: Math.round(sellerAmount * 100), // Convert to kobo
      recipient: seller.subaccount_code,
      reason: `Payout for order ${order_id}`,
      reference: `payout_${order_id}_${Date.now()}`,
      currency: "ZAR",
    };

    const paystackResponse = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transferData),
    });

    const paystackResult = await paystackResponse.json();

    if (!paystackResult.status) {
      throw new Error(`Paystack transfer failed: ${paystackResult.message}`);
    }

    // Record payout in database
    const payoutData = {
      order_id,
      seller_id,
      amount: sellerAmount,
      platform_fee: platformFee,
      total_amount: amount,
      transfer_reference: transferData.reference,
      paystack_response: paystackResult.data,
      status: "pending",
      triggered_by: trigger,
      created_at: new Date().toISOString(),
    };

    const { data: payout, error: payoutError } = await supabase
      .from("seller_payouts")
      .upsert(payoutData)
      .select()
      .single();

    if (payoutError) {
      throw new Error(`Failed to record payout: ${payoutError.message}`);
    }

    // Update order status to indicate payout initiated
    await supabase
      .from("orders")
      .update({
        payout_status: "initiated",
        payout_initiated_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    // Send notification email to seller
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({
          to: seller.email,
          subject: "💰 Your payment is on the way!",
          template: {
            name: "seller-payout-notification",
            data: {
              sellerName: seller.name,
              orderId: order_id,
              amount: sellerAmount,
              platformFee: platformFee,
              totalAmount: amount,
              transferReference: transferData.reference,
            },
          },
        }),
      });
    } catch (emailError) {
      console.error("Failed to send payout notification:", emailError);
      // Don't fail the payout for email errors
    }

    return new Response(
      JSON.stringify({
        success: true,
        payout,
        transfer: paystackResult.data,
        message: "Payout initiated successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Seller payout error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to process seller payout",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
