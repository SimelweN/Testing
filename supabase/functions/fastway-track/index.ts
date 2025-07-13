import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FastwayTrackingEvent {
  timestamp: string;
  status: string;
  location: string;
  description: string;
  signature?: string;
}

interface FastwayTrackingResponse {
  tracking_number: string;
  status:
    | "pending"
    | "collected"
    | "in_transit"
    | "out_for_delivery"
    | "delivered"
    | "failed";
  current_location?: string;
  estimated_delivery: string;
  actual_delivery?: string;
  events: FastwayTrackingEvent[];
  recipient_signature?: string;
  proof_of_delivery?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Fastway Tracking API called");

    const requestData = await req.json();
    const trackingNumber = requestData.tracking_number;

    if (!trackingNumber) {
      return new Response(
        JSON.stringify({ error: "Missing tracking_number" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("Tracking request for:", trackingNumber);

    // Get Fastway API credentials
    const fastwayApiKey = Deno.env.get("FASTWAY_API_KEY");
    const fastwayApiUrl =
      Deno.env.get("FASTWAY_API_URL") || "https://api.fastway.org/v2";

    if (!fastwayApiKey) {
      console.error("Fastway API key not configured");

      // Return mock tracking for development
      const mockTracking = generateMockTracking(trackingNumber);
      return new Response(JSON.stringify({ tracking: mockTracking }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Calling Fastway Tracking API for:", trackingNumber);

    // Call Fastway tracking API
    const fastwayResponse = await fetch(
      `${fastwayApiUrl}/tracking/${trackingNumber}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${fastwayApiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!fastwayResponse.ok) {
      console.error(
        "Fastway Tracking API error:",
        fastwayResponse.status,
        await fastwayResponse.text(),
      );

      // Return mock tracking on API error for development
      const mockTracking = generateMockTracking(trackingNumber);
      return new Response(
        JSON.stringify({
          tracking: mockTracking,
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
    console.log("Fastway Tracking API response:", fastwayData);

    // Transform response to our format
    const tracking: FastwayTrackingResponse = {
      tracking_number: trackingNumber,
      status: mapFastwayStatus(fastwayData.status),
      current_location: fastwayData.current_location,
      estimated_delivery:
        fastwayData.estimated_delivery_date || calculateEstimatedDelivery(),
      actual_delivery: fastwayData.actual_delivery_date,
      events: (fastwayData.tracking_events || []).map((event: any) => ({
        timestamp: event.timestamp || event.date_time,
        status: event.status || event.event_code,
        location: event.location || event.depot_name,
        description: event.description || event.event_description,
        signature: event.signature,
      })),
      recipient_signature: fastwayData.signature,
      proof_of_delivery: fastwayData.proof_of_delivery_url,
    };

    return new Response(JSON.stringify({ tracking }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in fastway-track function:", error);

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function mapFastwayStatus(status: string): FastwayTrackingResponse["status"] {
  switch (status?.toLowerCase()) {
    case "created":
    case "booked":
    case "pending":
      return "pending";
    case "collected":
    case "picked_up":
      return "collected";
    case "in_transit":
    case "in_delivery":
      return "in_transit";
    case "out_for_delivery":
    case "with_courier":
      return "out_for_delivery";
    case "delivered":
    case "signed":
      return "delivered";
    case "failed":
    case "exception":
    case "returned":
      return "failed";
    default:
      return "pending";
  }
}

function calculateEstimatedDelivery(): string {
  const today = new Date();
  const estimatedDelivery = new Date(today);
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 2);

  // Skip weekends
  while (estimatedDelivery.getDay() === 0 || estimatedDelivery.getDay() === 6) {
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 1);
  }

  return estimatedDelivery.toISOString();
}

function generateMockTracking(trackingNumber: string): FastwayTrackingResponse {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  return {
    tracking_number: trackingNumber,
    status: "in_transit",
    current_location: "Johannesburg Depot",
    estimated_delivery: calculateEstimatedDelivery(),
    events: [
      {
        timestamp: twoDaysAgo.toISOString(),
        status: "collected",
        location: "Cape Town Depot",
        description: "Parcel collected from sender",
      },
      {
        timestamp: yesterday.toISOString(),
        status: "in_transit",
        location: "Johannesburg Hub",
        description: "Parcel in transit to destination",
      },
      {
        timestamp: now.toISOString(),
        status: "in_transit",
        location: "Johannesburg Depot",
        description: "Parcel arrived at local depot",
      },
    ],
  };
}
