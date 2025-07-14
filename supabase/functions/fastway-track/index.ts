import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { tracking_number } = await req.json();

    if (!tracking_number) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing tracking number",
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

    const response = await fetch(
      `https://api.fastway.com.au/v3/track/${tracking_number}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${FASTWAY_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Fastway tracking API error: ${response.status}`);
    }

    const trackingData = await response.json();

    // Format tracking events
    const events =
      trackingData.events?.map((event: any) => ({
        timestamp: event.timestamp,
        status: event.status,
        description: event.description,
        location: event.location,
      })) || [];

    const trackingInfo = {
      tracking_number,
      status: trackingData.status,
      current_location: trackingData.current_location,
      estimated_delivery: trackingData.estimated_delivery,
      delivered_at: trackingData.delivered_at,
      events,
      provider: "fastway",
    };

    return new Response(
      JSON.stringify({
        success: true,
        tracking: trackingInfo,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Fastway tracking error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to track Fastway shipment",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
