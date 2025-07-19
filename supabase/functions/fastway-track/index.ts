import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { tracking_number } = await req.json();

    // Enhanced validation with specific error messages
    if (!tracking_number) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "VALIDATION_FAILED",
          details: {
            missing_fields: ["tracking_number"],
            provided_fields: Object.keys(await req.json()),
            message: "tracking_number is required",
          },
          fix_instructions:
            "Provide tracking_number (string) - the Fastway tracking number to look up",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate tracking number format (basic validation)
    if (
      typeof tracking_number !== "string" ||
      tracking_number.trim().length < 3
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_TRACKING_NUMBER_FORMAT",
          details: {
            provided_tracking_number: tracking_number,
            tracking_number_type: typeof tracking_number,
            message:
              "Tracking number must be a valid string with at least 3 characters",
          },
          fix_instructions:
            "Provide a valid Fastway tracking number (e.g., 'FW123456789' or similar format)",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Fastway API integration
    const FASTWAY_API_KEY = Deno.env.get("FASTWAY_API_KEY");

    let trackingInfo = null;
    let isSimulated = false;

    if (!FASTWAY_API_KEY) {
      console.warn(
        "Fastway API key not configured, returning simulated tracking",
      );
      isSimulated = true;

      trackingInfo = {
        tracking_number: tracking_number.trim(),
        status: "in_transit",
        current_location: "Cape Town Hub",
        estimated_delivery: new Date(
          Date.now() + 1 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        delivered_at: null,
        events: [
          {
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            status: "picked_up",
            description: "Package picked up from sender",
            location: "Origin Depot",
          },
          {
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            status: "in_transit",
            description: "Package in transit to destination hub",
            location: "Cape Town Hub",
          },
          {
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            status: "out_for_delivery",
            description: "Package out for delivery",
            location: "Local Delivery Hub",
          },
        ],
        provider: "fastway",
        simulated: true,
      };
    } else {
      try {
        const response = await fetch(
          `https://api.fastway.com.au/v3/track/${encodeURIComponent(tracking_number.trim())}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${FASTWAY_API_KEY}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          const errorText = await response.text();

          if (response.status === 404) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "TRACKING_NUMBER_NOT_FOUND",
                details: {
                  tracking_number: tracking_number.trim(),
                  api_status: response.status,
                  api_response: errorText,
                  message: "Tracking number not found in Fastway system",
                },
                fix_instructions:
                  "Verify the tracking number is correct and was issued by Fastway. Numbers may take time to appear in the system after creation.",
              }),
              {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              },
            );
          }

          throw new Error(
            `Fastway tracking API error: HTTP ${response.status} - ${errorText}`,
          );
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

        trackingInfo = {
          tracking_number: tracking_number.trim(),
          status: trackingData.status,
          current_location: trackingData.current_location,
          estimated_delivery: trackingData.estimated_delivery,
          delivered_at: trackingData.delivered_at,
          events,
          provider: "fastway",
        };
      } catch (apiError) {
        console.warn(
          "Fastway tracking API failed, returning simulated data:",
          apiError.message,
        );

        // Return simulated data with API error info
        isSimulated = true;
        trackingInfo = {
          tracking_number: tracking_number.trim(),
          status: "in_transit",
          current_location: "Cape Town Hub",
          estimated_delivery: new Date(
            Date.now() + 1 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          delivered_at: null,
          events: [
            {
              timestamp: new Date(
                Date.now() - 24 * 60 * 60 * 1000,
              ).toISOString(),
              status: "picked_up",
              description: "Package picked up from sender",
              location: "Origin Depot",
            },
            {
              timestamp: new Date(
                Date.now() - 12 * 60 * 60 * 1000,
              ).toISOString(),
              status: "in_transit",
              description: "Package in transit to destination hub",
              location: "Cape Town Hub",
            },
            {
              timestamp: new Date(
                Date.now() - 2 * 60 * 60 * 1000,
              ).toISOString(),
              status: "out_for_delivery",
              description: "Package out for delivery",
              location: "Local Delivery Hub",
            },
          ],
          provider: "fastway",
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
    console.error("Fastway tracking error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "UNEXPECTED_ERROR",
        details: {
          error_message: error.message,
          error_stack: error.stack,
          error_type: error.constructor.name,
          timestamp: new Date().toISOString(),
        },
        fix_instructions:
          "This is an unexpected server error. Check the server logs for more details and contact support if the issue persists.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
