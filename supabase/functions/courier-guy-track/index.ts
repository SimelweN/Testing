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

    // Courier Guy API integration
    const COURIER_GUY_API_KEY = Deno.env.get("COURIER_GUY_API_KEY");
    const COURIER_GUY_API_URL =
      Deno.env.get("COURIER_GUY_API_URL") || "https://api.courierguy.co.za";

    let trackingInfo = null;
    let isSimulated = false;

    if (!COURIER_GUY_API_KEY) {
      console.warn(
        "Courier Guy API key not configured, returning simulated tracking",
      );
      isSimulated = true;

      trackingInfo = {
        tracking_number,
        status: "in_transit",
        current_location: "Johannesburg Hub",
        estimated_delivery: new Date(
          Date.now() + 2 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        delivered_at: null,
        events: [
          {
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            status: "picked_up",
            description: "Package picked up from seller",
            location: "Collection Point",
          },
          {
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            status: "in_transit",
            description: "Package in transit to destination",
            location: "Johannesburg Hub",
          },
        ],
        provider: "courier-guy",
        simulated: true,
      };
    } else {
      try {
        const response = await fetch(
          `${COURIER_GUY_API_URL}/api/v1/track/${tracking_number}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${COURIER_GUY_API_KEY}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Courier Guy tracking API error: ${response.status}`);
        }

        const trackingData = await response.json();

        // Format tracking events
        const events =
          trackingData.tracking_events?.map((event: any) => ({
            timestamp: event.timestamp,
            status: event.status,
            description: event.description,
            location: event.location,
          })) || [];

        trackingInfo = {
          tracking_number,
          status: trackingData.status,
          current_location: trackingData.current_location,
          estimated_delivery: trackingData.estimated_delivery,
          delivered_at: trackingData.delivered_at,
          events,
          provider: "courier-guy",
        };
      } catch (apiError) {
        console.warn(
          "Courier Guy tracking API failed, returning simulated data:",
          apiError.message,
        );
        isSimulated = true;

        trackingInfo = {
          tracking_number,
          status: "in_transit",
          current_location: "Johannesburg Hub",
          estimated_delivery: new Date(
            Date.now() + 2 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          delivered_at: null,
          events: [
            {
              timestamp: new Date(
                Date.now() - 24 * 60 * 60 * 1000,
              ).toISOString(),
              status: "picked_up",
              description: "Package picked up from seller",
              location: "Collection Point",
            },
            {
              timestamp: new Date(
                Date.now() - 12 * 60 * 60 * 1000,
              ).toISOString(),
              status: "in_transit",
              description: "Package in transit to destination",
              location: "Johannesburg Hub",
            },
          ],
          provider: "courier-guy",
          simulated: true,
          api_error: apiError.message,
        };
      }
    }

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
    console.error("Courier Guy tracking error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to track Courier Guy shipment",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
