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
      service_code,
      pickup_address,
      delivery_address,
      weight,
      dimensions,
      reference,
    } = await req.json();

    if (!order_id || !service_code || !pickup_address || !delivery_address) {
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

    // Fastway API integration
    const FASTWAY_API_KEY = Deno.env.get("FASTWAY_API_KEY");
    if (!FASTWAY_API_KEY) {
      throw new Error("Fastway API key not configured");
    }

    const shipmentRequest = {
      service_code,
      reference: reference || `ORDER-${order_id}`,
      pickup: {
        company_name: pickup_address.company || "ReBooked Solutions",
        contact_name: pickup_address.name,
        phone: pickup_address.phone,
        email: pickup_address.email,
        address_line_1: pickup_address.address_line_1,
        suburb: pickup_address.suburb,
        postcode: pickup_address.postal_code,
        state: pickup_address.province,
      },
      delivery: {
        company_name: delivery_address.company || "",
        contact_name: delivery_address.name,
        phone: delivery_address.phone,
        email: delivery_address.email,
        address_line_1: delivery_address.address_line_1,
        suburb: delivery_address.suburb,
        postcode: delivery_address.postal_code,
        state: delivery_address.province,
      },
      items: [
        {
          weight_kg: weight,
          length_cm: dimensions?.length || 30,
          width_cm: dimensions?.width || 20,
          height_cm: dimensions?.height || 10,
          description: "Textbook",
        },
      ],
    };

    const response = await fetch("https://api.fastway.com.au/v3/shipments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FASTWAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(shipmentRequest),
    });

    if (!response.ok) {
      throw new Error(`Fastway API error: ${response.status}`);
    }

    const shipmentData = await response.json();

    // Update order with tracking information
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        tracking_number: shipmentData.tracking_number,
        courier_reference: shipmentData.shipment_id,
        courier_service: "fastway",
        status: "shipped",
        shipped_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    if (updateError) {
      console.error("Failed to update order:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        tracking_number: shipmentData.tracking_number,
        shipment_id: shipmentData.shipment_id,
        label_url: shipmentData.label_url,
        estimated_delivery: shipmentData.estimated_delivery,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Fastway shipment error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to create Fastway shipment",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
