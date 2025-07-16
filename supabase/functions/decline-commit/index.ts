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
    logFunction("decline-commit", "Processing decline request");

    validateSupabaseConfig();

    const requestData = await parseRequestBody(req);
    validateRequiredFields(requestData, ["order_id", "seller_id"]);

    const { order_id, seller_id, reason } = requestData;

    const supabase = createSupabaseClient();

    // Get order details first
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        *,
        buyer:profiles!orders_buyer_id_fkey(id, name, email),
        seller:profiles!orders_seller_id_fkey(id, name, email)
      `,
      )
      .eq("id", order_id)
      .eq("seller_id", seller_id)
      .eq("status", "pending_commit")
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Order not found or not in pending commit status",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Update order status to declined
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "declined",
        declined_at: new Date().toISOString(),
        decline_reason: reason || "Seller declined to commit",
      })
      .eq("id", order_id);

    if (updateError) {
      throw new Error(`Failed to update order status: ${updateError.message}`);
    }

    // Create refund transaction
    const { error: refundError } = await supabase.from("transactions").insert({
      user_id: order.buyer_id,
      amount: order.total_amount,
      type: "refund",
      status: "pending",
      description: `Refund for declined order #${order_id}`,
      order_id: order_id,
      created_at: new Date().toISOString(),
    });

    if (refundError) {
      console.error("Failed to create refund transaction:", refundError);
    }

    // Send notification emails (buyer and seller)
    try {
      // Notify buyer
      await supabase.functions.invoke("send-email", {
        body: {
          to: order.buyer.email,
          subject: "Order Declined - Refund Processed",
          template: {
            name: "order-declined-buyer",
            data: {
              buyer_name: order.buyer.name,
              order_id: order_id,
              amount: order.total_amount,
              reason: reason || "Seller declined to commit",
            },
          },
        },
      });

      // Notify seller
      await supabase.functions.invoke("send-email", {
        body: {
          to: order.seller.email,
          subject: "Order Decline Confirmation",
          template: {
            name: "order-declined-seller",
            data: {
              seller_name: order.seller.name,
              order_id: order_id,
              reason: reason || "You declined to commit",
            },
          },
        },
      });
    } catch (emailError) {
      console.error("Failed to send notification emails:", emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order declined successfully",
        order_id,
        refund_amount: order.total_amount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Decline commit error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to decline order commit",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
