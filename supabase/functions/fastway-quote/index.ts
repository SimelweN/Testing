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

    // Fastway API integration
    const FASTWAY_API_KEY = Deno.env.get("FASTWAY_API_KEY");
    if (!FASTWAY_API_KEY) {
      throw new Error("Fastway API key not configured");
    }

    const quoteRequest = {
      from_suburb: fromAddress.suburb,
      from_postcode: fromAddress.postal_code,
      to_suburb: toAddress.suburb,
      to_postcode: toAddress.postal_code,
      weight_kg: weight,
      length_cm: dimensions?.length || 30,
      width_cm: dimensions?.width || 20,
      height_cm: dimensions?.height || 10,
      service_type: serviceType,
    };

    const response = await fetch("https://api.fastway.com.au/v3/quote", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FASTWAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(quoteRequest),
    });

    if (!response.ok) {
      throw new Error(`Fastway API error: ${response.status}`);
    }

    const quoteData = await response.json();

    // Format the response for our system
    const quotes =
      quoteData.quotes?.map((quote: any) => ({
        service_name: quote.service_name,
        price: parseFloat(quote.price),
        estimated_days: quote.transit_days,
        service_code: quote.service_code,
        courier: "fastway",
      })) || [];

    return new Response(
      JSON.stringify({
        success: true,
        quotes,
        provider: "fastway",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Fastway quote error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to get Fastway quote",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
