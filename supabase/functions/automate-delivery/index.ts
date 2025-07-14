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
      order_id,
      seller_address,
      buyer_address,
      weight,
      preferred_courier = "courier-guy",
    } = await req.json();

    if (!order_id || !seller_address || !buyer_address) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Missing required fields: order_id, seller_address, buyer_address",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
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
      throw new Error("Order not found");
    }

    // Step 1: Get quotes from both couriers
    let quotes = [];
    try {
      const [courierGuyQuote, fastwayQuote] = await Promise.allSettled([
        supabase.functions.invoke("courier-guy-quote", {
          body: {
            fromAddress: seller_address,
            toAddress: buyer_address,
            weight: weight || 1,
            serviceType: "standard",
          },
        }),
        supabase.functions.invoke("fastway-quote", {
          body: {
            fromAddress: seller_address,
            toAddress: buyer_address,
            weight: weight || 1,
            serviceType: "standard",
          },
        }),
      ]);

      if (
        courierGuyQuote.status === "fulfilled" &&
        courierGuyQuote.value.data?.quotes
      ) {
        quotes.push(...courierGuyQuote.value.data.quotes);
      }
      if (
        fastwayQuote.status === "fulfilled" &&
        fastwayQuote.value.data?.quotes
      ) {
        quotes.push(...fastwayQuote.value.data.quotes);
      }
    } catch (quoteError) {
      console.error("Failed to get quotes:", quoteError);
    }

    // Step 2: Select best quote (cheapest available)
    let selectedQuote = null;
    if (quotes.length > 0) {
      selectedQuote = quotes.reduce((best, current) =>
        current.price < best.price ? current : best,
      );
    }

    // Step 3: Create shipment with selected courier
    let shipmentResult = null;
    if (selectedQuote) {
      try {
        const shipmentFunction =
          selectedQuote.courier === "courier-guy"
            ? "courier-guy-shipment"
            : "fastway-shipment";

        const { data: shipmentData } = await supabase.functions.invoke(
          shipmentFunction,
          {
            body: {
              order_id,
              service_code: selectedQuote.service_code,
              pickup_address: seller_address,
              delivery_address: buyer_address,
              weight: weight || 1,
              reference: `AUTO-${order_id}`,
            },
          },
        );

        shipmentResult = shipmentData;
      } catch (shipmentError) {
        console.error("Failed to create shipment:", shipmentError);
      }
    }

    // Step 4: Update order with delivery information
    const updateData: any = {
      delivery_automated: true,
      delivery_automation_date: new Date().toISOString(),
    };

    if (selectedQuote) {
      updateData.selected_courier = selectedQuote.courier;
      updateData.delivery_cost = selectedQuote.price;
    }

    if (shipmentResult?.success) {
      updateData.status = "courier_scheduled";
      updateData.tracking_number = shipmentResult.tracking_number;
      updateData.courier_reference = shipmentResult.shipment_id;
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", order_id);

    if (updateError) {
      console.error("Failed to update order:", updateError);
    }

    // Step 5: Log automation activity
    await supabase.from("delivery_automation_log").insert({
      order_id,
      quotes_received: quotes.length,
      selected_courier: selectedQuote?.courier,
      delivery_cost: selectedQuote?.price,
      shipment_created: !!shipmentResult?.success,
      tracking_number: shipmentResult?.tracking_number,
      automation_status: shipmentResult?.success ? "success" : "partial",
      created_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        automation_status: shipmentResult?.success ? "complete" : "partial",
        quotes_received: quotes.length,
        selected_courier: selectedQuote?.courier,
        delivery_cost: selectedQuote?.price,
        tracking_number: shipmentResult?.tracking_number,
        shipment_created: !!shipmentResult?.success,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Automate delivery error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to automate delivery",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
