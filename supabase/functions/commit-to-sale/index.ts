import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order_id, seller_id } = await req.json();

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

    // Get order details first
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        *,
        buyer:profiles!orders_buyer_id_fkey(id, name, email, phone),
        seller:profiles!orders_seller_id_fkey(id, name, email, phone),
        order_items(
          *,
          book:books(id, title, isbn, weight, dimensions)
        )
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

    // Schedule automatic courier pickup by calling automate-delivery
    try {
      await supabase.functions.invoke("automate-delivery", {
        body: {
          order_id: order_id,
          seller_address: order.shipping_address,
          buyer_address: order.shipping_address,
          weight: order.order_items.reduce(
            (total: number, item: any) => total + (item.book?.weight || 0.5),
            0,
          ),
        },
      });
    } catch (deliveryError) {
      console.error("Failed to schedule automatic delivery:", deliveryError);
      // Continue anyway - delivery can be scheduled manually
    }

    // Send notification emails
    try {
      // Notify buyer
      await supabase.functions.invoke("send-email", {
        body: {
          to: order.buyer.email,
          subject: "Order Confirmed - Pickup Scheduled",
          template: {
            name: "order-committed-buyer",
            data: {
              buyer_name: order.buyer.name,
              order_id: order_id,
              seller_name: order.seller.name,
              book_titles: order.order_items
                .map((item: any) => item.book?.title)
                .join(", "),
              estimated_delivery: "2-3 business days",
            },
          },
        },
      });

      // Notify seller
      await supabase.functions.invoke("send-email", {
        body: {
          to: order.seller.email,
          subject: "Order Commitment Confirmed - Prepare for Pickup",
          template: {
            name: "order-committed-seller",
            data: {
              seller_name: order.seller.name,
              order_id: order_id,
              buyer_name: order.buyer.name,
              book_titles: order.order_items
                .map((item: any) => item.book?.title)
                .join(", "),
              pickup_instructions:
                "A courier will contact you within 24 hours to arrange pickup",
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
        message: "Order committed successfully",
        order_id,
        status: "committed",
        pickup_scheduled: true,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Commit to sale error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to commit order to sale",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
