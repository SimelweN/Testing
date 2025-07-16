import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  createSupabaseClient,
  createErrorResponse,
  createSuccessResponse,
  handleCORSPreflight,
  validateRequiredFields,
  parseRequestBody,
  logFunction,
  handleSupabaseError,
} from "../_shared/utils.ts";
import { validateSupabaseConfig } from "../_shared/config.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCORSPreflight(req);
  if (corsResponse) return corsResponse;

  try {
    logFunction("mark-collected", "Processing collection notification");

    validateSupabaseConfig();

    const requestData = await parseRequestBody(req);
    validateRequiredFields(requestData, ["order_id"]);

    const {
      order_id,
      collected_by = "courier",
      collection_notes = "",
      tracking_reference = "",
      collected_at = new Date().toISOString(),
    } = requestData;

    const supabase = createSupabaseClient();

    // Get order details with buyer and seller info
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        *,
        seller:profiles!orders_seller_id_fkey(id, name, email),
        buyer:profiles!orders_buyer_id_fkey(id, name, email)
      `,
      )
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      logFunction("mark-collected", "Order not found", {
        order_id,
        error: orderError?.message,
      });
      return createErrorResponse(
        `Order not found: ${order_id}. Error: ${orderError?.message || "Order does not exist in database"}`,
        404,
      );
    }

    // Check if order is in a state that allows collection
    if (!["committed", "courier_scheduled"].includes(order.status)) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Order must be committed and courier scheduled before collection",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

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
      throw new Error(`Failed to update order status: ${updateError.message}`);
    }

    // Send notification emails
    try {
      // Notify buyer about collection
      await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({
          to: order.buyer.email,
          subject: "📦 Your order is on the way!",
          template: {
            name: "buyer-order-collected",
            data: {
              buyerName: order.buyer.name,
              orderId: order_id,
              sellerName: order.seller.name,
              items: order.items,
              collectedAt: collected_at,
              trackingReference: tracking_reference,
              estimatedDelivery: "3-5 business days",
              shippingAddress: order.shipping_address,
            },
          },
        }),
      });

      // Notify seller about successful collection
      await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({
          to: order.seller.email,
          subject: "✅ Order collected successfully",
          template: {
            name: "seller-order-collected",
            data: {
              sellerName: order.seller.name,
              orderId: order_id,
              buyerName: order.buyer.name,
              items: order.items,
              collectedAt: collected_at,
              collectedBy: collected_by,
              trackingReference: tracking_reference,
              collectionNotes: collection_notes,
            },
          },
        }),
      });
    } catch (emailError) {
      console.error("Failed to send collection notifications:", emailError);
      // Don't fail the collection process for email errors
    }

    // Schedule delivery completion check (e.g., after estimated delivery time)
    const estimatedDeliveryDate = new Date(
      Date.now() + 5 * 24 * 60 * 60 * 1000,
    ); // 5 days

    // This could trigger another function to check delivery status
    // For now, we'll just log it
    console.log(
      `Order ${order_id} collected, estimated delivery: ${estimatedDeliveryDate.toISOString()}`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        order: updatedOrder,
        collection: {
          collected_at,
          collected_by,
          tracking_reference,
          collection_notes,
        },
        message: "Order marked as collected successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Mark collected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to mark order as collected",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
