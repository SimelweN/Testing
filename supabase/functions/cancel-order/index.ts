import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { parseRequestBody } from "../_shared/safe-body-parser.ts";
import { validateUUIDs, createUUIDErrorResponse } from "../_shared/uuid-validator.ts";
import { json } from "../_shared/response-utils.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Use safe body parser
    const bodyParseResult = await parseRequestBody(req, corsHeaders);
    if (!bodyParseResult.success) {
      return bodyParseResult.errorResponse!;
    }
    const { order_id, buyer_id, cancellation_reason } = bodyParseResult.data;

    // Validate UUIDs using shared validator
    const validation = validateUUIDs({ order_id, buyer_id });
    if (!validation.isValid) {
      return createUUIDErrorResponse(validation.errors, corsHeaders);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, book:books(*), seller:profiles!seller_id(*)")
      .eq("id", order_id)
      .eq("buyer_id", buyer_id)
      .single();

    if (orderError || !order) {
      return json({
        success: false,
        error: "Order not found or access denied",
      }, {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Check if order can be cancelled
    const cancellableStatuses = ["pending_commit", "committed", "pending_delivery"];
    if (!cancellableStatuses.includes(order.status)) {
      return json({
        success: false,
        error: `Cannot cancel order with status: ${order.status}`,
        allowed_statuses: cancellableStatuses,
      }, {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Check if book has been collected (delivery status)
    if (order.delivery_status === "delivered" || order.delivery_status === "collected") {
      return json({
        success: false,
        error: "Cannot cancel order - book has already been collected/delivered",
      }, {
        status: 400,
        headers: corsHeaders,
      });
    }

    let refundProcessed = false;
    let refundError = null;

    // Process refund if payment exists
    if (order.payment_reference) {
      try {
        const refundResponse = await fetch(`${SUPABASE_URL}/functions/v1/paystack-refund-management`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({
            action: "process_refund",
            order_id: order_id,
            payment_reference: order.payment_reference,
            refund_amount: order.total_amount,
            reason: cancellation_reason || "Buyer cancelled order",
          }),
        });

        const refundResult = await refundResponse.json();
        refundProcessed = refundResult.success;
        if (!refundProcessed) {
          refundError = refundResult.error;
        }
      } catch (error) {
        console.error("Refund processing failed:", error);
        refundError = "Failed to process refund";
      }
    }

    // Update order status to cancelled
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancellation_reason: cancellation_reason || "Buyer cancelled",
        refund_amount: order.total_amount,
        refund_processed: refundProcessed,
      })
      .eq("id", order_id);

    if (updateError) {
      throw new Error(`Failed to update order status: ${updateError.message}`);
    }

    // Return book to marketplace (mark as not sold)
    if (order.book?.id) {
      const { error: bookError } = await supabase
        .from("books")
        .update({
          sold: false,
          sold_at: null,
          buyer_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.book.id);

      if (bookError) {
        console.error("Failed to return book to marketplace:", bookError);
        // Don't fail the cancellation for this
      }
    }

    // Create database notifications first
    const notificationPromises = [];

    // Create notification for seller
    if (order.seller?.id) {
      notificationPromises.push(
        supabase.from("notifications").insert({
          user_id: order.seller.id,
          type: "warning",
          title: "❌ Order Cancelled",
          message: `Order #${order_id} for "${order.book?.title}" has been cancelled by the buyer. Your book has been returned to the marketplace.`,
          order_id: order_id,
          action_required: false
        })
      );
    }

    // Create notification for buyer
    if (buyer_id) {
      notificationPromises.push(
        supabase.from("notifications").insert({
          user_id: buyer_id,
          type: "info",
          title: "✅ Order Cancellation Confirmed",
          message: `Your order #${order_id} for "${order.book?.title}" has been successfully cancelled. ${refundProcessed ? `Refund of R${(order.total_amount / 100).toFixed(2)} will be processed within 3-5 business days.` : 'No refund processed.'}`,
          order_id: order_id,
          action_required: false
        })
      );
    }

    // Create database notifications
    try {
      const notificationResults = await Promise.allSettled(notificationPromises);
      const notificationErrors = notificationResults.filter(
        (result) => result.status === "rejected",
      ).length;

      if (notificationErrors > 0) {
        console.warn(
          `${notificationErrors} notification(s) failed to create out of ${notificationPromises.length}`,
        );
      } else {
        console.log("✅ Database notifications created successfully for order cancellation");
      }
    } catch (notificationError) {
      console.error("Failed to create database notifications:", notificationError);
      // Don't fail the cancellation for notification errors
    }

    // Send cancellation notification emails
    try {
      // Notify seller
      if (order.seller?.email) {
        await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({
            to: order.seller.email,
            subject: "Order Cancelled - ReBooked Solutions",
            html: `
              <h2>Order Cancelled</h2>
              <p>Hi ${order.seller.name},</p>
              <p>Order #${order_id} for "${order.book?.title}" has been cancelled by the buyer.</p>
              <p><strong>Reason:</strong> ${cancellation_reason || "Not specified"}</p>
              <p>Your book has been returned to the marketplace and is available for sale again.</p>
            `,
          }),
        });
      }

      // Notify buyer (confirmation)
      const { data: buyer } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", buyer_id)
        .single();

      if (buyer?.email) {
        await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({
            to: buyer.email,
            subject: "Order Cancellation Confirmed - ReBooked Solutions",
            html: `
              <h2>Order Cancellation Confirmed</h2>
              <p>Hi ${buyer.name},</p>
              <p>Your order #${order_id} for "${order.book?.title}" has been successfully cancelled.</p>
              ${refundProcessed ? 
                `<p><strong>Refund:</strong> R${(order.total_amount / 100).toFixed(2)} will be processed within 3-5 business days.</p>` :
                `<p><strong>Refund:</strong> ${refundError ? `Error: ${refundError}` : "No payment found to refund"}</p>`
              }
            `,
          }),
        });
      }
    } catch (emailError) {
      console.error("Failed to send cancellation emails:", emailError);
      // Don't fail the cancellation for email errors
    }

    return json({
      success: true,
      message: "Order cancelled successfully",
      order_id,
      refund_processed: refundProcessed,
      refund_amount: refundProcessed ? order.total_amount : 0,
      ...(refundError && { refund_warning: refundError })
    }, {
      headers: corsHeaders,
    });

  } catch (error) {
    console.error("Cancel order error:", error);
    return json({
      success: false,
      error: error.message || "Failed to cancel order",
    }, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
