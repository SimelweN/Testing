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
    const {
      user_id,
      items,
      total_amount,
      shipping_address,
      payment_reference,
      payment_data,
    } = await req.json();

    if (!user_id || !items || !total_amount || !payment_reference) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get buyer information
    const { data: buyer, error: buyerError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user_id)
      .single();

    if (buyerError || !buyer) {
      throw new Error("Buyer not found");
    }

    // Group items by seller to create separate orders
    const itemsBySeller = items.reduce((acc: any, item: any) => {
      const sellerId = item.seller_id;
      if (!acc[sellerId]) {
        acc[sellerId] = [];
      }
      acc[sellerId].push(item);
      return acc;
    }, {});

    const createdOrders = [];

    // Create orders for each seller
    for (const [sellerId, sellerItems] of Object.entries(
      itemsBySeller,
    ) as any) {
      // Get seller information
      const { data: seller, error: sellerError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sellerId)
        .single();

      if (sellerError || !seller) {
        console.error(`Seller ${sellerId} not found`);
        continue;
      }

      // Calculate order total for this seller
      const orderTotal = (sellerItems as any[]).reduce(
        (sum, item) => sum + item.price,
        0,
      );

      // Generate unique order ID
      const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const orderData = {
        id: orderId,
        buyer_id: user_id,
        seller_id: sellerId,
        status: "pending_commit",
        total_amount: orderTotal,
        items: sellerItems,
        shipping_address,
        payment_reference,
        payment_data,
        buyer_name: buyer.name,
        buyer_email: buyer.email,
        seller_name: seller.name,
        seller_email: seller.email,
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
        created_at: new Date().toISOString(),
      };

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error("Failed to create order:", orderError);
        continue;
      }

      createdOrders.push(order);

      // Mark books as sold
      const bookIds = sellerItems
        .map((item: any) => item.book_id)
        .filter(Boolean);
      if (bookIds.length > 0) {
        await supabase
          .from("books")
          .update({
            sold: true,
          })
          .in("id", bookIds);
      }

      // Send notification email to seller about new order
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({
            to: seller.email,
            subject: "📚 New Order - Action Required (48 hours)",
            template: {
              name: "seller-new-order",
              data: {
                sellerName: seller.name,
                buyerName: buyer.name,
                orderId,
                items: sellerItems,
                totalAmount: orderTotal,
                expiresAt: orderData.expires_at,
                commitUrl: `${req.headers.get("origin")}/activity`,
              },
            },
          }),
        });
      } catch (emailError) {
        console.error("Failed to send seller notification:", emailError);
      }

      // Send confirmation email to buyer
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({
            to: buyer.email,
            subject: "🎉 Order Confirmed - Awaiting Seller Commitment",
            template: {
              name: "buyer-order-pending",
              data: {
                buyerName: buyer.name,
                sellerName: seller.name,
                orderId,
                items: sellerItems,
                totalAmount: orderTotal,
                statusUrl: `${req.headers.get("origin")}/orders/${orderId}`,
              },
            },
          }),
        });
      } catch (emailError) {
        console.error("Failed to send buyer notification:", emailError);
      }
    }

    if (createdOrders.length === 0) {
      throw new Error("Failed to create any orders");
    }

    return new Response(
      JSON.stringify({
        success: true,
        orders: createdOrders,
        message: `Created ${createdOrders.length} order(s) successfully`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Create order error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to create orders",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
