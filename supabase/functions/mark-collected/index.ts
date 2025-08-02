import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { parseRequestBody } from "../_shared/safe-body-parser.ts";
import { testFunction } from "../_mock-data/edge-function-tester.ts";
import { jsonResponse, errorResponse, handleCorsPreflightRequest, safeErrorResponse } from "../_shared/response-utils.ts";
import { logError } from "../_shared/error-utils.ts";
import { validateUUIDs, createUUIDErrorResponse } from "../_shared/uuid-validator.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest();
  }

  // 🧪 TEST MODE: Check if this is a test request with mock data
  const testResult = await testFunction("mark-collected", req);
  if (testResult.isTest) {
    return testResult.response;
  }

  try {
    // Use safe body parser
    const bodyParseResult = await parseRequestBody(req, corsHeaders);
    if (!bodyParseResult.success) {
      return bodyParseResult.errorResponse!;
    }
    const requestData = bodyParseResult.data;

    const {
      order_id,
      collected_by = "courier",
      collection_notes = "",
      tracking_reference = "",
      collected_at = new Date().toISOString(),
    } = requestData;

    // Validate required fields
    const validationErrors = [];
    if (!order_id) validationErrors.push("order_id is required");

    // Use UUID validator
    const validation = validateUUIDs({ order_id });
    if (!validation.isValid) {
      return createUUIDErrorResponse(validation.errors, corsHeaders);
    }

    if (validationErrors.length > 0) {
      return errorResponse(
        "VALIDATION_FAILED",
        {
          validation_errors: validationErrors,
          provided_fields: Object.keys(requestData)
        },
        { status: 400 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return errorResponse(
        "ORDER_NOT_FOUND",
        {
          order_id,
          error_message: orderError?.message || "Order not found"
        },
        { status: 404 }
      );
    }

    // Check if order can be collected
    const validStatuses = ["committed", "courier_scheduled", "shipped"];
    if (!validStatuses.includes(order.status)) {
      return errorResponse(
        "INVALID_ORDER_STATUS",
        {
          order_id,
          current_status: order.status,
          required_statuses: validStatuses,
          message: "Order must be committed and courier scheduled before collection"
        },
        { status: 400 }
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
      return errorResponse(
        "ORDER_UPDATE_FAILED",
        {
          error_message: updateError.message,
          update_fields: ["status", "collected_at", "collected_by", "collection_notes", "tracking_reference"]
        },
        { status: 500 }
      );
    }

    // Create database notifications first
    const notificationPromises = [];

    // Create notification for buyer
    if (buyer?.id) {
      notificationPromises.push(
        supabase.from("notifications").insert({
          user_id: buyer.id,
          type: "info",
          title: "📦 Your Order is on the Way!",
          message: `Order #${order_id} has been collected and is being shipped to you. ${tracking_reference ? `Tracking: ${tracking_reference}` : 'Tracking information will be provided soon.'}`,
          order_id: order_id,
          action_required: false
        })
      );
    }

    // Create notification for seller
    if (seller?.id) {
      notificationPromises.push(
        supabase.from("notifications").insert({
          user_id: seller.id,
          type: "success",
          title: "📦 Order Collected Successfully!",
          message: `Order #${order_id} has been collected and is being shipped to the buyer.`,
          order_id: order_id,
          action_required: false
        })
      );
    }

    // Create database notifications
    let notificationErrors = [];
    try {
      const notificationResults = await Promise.allSettled(notificationPromises);
      notificationErrors = notificationResults
        .map((result, index) =>
          result.status === "rejected"
            ? { recipient: index === 0 ? "buyer" : "seller", error: result.reason }
            : null
        )
        .filter(Boolean);

      if (notificationErrors.length === 0) {
        console.log("✅ Database notifications created successfully");
      } else {
        console.warn(`${notificationErrors.length} notification(s) failed to create`);
      }
    } catch (notificationError) {
      console.error("Failed to create database notifications:", notificationError);
    }

    // Send notification emails
    const emailPromises = [];
    let emailErrors = [];

    try {
      // Notify buyer
      if (buyer?.email) {
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
              html: `<h1>Your Order is on the Way!</h1><p>Order #${order_id} has been collected and is being shipped to you.</p><p><strong>Tracking:</strong> ${tracking_reference || "Will be provided soon"}</p>`,
              text: `Your order #${order_id} has been collected and is being shipped to you. Tracking: ${tracking_reference || "Will be provided soon"}`,
            }),
          }),
        );
      }

      // Notify seller
      if (seller?.email) {
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
              html: `<h1>Order Collected Successfully!</h1><p>Order #${order_id} has been collected and is being shipped to the buyer.</p>`,
              text: `Order #${order_id} has been collected and is being shipped to the buyer.`,
            }),
          }),
        );
      }

      // Wait for emails
      const emailResults = await Promise.allSettled(emailPromises);
      emailErrors = emailResults
        .map((result, index) =>
          result.status === "rejected"
            ? { recipient: index === 0 ? "buyer" : "seller", error: result.reason }
            : null
        )
        .filter(Boolean);
    } catch (emailError) {
      console.error("Failed to send collection notifications:", emailError);
      emailErrors.push({ general: emailError.message });
    }

    return jsonResponse({
      message: "Order marked as collected successfully",
      order_id,
      status: "collected",
      collected_at,
      collected_by,
      tracking_reference,
      notifications: {
        database_notifications: {
          buyer_notified: !!buyer?.id && notificationErrors.filter((e) => e.recipient === "buyer").length === 0,
          seller_notified: !!seller?.id && notificationErrors.filter((e) => e.recipient === "seller").length === 0,
          notification_errors: notificationErrors,
        },
        email_notifications: {
          buyer_notified: !!buyer?.email && emailErrors.filter((e) => e.recipient === "buyer").length === 0,
          seller_notified: !!seller?.email && emailErrors.filter((e) => e.recipient === "seller").length === 0,
          email_errors: emailErrors,
        },
      },
    });

  } catch (error) {
    logError("Mark collected", error);

    return safeErrorResponse(
      "UNEXPECTED_ERROR",
      error,
      "Unexpected error occurred during mark collected",
      { status: 500 }
    );
  }
});
