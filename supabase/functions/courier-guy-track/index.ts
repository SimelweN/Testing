import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const COURIER_GUY_API_KEY = Deno.env.get("COURIER_GUY_API_KEY");

    if (!COURIER_GUY_API_KEY) {
      throw new Error("Courier Guy API key not configured");
    }

    const url = new URL(req.url);
    const trackingId = url.pathname.split("/").pop();

    if (!trackingId) {
      throw new Error("Tracking ID is required");
    }

    console.log("Tracking shipment:", trackingId);

    const response = await fetch(
      `https://api.courierguy.co.za/v1/shipments/${trackingId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${COURIER_GUY_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Courier Guy tracking API error:", errorText);

      if (response.status === 404) {
        throw new Error("Shipment not found");
      }

      throw new Error(
        `Courier Guy API error: ${response.status} - ${errorText}`,
      );
    }

    const trackingData = await response.json();
    console.log("Tracking data received:", trackingData);

    return new Response(
      JSON.stringify({
        success: true,
        tracking: trackingData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error tracking shipment:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: error.message.includes("not found") ? 404 : 400,
      },
    );
  }
});
