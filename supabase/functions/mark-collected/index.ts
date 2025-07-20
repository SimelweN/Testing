import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { parseRequestBody } from "../_shared/safe-body-parser.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

    try {
    // Safety check for body consumption
    console.log("Body used before consumption:", req.bodyUsed);

        // Use safe body parser
    const bodyParseResult = await parseRequestBody(req, corsHeaders);
    if (!bodyParseResult.success) {
      return bodyParseResult.errorResponse!;
    }
    const requestData = bodyParseResult.data;
          fix_instructions: "Request body may have been consumed already. Check for duplicate body reads."
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const {
      order_id,
      collected_by = "courier",
      collection_notes = "",
      tracking_reference = "",
      collected_at = new Date().toISOString(),
    } = requestData;

    // Enhanced validation with specific error messages
    if (!order_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "VALIDATION_FAILED",
          details: {
            missing_fields: ["order_id"],
                        provided_fields: Object.keys({
              order_id,
              collected_by,
              collection_notes,
              tracking_reference,
              collected_at,
            }),
            message: "order_id is required",
          },
          fix_instructions:
            "Provide order_id (string). Optional fields: collected_by, collection_notes, tracking_reference, collected_at",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ENVIRONMENT_CONFIG_ERROR",
          details: {
            missing_env_vars: [
              !SUPABASE_URL ? "SUPABASE_URL" : null,
              !SUPABASE_SERVICE_KEY ? "SUPABASE_SERVICE_ROLE_KEY" : null,
            ].filter(Boolean),
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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get order details with buyer and seller info
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError) {
      if (orderError.code === "PGRST116") {
        return new Response(
          JSON.stringify({
            success: false,
            error: "ORDER_NOT_FOUND",
            details: {
              order_id,
              database_error: orderError.message,
              possible_causes: [
                "Order ID does not exist",
                "Order ID format is incorrect",
                "Order may have been deleted",
              ],
            },
            fix_instructions:
              "Verify the order_id exists in the database. Check order ID format and spelling.",
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
            query_details: "SELECT from orders table with order_id filter",
          },
          fix_instructions:
            "Check database connection and table structure. Ensure 'orders' table exists and is accessible.",
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
          error: "ORDER_NOT_FOUND",
          details: {
            order_id,
            message: "No order found with the provided ID",
          },
          fix_instructions:
            "Verify the order_id is correct and the order exists in the database",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check if order is in a state that allows collection
    const validStatuses = ["committed", "courier_scheduled", "shipped"];
    if (!validStatuses.includes(order.status)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_ORDER_STATUS",
          details: {
            order_id,
            current_status: order.status,
            required_statuses: validStatuses,
            message:
              "Order must be committed and courier scheduled before collection",
          },
          fix_instructions: `Order status must be one of: ${validStatuses.join(", ")}. Current status is '${order.status}'. Ensure the order has been committed and shipping arranged first.`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get buyer and seller profiles
    const [{ data: buyer }, { data: seller }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, name, email")
        .eq("id", order.buyer_id)
        .single(),
      supabase
        .from("profiles")
        .select("id, name, email")
        .eq("id", order.seller_id)
        .single(),
    ]);

    // Update order status to collected
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "collected",
        collected_at,
        collected_by,
        collection_notes,
        tracking_reference,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id)
      .select()
      .single();

    if (updateError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ORDER_UPDATE_FAILED",
          details: {
            error_code: updateError.code,
            error_message: updateError.message,
            update_fields: [
              "status",
              "collected_at",
              "collected_by",
              "collection_notes",
              "tracking_reference",
              "updated_at",
            ],
            order_id,
          },
          fix_instructions:
            "Check database permissions and ensure the orders table allows updates to these fields. Verify column names exist in the table.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Send notification emails
    const emailPromises = [];
    let emailErrors = [];

    try {
      // Notify buyer about collection
      if (buyer?.email) {
        const buyerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Collected - ReBooked Solutions</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f3fef7; padding: 20px; color: #1f4e3d; margin: 0; }
    .container { max-width: 500px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
    .header { background: #3ab26f; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -30px -30px 20px -30px; }
    .footer { background: #f3fef7; color: #1f4e3d; padding: 20px; text-align: center; font-size: 12px; line-height: 1.5; margin: 30px -30px -30px -30px; border-radius: 0 0 10px 10px; border-top: 1px solid #e5e7eb; }
    .info-box { background: #f0f9ff; border: 1px solid #3ab26f; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .link { color: #3ab26f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 Your Order is on the Way!</h1>
    </div>

    <h2>Hello ${buyer?.name || "Customer"}!</h2>
    <p>Great news! Your order #${order_id} has been collected from ${seller?.name || "the seller"} and is now being shipped to you.</p>

    <div class="info-box">
      <h3>📱 Tracking Information</h3>
      <p><strong>Tracking Reference:</strong> ${tracking_reference || "Will be provided soon"}</p>
      <p><strong>Estimated Delivery:</strong> 3-5 business days</p>
      <p><strong>Collected At:</strong> ${new Date(collected_at).toLocaleString()}</p>
      <p><strong>Collected By:</strong> ${collected_by}</p>
      ${collection_notes ? `<p><strong>Notes:</strong> ${collection_notes}</p>` : ""}
    </div>

    <div class="info-box">
      <h3>📍 Delivery Address</h3>
      <p>${order.shipping_address?.address_line_1 || order.delivery_address?.address_line_1 || "Address on file"}<br>
      ${order.shipping_address?.address_line_2 || order.delivery_address?.address_line_2 || ""}<br>
      ${order.shipping_address?.city || order.delivery_address?.city || ""}, ${order.shipping_address?.postal_code || order.delivery_address?.postal_code || ""}</p>
    </div>

    <p>You'll receive another notification with tracking details once your package is dispatched.</p>
    <p>Thank you for choosing ReBooked Solutions!</p>

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

        emailPromises.push(
          fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
            body: JSON.stringify({
              to: buyer.email,
              subject: "📦 Your order is on the way!",
              html: buyerHtml,
              text: `Your Order is on the Way!\n\nHello ${buyer?.name || "Customer"}!\n\nGreat news! Your order #${order_id} has been collected from ${seller?.name || "the seller"} and is now being shipped to you.\n\nTracking Reference: ${tracking_reference || "Will be provided soon"}\nEstimated Delivery: 3-5 business days\nCollected At: ${new Date(collected_at).toLocaleString()}\nCollected By: ${collected_by}\n\nThank you for choosing ReBooked Solutions!`,
            }),
          }),
        );
      }

      // Notify seller about successful collection
      if (seller?.email) {
        const sellerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Collected - ReBooked Solutions</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f3fef7; padding: 20px; color: #1f4e3d; margin: 0; }
    .container { max-width: 500px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
    .header { background: #3ab26f; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -30px -30px 20px -30px; }
    .footer { background: #f3fef7; color: #1f4e3d; padding: 20px; text-align: center; font-size: 12px; line-height: 1.5; margin: 30px -30px -30px -30px; border-radius: 0 0 10px 10px; border-top: 1px solid #e5e7eb; }
    .success-box { background: #dcfce7; border: 1px solid #22c55e; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .link { color: #3ab26f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Collected Successfully!</h1>
    </div>

    <h2>Hello ${seller?.name || "Seller"}!</h2>
    <p>Your order #${order_id} has been successfully collected and is now being shipped to ${buyer?.name || "the customer"}.</p>

    <div class="success-box">
      <h3>📋 Collection Details</h3>
      <p><strong>Collected At:</strong> ${new Date(collected_at).toLocaleString()}</p>
      <p><strong>Collected By:</strong> ${collected_by}</p>
      <p><strong>Tracking Reference:</strong> ${tracking_reference || "Being generated"}</p>
      ${collection_notes ? `<p><strong>Notes:</strong> ${collection_notes}</p>` : ""}
    </div>

    <p>The buyer will be notified about the shipment and you can expect your payment to be processed soon.</p>
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

        emailPromises.push(
          fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
            body: JSON.stringify({
              to: seller.email,
              subject: "Order collected successfully",
              html: sellerHtml,
              text: `Order Collected Successfully!\n\nHello ${seller?.name || "Seller"}!\n\nYour order #${order_id} has been successfully collected and is now being shipped to ${buyer?.name || "the customer"}.\n\nCollected At: ${new Date(collected_at).toLocaleString()}\nCollected By: ${collected_by}\nTracking Reference: ${tracking_reference || "Being generated"}\n\nThank you for being part of the ReBooked Solutions community!`,
            }),
          }),
        );
      }

      // Wait for emails to send
      const emailResults = await Promise.allSettled(emailPromises);
      emailErrors = emailResults
        .map((result, index) =>
          result.status === "rejected"
            ? {
                recipient: index === 0 ? "buyer" : "seller",
                error: result.reason,
              }
            : null,
        )
        .filter(Boolean);
    } catch (emailError) {
      console.error("Failed to send collection notifications:", emailError);
      emailErrors.push({ general: emailError.message });
    }

    // Schedule delivery completion check (e.g., after estimated delivery time)
    const estimatedDeliveryDate = new Date(
      Date.now() + 5 * 24 * 60 * 60 * 1000,
    ); // 5 days

    console.log(
      `Order ${order_id} collected, estimated delivery: ${estimatedDeliveryDate.toISOString()}`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order marked as collected successfully",
        details: {
          order: updatedOrder,
          collection: {
            collected_at,
            collected_by,
            tracking_reference,
            collection_notes,
          },
          notifications: {
            buyer_notified:
              !!buyer?.email &&
              emailErrors.filter((e) => e.recipient === "buyer").length === 0,
            seller_notified:
              !!seller?.email &&
              emailErrors.filter((e) => e.recipient === "seller").length === 0,
            email_errors: emailErrors,
          },
          estimated_delivery: estimatedDeliveryDate.toISOString(),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Mark collected error:", error);
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