import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { parseRequestBody } from "../_shared/safe-body-parser.ts";
import { jsonResponse, errorResponse, handleCorsPreflightRequest } from "../_shared/response-utils.ts";
import { validateUUIDs, createUUIDErrorResponse } from "../_shared/uuid-validator.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest();
  }

  try {
    // Use safe body parser
    const bodyParseResult = await parseRequestBody(req, corsHeaders);
    if (!bodyParseResult.success) {
      return bodyParseResult.errorResponse!;
    }

    const {
      order_id,
      seller_id,
      amount,
      trigger = "manual",
    } = bodyParseResult.data;

    // Enhanced validation with specific error messages
    const validationErrors = [];
    if (!order_id) validationErrors.push("order_id is required");
    if (!seller_id) validationErrors.push("seller_id is required");
    if (!amount) validationErrors.push("amount is required");
    if (amount && (typeof amount !== "number" || amount <= 0)) {
      validationErrors.push("amount must be a positive number");
    }

    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "VALIDATION_FAILED",
          details: {
            missing_or_invalid_fields: validationErrors,
                        provided_fields: Object.keys({ order_id, seller_id, amount, trigger }),
            message: `Validation failed: ${validationErrors.join(", ")}`,
          },
          fix_instructions:
            "Provide all required fields: order_id (string), seller_id (string), amount (positive number). Optional: trigger (string)",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check environment variables
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
            "Configure missing environment variables in your deployment settings",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check Paystack configuration
    if (!PAYSTACK_SECRET_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYMENT_SERVICE_NOT_CONFIGURED",
          details: {
            missing_config: "PAYSTACK_SECRET_KEY",
            message: "Payment service (Paystack) is not configured",
          },
          fix_instructions:
            "Configure PAYSTACK_SECRET_KEY environment variable with your Paystack secret key",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get order and seller details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .eq("seller_id", seller_id)
      .single();

    if (orderError) {
      if (orderError.code === "PGRST116") {
        return new Response(
          JSON.stringify({
            success: false,
            error: "ORDER_NOT_FOUND",
            details: {
              order_id,
              seller_id,
              database_error: orderError.message,
              possible_causes: [
                "Order ID does not exist",
                "Order does not belong to this seller",
                "Order may have been deleted",
              ],
            },
            fix_instructions:
              "Verify the order_id exists and belongs to the specified seller_id",
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: "DATABASE_QUERY_FAILED",
          details: {
            error_code: orderError.code,
            error_message: orderError.message,
            query_details:
              "SELECT from orders table with order_id and seller_id filters",
          },
          fix_instructions:
            "Check database connection and table structure. Ensure 'orders' table exists with proper columns.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!order) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ORDER_ACCESS_DENIED",
          details: {
            order_id,
            seller_id,
            message: "Order not found or access denied",
          },
          fix_instructions:
            "Ensure the order exists and belongs to the specified seller",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check if order is in a state that allows payout
    const validStatuses = ["delivered", "completed", "collected"];
    if (!validStatuses.includes(order.status)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_ORDER_STATUS_FOR_PAYOUT",
          details: {
            order_id,
            current_status: order.status,
            required_statuses: validStatuses,
            message: "Order must be delivered or completed before payout",
          },
          fix_instructions: `Order status must be one of: ${validStatuses.join(", ")}. Current status is '${order.status}'. Ensure the order has been delivered/completed first.`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get seller profile
    const { data: seller, error: sellerError } = await supabase
      .from("profiles")
      .select("id, name, email, subaccount_code")
      .eq("id", seller_id)
      .single();

    if (sellerError || !seller) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "SELLER_NOT_FOUND",
          details: {
            seller_id,
            database_error: sellerError?.message,
            message: "Seller profile not found",
          },
          fix_instructions: "Verify the seller_id exists in the profiles table",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check if seller has subaccount
    if (!seller.subaccount_code) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "SELLER_BANKING_NOT_CONFIGURED",
          details: {
            seller_id,
            seller_name: seller.name,
            missing_requirement: "subaccount_code",
            message: "Seller subaccount not found. Banking details required.",
          },
          fix_instructions:
            "Seller must complete banking setup first. Have them configure their bank details through the create-paystack-subaccount function.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
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
          details: {
            payout: existingPayout,
            already_processed: true,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Calculate platform fee (5%)
    const platformFeeRate = 0.05;
    const platformFee = amount * platformFeeRate;
    const sellerAmount = amount - platformFee;

    // Create transfer to seller's subaccount
    const transferReference = `payout_${order_id}_${Date.now()}`;
    const transferData = {
      source: "balance",
      amount: Math.round(sellerAmount * 100), // Convert to kobo
      recipient: seller.subaccount_code,
      reason: `Payout for order ${order_id}`,
      reference: transferReference,
      currency: "ZAR",
    };

    let paystackResult;
    try {
      const paystackResponse = await fetch("https://api.paystack.co/transfer", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transferData),
      });

      paystackResult = await paystackResponse.json();

      if (!paystackResult.status) {
        const errorDetails = {
          paystack_error: paystackResult.message,
          error_code: paystackResult.code,
          transfer_data: transferData,
        };

        // Common Paystack error scenarios
        if (paystackResult.message?.includes("Insufficient balance")) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "INSUFFICIENT_PLATFORM_BALANCE",
              details: {
                ...errorDetails,
                message: "Platform account has insufficient balance for payout",
              },
              fix_instructions:
                "Platform account needs to be funded before processing payouts. Contact platform administrator.",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        if (paystackResult.message?.includes("Invalid recipient")) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "INVALID_SELLER_SUBACCOUNT",
              details: {
                ...errorDetails,
                seller_subaccount: seller.subaccount_code,
                message:
                  "Seller's subaccount is invalid or not found on Paystack",
              },
              fix_instructions:
                "Seller needs to reconfigure their banking details. Their subaccount may have been deactivated or deleted.",
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
            error: "PAYSTACK_TRANSFER_FAILED",
            details: errorDetails,
            fix_instructions:
              "Check Paystack transfer details and account configuration. Verify subaccount is active and platform has sufficient balance.",
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
            api_endpoint: "https://api.paystack.co/transfer",
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

    // Record payout in database
    const payoutData = {
      order_id,
      seller_id,
      amount: sellerAmount,
      platform_fee: platformFee,
      total_amount: amount,
      transfer_reference: transferReference,
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
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYOUT_RECORDING_FAILED",
          details: {
            error_code: payoutError.code,
            error_message: payoutError.message,
            payout_data: payoutData,
            message:
              "Paystack transfer succeeded but failed to record payout in database",
          },
          fix_instructions:
            "Payout was processed by Paystack but not recorded locally. Check seller_payouts table structure and permissions. May need manual reconciliation.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Update order status to indicate payout initiated
    const { error: orderUpdateError } = await supabase
      .from("orders")
      .update({
        payout_status: "initiated",
        payout_initiated_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    if (orderUpdateError) {
      console.warn("Failed to update order payout status:", orderUpdateError);
      // Don't fail the payout for this
    }

    // Send notification email to seller
    try {
      const sellerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Processing - ReBooked Solutions</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f3fef7; padding: 20px; color: #1f4e3d; margin: 0; }
    .container { max-width: 500px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
    .header { background: #3ab26f; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -30px -30px 20px -30px; }
    .footer { background: #f3fef7; color: #1f4e3d; padding: 20px; text-align: center; font-size: 12px; line-height: 1.5; margin: 30px -30px -30px -30px; border-radius: 0 0 10px 10px; border-top: 1px solid #e5e7eb; }
    .amount-box { background: #f0f9ff; border: 1px solid #3ab26f; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center; }
    .link { color: #3ab26f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Your Payment is on the Way!</h1>
    </div>

    <h2>Hello ${seller.name}!</h2>
    <p>Great news! Your payment for order #${order_id} has been processed and is on its way to your bank account.</p>

    <div class="amount-box">
      <h3>💳 Payment Details</h3>
      <p><strong>Your Amount:</strong> R${sellerAmount.toFixed(2)}</p>
      <p><strong>Platform Fee:</strong> R${platformFee.toFixed(2)}</p>
      <p><strong>Order Total:</strong> R${amount.toFixed(2)}</p>
      <p><strong>Transfer Reference:</strong> ${transferReference}</p>
    </div>

    <p>The payment should reflect in your bank account within 1-3 business days.</p>
    <p>Thank you for being part of the ReBooked Solutions community!</p>

    <div class="footer">
      <p><strong>This is an automated message from ReBooked Solutions.</strong><br>
      Please do not reply to this email.</p>
      <p>For help, contact support@rebookedsolutions.co.za<br>
      Visit our website: www.rebookedsolutions.co.za<br>
      T&Cs apply</p>
      <p><em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
  </div>
</body>
</html>`;

      await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({
          to: seller.email,
          subject: "💰 Your payment is on the way!",
          html: sellerHtml,
          text: `Your Payment is on the Way!\n\nHello ${seller.name}!\n\nGreat news! Your payment for order #${order_id} has been processed and is on its way to your bank account.\n\nPayment Details:\nYour Amount: R${sellerAmount.toFixed(2)}\nPlatform Fee: R${platformFee.toFixed(2)}\nOrder Total: R${amount.toFixed(2)}\nTransfer Reference: ${transferReference}\n\nThe payment should reflect in your bank account within 1-3 business days.\n\nThank you for being part of the ReBooked Solutions community!`,
        }),
      });
    } catch (emailError) {
      console.error("Failed to send payout notification:", emailError);
      // Don't fail the payout for email errors
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payout initiated successfully",
        details: {
          payout,
          transfer: paystackResult.data,
          amounts: {
            total_amount: amount,
            seller_amount: sellerAmount,
            platform_fee: platformFee,
            platform_fee_percentage: (platformFeeRate * 100).toFixed(1) + "%",
          },
          timeline: {
            processed_at: new Date().toISOString(),
            expected_in_bank: "1-3 business days",
          },
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Seller payout error:", error);
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
