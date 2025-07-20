import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { testFunction } from "../_mock-data/edge-function-tester.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 🧪 TEST MODE: Check if this is a test request with mock data
  const testResult = await testFunction("automate-delivery", req);
  if (testResult.isTest) {
    return testResult.response;
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
      console.warn(
        "Order not found, proceeding with automation anyway:",
        orderError?.message,
      );
    }

    // Step 1: Get quotes from both couriers
    let quotes = [];
    try {
      const [courierGuyQuote, fastwayQuote] = await Promise.allSettled([
        fetch(`${SUPABASE_URL}/functions/v1/courier-guy-quote`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({
            fromAddress: seller_address,
            toAddress: buyer_address,
            weight: weight || 1,
            serviceType: "standard",
          }),
        }),
        fetch(`${SUPABASE_URL}/functions/v1/fastway-quote`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({
            fromAddress: seller_address,
            toAddress: buyer_address,
            weight: weight || 1,
            serviceType: "standard",
          }),
        }),
      ]);

      if (courierGuyQuote.status === "fulfilled") {
        try {
          const cgData = await courierGuyQuote.value.json();
          if (cgData.success && cgData.quotes) {
            quotes.push(...cgData.quotes);
          }
        } catch (e) {
          console.warn("Failed to parse courier guy response:", e);
        }
      }

      if (fastwayQuote.status === "fulfilled") {
        try {
          const fwData = await fastwayQuote.value.json();
          if (fwData.success && fwData.quotes) {
            quotes.push(...fwData.quotes);
          }
        } catch (e) {
          console.warn("Failed to parse fastway response:", e);
        }
      }
    } catch (quoteError) {
      console.error("Failed to get quotes:", quoteError);
    }

    // Add fallback quote if no quotes received
    if (quotes.length === 0) {
      console.warn("No quotes received, adding fallback quote");
      quotes.push({
        service_name: "Standard Delivery",
        price: 95.0,
        estimated_days: 3,
        service_code: "STANDARD",
        courier: "courier-guy",
      });
    }

    // Step 2: Select best quote (cheapest available)
    const selectedQuote = quotes.reduce((best, current) =>
      current.price < best.price ? current : best,
    );

    // Step 3: Create shipment with selected courier
    let shipmentResult = null;
    if (selectedQuote) {
      try {
        const shipmentFunction =
          selectedQuote.courier === "courier-guy"
            ? "courier-guy-shipment"
            : "fastway-shipment";

        const shipmentResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/${shipmentFunction}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
            body: JSON.stringify({
              order_id,
              service_code: selectedQuote.service_code,
              pickup_address: seller_address,
              delivery_address: buyer_address,
              weight: weight || 1,
              reference: `AUTO-${order_id}`,
            }),
          },
        );

        const shipmentData = await shipmentResponse.json();
        shipmentResult = shipmentData;
      } catch (shipmentError) {
        console.error("Failed to create shipment:", shipmentError);
      }
    }

    // Step 4: Update order with delivery information (if order exists)
    if (order) {
      const updateData: any = {
        delivery_automated: true,
        delivery_automation_date: new Date().toISOString(),
        selected_courier: selectedQuote.courier,
        delivery_cost: selectedQuote.price,
      };

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
    }

    // Step 5: Log automation activity (optional table)
    try {
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
    } catch (logError) {
      console.warn(
        "Failed to log automation activity (table may not exist):",
        logError.message,
      );
      // Don't fail for logging errors
    }

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
        console.error("Automate delivery error:", error?.message || error);

    return new Response(
      JSON.stringify({
        success: false,
                error: error?.message || String(error) || "Failed to automate delivery",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
