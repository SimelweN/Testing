import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      fromAddress,
      toAddress,
      weight,
      dimensions,
      serviceType = "standard",
    } = await req.json();

    if (!fromAddress || !toAddress || !weight) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: fromAddress, toAddress, weight",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Courier Guy API integration
    const COURIER_GUY_API_KEY = Deno.env.get("COURIER_GUY_API_KEY");
    const COURIER_GUY_API_URL =
      Deno.env.get("COURIER_GUY_API_URL") || "https://api.courierguy.co.za";

    if (!COURIER_GUY_API_KEY) {
      throw new Error("Courier Guy API key not configured");
    }

    const quoteRequest = {
      collection_address: {
        suburb: fromAddress.suburb,
        postal_code: fromAddress.postal_code,
        province: fromAddress.province,
      },
      delivery_address: {
        suburb: toAddress.suburb,
        postal_code: toAddress.postal_code,
        province: toAddress.province,
      },
      parcel_details: {
        weight_kg: weight,
        length_cm: dimensions?.length || 30,
        width_cm: dimensions?.width || 20,
        height_cm: dimensions?.height || 10,
      },
      service_type: serviceType,
    };

    const response = await fetch(`${COURIER_GUY_API_URL}/api/v1/quote`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${COURIER_GUY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(quoteRequest),
    });

    if (!response.ok) {
      throw new Error(`Courier Guy API error: ${response.status}`);
    }

    const quoteData = await response.json();

    // Format the response for our system
    const quotes =
      quoteData.services?.map((service: any) => ({
        service_name: service.service_name,
        price: parseFloat(service.price),
        estimated_days: service.transit_days,
        service_code: service.service_code,
        courier: "courier-guy",
      })) || [];

    return new Response(
      JSON.stringify({
        success: true,
        quotes,
        provider: "courier-guy",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Courier Guy quote error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to get Courier Guy quote",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
