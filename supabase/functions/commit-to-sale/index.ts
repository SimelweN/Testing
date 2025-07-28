import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { enhancedParseRequestBody } from "../_shared/enhanced-body-parser.ts";
import { testFunction } from "../_mock-data/edge-function-tester.ts";
import { validateUUIDs, createUUIDErrorResponse } from "../_shared/uuid-validator.ts";
import { jsonResponse, errorResponse, handleCorsPreflightRequest, safeErrorResponse } from "../_shared/response-utils.ts";
import { logError } from "../_shared/error-utils.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest();
  }

  // 🧪 TEST MODE: Check if this is a test request with mock data
  const testResult = await testFunction("commit-to-sale", req);
  if (testResult.isTest) {
    return testResult.response!;
  }

    try {
    // Use enhanced body parser with detailed debugging
    const bodyParseResult = await enhancedParseRequestBody(req, corsHeaders);
    if (!bodyParseResult.success) {
      return bodyParseResult.errorResponse!;
    }
    const { order_id, seller_id } = bodyParseResult.data;

    // Validate UUIDs using shared validator
    const validation = validateUUIDs({ order_id, seller_id });
    if (!validation.isValid) {
      return createUUIDErrorResponse(validation.errors, corsHeaders);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    console.log("🔍 Looking for order:", { order_id, seller_id });

    // First, check if order exists at all
    const { data: orderCheck, error: checkError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .maybeSingle();

    console.log("📋 Order check result:", { orderCheck, checkError });

    if (!orderCheck) {
      console.log("❌ Order not found at all");
      return errorResponse(
        "ORDER_NOT_FOUND",
        {
          order_id,
          seller_id,
          message: "Order does not exist in database"
        },
        { status: 404 }
      );
    }

    if (orderCheck.seller_id !== seller_id) {
      console.log("❌ Wrong seller ID:", { expected: seller_id, actual: orderCheck.seller_id });
      return errorResponse(
        "SELLER_MISMATCH",
        {
          order_id,
          provided_seller_id: seller_id,
          actual_seller_id: orderCheck.seller_id,
          message: "Order does not belong to this seller"
        },
        { status: 403 }
      );
    }

    if (orderCheck.status !== "pending_commit") {
      console.log("❌ Wrong status:", { expected: "pending_commit", actual: orderCheck.status });
      return errorResponse(
        "INVALID_ORDER_STATUS",
        {
          order_id,
          seller_id,
          current_status: orderCheck.status,
          required_status: "pending_commit",
          message: "Order is not in pending_commit status"
        },
        { status: 400 }
      );
    }

    console.log("✅ Order validation passed, proceeding with commit");
    const order = orderCheck;

    // Ensure order.items is properly parsed if it's stored as JSONB
    if (order.items && typeof order.items === 'string') {
      try {
        order.items = JSON.parse(order.items);
      } catch (parseError) {
        console.warn("Failed to parse order.items:", parseError);
        order.items = [];
      }
    }

    // Ensure items is an array
    if (!Array.isArray(order.items)) {
      order.items = [];
    }

    // Get buyer and seller profiles separately for safety
    const { data: buyer } = await supabase
      .from("profiles")
      .select("id, name, email, phone_number")
      .eq("id", order.buyer_id)
      .maybeSingle();

        const { data: seller } = await supabase
      .from("profiles")
      .select("id, name, email, phone_number, pickup_address")
      .eq("id", order.seller_id)
      .maybeSingle();

    // Update order status to committed
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "committed",
        committed_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    if (updateError) {
      throw new Error(`Failed to update order status: ${updateError.message}`);
    }

            // Schedule automatic courier pickup by calling automate-delivery (if possible)
    let deliveryError = null;

    // Validate addresses before attempting delivery automation
    const hasSellerAddress = seller?.pickup_address &&
      typeof seller.pickup_address === 'object' &&
      (seller.pickup_address.streetAddress || seller.pickup_address.street);
    const hasBuyerAddress = order.shipping_address || order.delivery_address;

    if (!hasSellerAddress) {
      deliveryError = new Error("Seller pickup address not configured");
      console.warn("Skipping delivery automation: seller pickup address missing");
    } else if (!hasBuyerAddress) {
      deliveryError = new Error("Buyer delivery address not available");
      console.warn("Skipping delivery automation: buyer address missing");
    } else {
      try {
        const deliveryResponse = await fetch(`${SUPABASE_URL}/functions/v1/automate-delivery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
                body: JSON.stringify({
          order_id: order_id,
          seller_address: seller?.pickup_address || null,
          buyer_address: order.shipping_address || order.delivery_address,
          weight:
            (order.items || []).reduce(
              (total: number, item: any) => total + (item.weight || 0.5),
              0,
            ) || 1,
        }),
            });
        
        if (!deliveryResponse.ok) {
          const errorText = await deliveryResponse.text();
          deliveryError = new Error(`Delivery automation failed: ${deliveryResponse.status} ${errorText}`);
        } else {
          const deliveryResult = await deliveryResponse.json();
          console.log("✅ Delivery automation successful:", deliveryResult);
        }
      } catch (error) {
        deliveryError = error;
        console.error("Failed to schedule automatic delivery:", error);
        // Continue anyway - delivery can be scheduled manually
      }
    }

        // Send notification emails using DIRECT HTML
    let emailError = null;
    try {
      // Notify buyer
      if (buyer?.email) {
        const buyerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmed - Pickup Scheduled</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f3fef7;
      padding: 20px;
      color: #1f4e3d;
      margin: 0;
    }
    .container {
      max-width: 500px;
      margin: auto;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: #3ab26f;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 10px 10px 0 0;
      margin: -30px -30px 20px -30px;
    }
    .footer {
      background: #f3fef7;
      color: #1f4e3d;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      line-height: 1.5;
      margin: 30px -30px -30px -30px;
      border-radius: 0 0 10px 10px;
      border-top: 1px solid #e5e7eb;
    }
    .info-box {
      background: #f3fef7;
      border: 1px solid #3ab26f;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .link { color: #3ab26f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
    </div>

    <h2>Great news, ${buyer.name || "Customer"}!</h2>
    <p><strong>${seller?.name || "The seller"}</strong> has confirmed your order and is preparing your book(s) for delivery.</p>

    <div class="info-box">
      <h3>📚 Order Details</h3>
      <p><strong>Order ID:</strong> ${order_id}</p>
      <p><strong>Book(s):</strong> ${(order.items || []).map((item: any) => item.title || "Book").join(", ")}</p>
      <p><strong>Seller:</strong> ${seller?.name || "Seller"}</p>
      <p><strong>Estimated Delivery:</strong> 2-3 business days</p>
    </div>

    <p>Happy reading! 📖</p>

    <div class="footer">
      <p><strong>This is an automated message from ReBooked Solutions.</strong><br>
      Please do not reply to this email.</p>
      <p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>
      Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p>
      <p>T&Cs apply.</p>
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
            to: buyer.email,
            subject: "Order Confirmed - Pickup Scheduled",
            html: buyerHtml,
            text: `Order Confirmed!\n\nGreat news, ${buyer.name || "Customer"}!\n\n${seller?.name || "The seller"} has confirmed your order and is preparing your book(s) for delivery.\n\nOrder ID: ${order_id}\nBook(s): ${(order.items || []).map((item: any) => item.title || "Book").join(", ")}\nSeller: ${seller?.name || "Seller"}\nEstimated Delivery: 2-3 business days\n\nReBooked Solutions`,
          }),
        });
      }

      // Notify seller
      if (seller?.email) {
        const sellerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Commitment Confirmed - Prepare for Pickup</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f3fef7;
      padding: 20px;
      color: #1f4e3d;
      margin: 0;
    }
    .container {
      max-width: 500px;
      margin: auto;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: #3ab26f;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 10px 10px 0 0;
      margin: -30px -30px 20px -30px;
    }
    .footer {
      background: #f3fef7;
      color: #1f4e3d;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      line-height: 1.5;
      margin: 30px -30px -30px -30px;
      border-radius: 0 0 10px 10px;
      border-top: 1px solid #e5e7eb;
    }
    .info-box {
      background: #f3fef7;
      border: 1px solid #3ab26f;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .link { color: #3ab26f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Commitment Confirmed!</h1>
    </div>

    <h2>Thank you, ${seller.name || "Seller"}!</h2>
    <p>You've successfully committed to sell your book(s). The buyer has been notified and pickup has been scheduled.</p>

    <div class="info-box">
      <h3>📋 Order Details</h3>
      <p><strong>Order ID:</strong> ${order_id}</p>
      <p><strong>Book(s):</strong> ${(order.items || []).map((item: any) => item.title || "Book").join(", ")}</p>
      <p><strong>Buyer:</strong> ${buyer?.name || "Customer"}</p>
    </div>

    <p>A courier will contact you within 24 hours to arrange pickup.</p>
    <p>Thank you for selling with ReBooked Solutions! 📚</p>

    <div class="footer">
      <p><strong>This is an automated message from ReBooked Solutions.</strong><br>
      Please do not reply to this email.</p>
      <p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>
      Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p>
      <p>T&Cs apply.</p>
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
            subject: "Order Commitment Confirmed - Prepare for Pickup",
            html: sellerHtml,
            text: `Order Commitment Confirmed!\n\nThank you, ${seller.name || "Seller"}!\n\nYou've successfully committed to sell your book(s). The buyer has been notified and pickup has been scheduled.\n\nOrder ID: ${order_id}\nBook(s): ${(order.items || []).map((item: any) => item.title || "Book").join(", ")}\nBuyer: ${buyer?.name || "Customer"}\n\nA courier will contact you within 24 hours to arrange pickup.\n\nReBooked Solutions`,
          }),
        });
      }
            } catch (error) {
      emailError = error;
      console.error("Failed to send notification emails:", error);
      // Don't fail the commit for email errors
    }

                return jsonResponse({
        message: "Order committed successfully",
        order_id,
        status: "committed",
        pickup_scheduled: !deliveryError,
        email_sent: !emailError,
        ...(deliveryError && { delivery_warning: "Automatic pickup scheduling failed - will need manual arrangement" }),
        ...(emailError && { email_warning: "Notification emails failed to send" })
      });
  } catch (error) {
    logError("Commit to sale", error);

    return safeErrorResponse(
      "COMMIT_FAILED",
      error,
      "Failed to commit order to sale",
      { status: 500 }
    );
  }
});
