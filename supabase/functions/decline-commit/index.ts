import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      order_id,
      seller_id,
      reason = "Seller declined",
    } = await req.json();

    if (!order_id || !seller_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: order_id, seller_id",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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
      .eq("seller_id", seller_id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Order not found or access denied",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check if order can be declined
    if (!["pending_commit", "pending"].includes(order.status)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Order cannot be declined in current status",
        }),
        {
          status: 400,
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
        decline_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    if (updateError) {
      throw new Error(`Failed to update order status: ${updateError.message}`);
    }

    // Make books available again
    const bookIds =
      order.items?.map((item: any) => item.book_id).filter(Boolean) || [];
    if (bookIds.length > 0) {
      await supabase
        .from("books")
        .update({
          sold: false,
          sold_at: null,
          buyer_id: null,
          reserved_until: null,
          reserved_by: null,
        })
        .in("id", bookIds);
    }

    // Process full refund
    let refundResult = null;
    if (order.payment_reference) {
      try {
        const refundResponse = await fetch("https://api.paystack.co/refund", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transaction: order.payment_reference,
            amount: Math.round(order.total_amount * 100), // Convert to kobo
            currency: "ZAR",
            customer_note: `Refund for declined order ${order_id}`,
            merchant_note: `Order declined by seller: ${reason}`,
          }),
        });

        refundResult = await refundResponse.json();

        if (refundResult.status) {
          // Record refund in database
          await supabase.from("refunds").insert({
            order_id,
            amount: order.total_amount,
            reason: `Order declined: ${reason}`,
            paystack_response: refundResult.data,
            status: "processed",
            created_at: new Date().toISOString(),
          });
        } else {
          console.error("Paystack refund failed:", refundResult);
        }
      } catch (refundError) {
        console.error("Refund processing error:", refundError);
        // Continue with the decline process even if refund fails
      }
    }

    // Send notification emails
    try {
      // Notify buyer about declined order and refund
      await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({
          to: order.buyer.email,
          subject: "Order Declined - Full Refund Processed",
          template: {
            name: "buyer-order-declined",
            data: {
              buyerName: order.buyer.name,
              orderId: order_id,
              sellerName: order.seller.name,
              items: order.items,
              totalAmount: order.total_amount,
              reason: reason,
              refundAmount: order.total_amount,
              refundStatus: refundResult?.status ? "processed" : "pending",
            },
          },
        }),
      });

      // Notify seller about decline confirmation
      await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({
          to: order.seller.email,
          subject: "Order Decline Confirmed",
          template: {
            name: "seller-decline-confirmation",
            data: {
              sellerName: order.seller.name,
              orderId: order_id,
              buyerName: order.buyer.name,
              items: order.items,
              reason: reason,
            },
          },
        }),
      });
    } catch (emailError) {
      console.error("Failed to send decline notifications:", emailError);
      // Don't fail the decline process for email errors
    }

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: order_id,
          status: "declined",
          decline_reason: reason,
        },
        refund: refundResult?.data || null,
        message:
          "Order declined successfully and buyer will receive full refund",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Decline commit error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to decline order",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
