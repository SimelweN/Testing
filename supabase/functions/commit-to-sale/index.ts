import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Method not allowed. Use POST.",
      }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { order_id, seller_id } = await req.json();

    if (!order_id || !seller_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing order_id or seller_id",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 📦 STEP 1: Get complete order details with seller & buyer info
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        *,
        seller:profiles!orders_seller_id_fkey(id, name, email, pickup_address, phone),
        buyer:profiles!orders_buyer_id_fkey(id, name, email, phone)
      `,
      )
      .eq("id", order_id)
      .eq("seller_id", seller_id)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderError);
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

    // Check if order is already committed
    if (order.status === "committed" || order.status === "courier_scheduled") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Order is already committed",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ✅ STEP 2: Update order status to committed
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "committed",
        committed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to commit order:", updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to commit to sale",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log(`✅ Order ${order_id} committed successfully`);

    // 🚚 STEP 3: TRIGGER AUTOMATIC DELIVERY BOOKING & EMAIL
    try {
      // Call delivery automation service
      const { data: deliveryResult, error: deliveryError } =
        await supabase.functions.invoke("automate-delivery", {
          body: {
            order_id: order_id,
            trigger: "order_committed",
          },
        });

      if (deliveryResult?.success) {
        console.log("✅ Delivery automation completed");

        // 📧 STEP 4: SEND EMAIL WITH COURIER INFO TO SELLER
        await supabase.functions.invoke("send-email", {
          body: {
            to: order.seller.email,
            subject: `📦 Order #${order_id.substring(0, 8)} - Courier Pickup Scheduled!`,
            template: {
              name: "seller-pickup-notification",
              data: {
                sellerName: order.seller.name,
                bookTitle:
                  order.items?.[0]?.book_title || order.book_title || "Book",
                orderId: order_id,
                pickupDate: deliveryResult.pickup_date,
                pickupTimeWindow: deliveryResult.pickup_time_window,
                courierProvider: deliveryResult.courier_provider,
                trackingNumber: deliveryResult.tracking_number,
                shippingLabelUrl: deliveryResult.shipping_label_url,
                pickupAddress: order.seller.pickup_address,
              },
            },
          },
        });

        console.log(`📧 Seller notification sent to: ${order.seller.email}`);
      } else {
        console.warn("Delivery automation failed:", deliveryError);
      }
    } catch (deliveryError) {
      console.warn(
        "Delivery automation failed, sending basic email:",
        deliveryError,
      );

      // 📧 FALLBACK: Send basic commitment confirmation email
      await supabase.functions.invoke("send-email", {
        body: {
          to: order.seller.email,
          subject: `✅ Order Commitment Confirmed - Next Steps`,
          template: {
            name: "commit-confirmation-basic",
            data: {
              sellerName: order.seller.name,
              bookTitle:
                order.items?.[0]?.book_title || order.book_title || "Book",
              orderId: order_id,
              buyerEmail: order.buyer?.email || order.buyer_email,
            },
          },
        },
      });

      console.log(`📧 Basic confirmation sent to: ${order.seller.email}`);
    }

    // 📧 STEP 5: NOTIFY BUYER ABOUT COMMITMENT
    try {
      await supabase.functions.invoke("send-email", {
        body: {
          to: order.buyer?.email || order.buyer_email,
          subject: `🎉 Your order has been confirmed!`,
          template: {
            name: "buyer-order-confirmed",
            data: {
              buyerName: order.buyer?.name || order.buyer_name || "Customer",
              bookTitle:
                order.items?.[0]?.book_title || order.book_title || "Book",
              orderId: order_id,
              sellerName: order.seller.name,
              expectedDelivery: "3-5 business days",
            },
          },
        },
      });

      console.log(
        `📧 Buyer notification sent to: ${order.buyer?.email || order.buyer_email}`,
      );
    } catch (emailError) {
      console.error("Failed to send buyer notification:", emailError);
      // Don't fail the entire operation for email errors
    }

    return new Response(
      JSON.stringify({
        success: true,
        order: updatedOrder,
        message: "Successfully committed to sale and notifications sent",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Commit-to-sale error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
