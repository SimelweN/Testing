import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FastwayQuoteRequest {
  collection_postcode: string;
  delivery_postcode: string;
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  service_type?: string;
}

interface FastwayQuoteResponse {
  service_code: string;
  service_name: string;
  cost: number;
  cost_ex_gst: number;
  gst: number;
  transit_days: number;
  collection_cutoff?: string;
  delivery_guarantee?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Fastway Quote API called");

    const requestData: FastwayQuoteRequest = await req.json();
    console.log("Quote request:", requestData);

    // Validate required fields
    if (
      !requestData.collection_postcode ||
      !requestData.delivery_postcode ||
      !requestData.weight
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: collection_postcode, delivery_postcode, weight",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get Fastway API credentials from environment
    const fastwayApiKey = Deno.env.get("FASTWAY_API_KEY");
    const fastwayApiUrl =
      Deno.env.get("FASTWAY_API_URL") || "https://api.fastway.org/v2";

    if (!fastwayApiKey) {
      console.error("Fastway API key not configured");
      // Return fallback quotes for development
      return new Response(
        JSON.stringify({
          quotes: generateFallbackQuotes(requestData.weight),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Prepare Fastway API request
    const fastwayRequest = {
      pickup_postcode: requestData.collection_postcode,
      destination_postcode: requestData.delivery_postcode,
      weight_kg: requestData.weight,
      length_cm: requestData.length || 20,
      width_cm: requestData.width || 20,
      height_cm: requestData.height || 20,
    };

    console.log("Calling Fastway API:", fastwayRequest);

    // Call Fastway API
    const fastwayResponse = await fetch(`${fastwayApiUrl}/quotes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${fastwayApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fastwayRequest),
    });

    if (!fastwayResponse.ok) {
      console.error(
        "Fastway API error:",
        fastwayResponse.status,
        await fastwayResponse.text(),
      );

      // Return fallback quotes on API error
      return new Response(
        JSON.stringify({
          quotes: generateFallbackQuotes(requestData.weight),
          fallback: true,
          error: `Fastway API error: ${fastwayResponse.status}`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const fastwayData = await fastwayResponse.json();
    console.log("Fastway API response:", fastwayData);

    // Transform Fastway response to our format
    const quotes: FastwayQuoteResponse[] = (fastwayData.quotes || []).map(
      (quote: any) => ({
        service_code: quote.service_code || "STANDARD",
        service_name: quote.service_name || "Fastway Standard",
        cost: parseFloat(quote.total_cost_incl_gst || quote.cost || "50"),
        cost_ex_gst: parseFloat(
          quote.total_cost_excl_gst || quote.cost_ex_gst || "43.48",
        ),
        gst: parseFloat(quote.gst || "6.52"),
        transit_days: parseInt(quote.transit_days || "3"),
        collection_cutoff: quote.collection_cutoff || "16:00",
        delivery_guarantee: quote.guarantee,
      }),
    );

    // If no quotes returned, provide fallback
    if (quotes.length === 0) {
      console.log("No quotes from Fastway API, using fallback");
      return new Response(
        JSON.stringify({
          quotes: generateFallbackQuotes(requestData.weight),
          fallback: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ quotes }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in fastway-quote function:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        quotes: generateFallbackQuotes(1), // Default weight
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

function generateFallbackQuotes(weight: number): FastwayQuoteResponse[] {
  const basePrice = Math.max(45, weight * 12);
  const gst = Math.round(basePrice * 0.15 * 100) / 100;

  return [
    {
      service_code: "STANDARD",
      service_name: "Fastway Standard",
      cost: Math.round((basePrice + gst) * 100) / 100,
      cost_ex_gst: basePrice,
      gst: gst,
      transit_days: 3,
      collection_cutoff: "16:00",
    },
    {
      service_code: "EXPRESS",
      service_name: "Fastway Express",
      cost: Math.round((basePrice * 1.4 + gst * 1.4) * 100) / 100,
      cost_ex_gst: Math.round(basePrice * 1.4 * 100) / 100,
      gst: Math.round(gst * 1.4 * 100) / 100,
      transit_days: 1,
      collection_cutoff: "14:00",
      delivery_guarantee: "Next business day",
    },
  ];
}
