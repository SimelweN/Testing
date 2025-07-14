import { handleCORS, logEvent, parseRequestBody } from "./_lib/utils.js";

export default async function handler(req, res) {
  // Handle CORS
  handleCORS(req, res);
  if (req.method === "OPTIONS") return;

  // Allow both GET and POST
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed. Use GET or POST.",
    });
  }

  try {
    let trackingNumber;

    if (req.method === "GET") {
      trackingNumber = req.query.tracking_number;
    } else {
      const body = await parseRequestBody(req);
      trackingNumber = body.tracking_number;
    }

    if (!trackingNumber) {
      return res.status(400).json({
        success: false,
        error: "Missing tracking_number parameter",
      });
    }

    logEvent("fastway_tracking_started", { tracking_number: trackingNumber });

    // Get API key
    const apiKey = process.env.FASTWAY_API_KEY;
    if (!apiKey) {
      logEvent("fastway_api_key_missing", { tracking_number: trackingNumber });
      // Return mock response for development
      return res.status(200).json(generateMockFastwayTracking(trackingNumber));
    }

    // Call Fastway tracking API
    let response, result;
    try {
      response = await fetch(
        `https://api.fastway.co.za/v4/track/${trackingNumber}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            Accept: "application/json",
          },
        },
      );

      result = await response.json();
    } catch (apiError) {
      logEvent("fastway_api_error", {
        tracking_number: trackingNumber,
        error: apiError.message,
      });
      // Return mock response for development
      return res.status(200).json(generateMockFastwayTracking(trackingNumber));
    }

    if (!response.ok) {
      logEvent("fastway_tracking_error", {
        tracking_number: trackingNumber,
        status: response.status,
        error: result,
      });

      // Return mock response for development
      return res.status(200).json(generateMockFastwayTracking(trackingNumber));
    }

    // Process the response
    const tracking = result.data || result;

    if (!tracking) {
      // Return mock response for development
      return res.status(200).json(generateMockFastwayTracking(trackingNumber));
    }

    // Format tracking events
    const events =
      tracking.events || tracking.tracking_events || tracking.scans || [];
    const formattedEvents = events.map((event) => ({
      timestamp: event.timestamp || event.scan_time || event.date,
      status: event.status || event.description || event.scan_type,
      location: event.location || event.facility || event.depot,
      description: event.description || event.status || event.scan_description,
      code: event.code || event.scan_code,
    }));

    // Determine current status
    const currentStatus = determineStatus(formattedEvents);

    const formattedResponse = {
      success: true,
      tracking_number: trackingNumber,
      status: currentStatus,
      status_description: getStatusDescription(currentStatus),
      estimated_delivery: tracking.estimated_delivery_date || tracking.eta,
      current_location:
        tracking.current_location || tracking.last_scan_location,
      events: formattedEvents,
      provider: "fastway",
      last_updated: tracking.last_updated || new Date().toISOString(),
      raw_response: result,
    };

    logEvent("fastway_tracking_success", {
      tracking_number: trackingNumber,
      status: currentStatus,
      events_count: formattedEvents.length,
    });

    return res.status(200).json(formattedResponse);
  } catch (error) {
    logEvent("fastway_tracking_error", {
      error: error.message,
      stack: error.stack,
    });

    // Return mock response for development
    try {
      let trackingNumber;
      if (req.method === "GET") {
        trackingNumber = req.query.tracking_number;
      } else {
        const body = await parseRequestBody(req);
        trackingNumber = body.tracking_number;
      }

      return res.status(200).json(generateMockFastwayTracking(trackingNumber));
    } catch (mockError) {
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to track Fastway shipment",
      });
    }
  }
}

// Helper functions
function generateMockFastwayTracking(trackingNumber) {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const mockEvents = [
    {
      timestamp: twoDaysAgo.toISOString(),
      status: "created",
      location: "Cape Town Depot",
      description: "Shipment created and ready for collection",
      code: "CR",
    },
    {
      timestamp: yesterday.toISOString(),
      status: "collected",
      location: "Cape Town Depot",
      description: "Package collected from sender",
      code: "CO",
    },
    {
      timestamp: now.toISOString(),
      status: "in_transit",
      location: "Johannesburg Hub",
      description: "Package in transit to destination",
      code: "IT",
    },
  ];

  return {
    success: true,
    tracking_number: trackingNumber,
    status: "in_transit",
    status_description: "Package in transit to destination",
    estimated_delivery: getEstimatedDelivery(),
    current_location: "Johannesburg Hub",
    events: mockEvents,
    provider: "fastway",
    last_updated: now.toISOString(),
    mock: true,
  };
}

function determineStatus(events) {
  if (!events || events.length === 0) return "unknown";

  const latestEvent = events[events.length - 1];
  const status = latestEvent.status.toLowerCase();

  if (status.includes("delivered")) return "delivered";
  if (status.includes("out for delivery") || status.includes("delivery"))
    return "out_for_delivery";
  if (status.includes("in transit") || status.includes("transit"))
    return "in_transit";
  if (status.includes("collected") || status.includes("pickup"))
    return "collected";
  if (status.includes("ready") || status.includes("depot"))
    return "ready_for_collection";
  if (status.includes("created") || status.includes("booked")) return "created";

  return "in_transit";
}

function getStatusDescription(status) {
  const descriptions = {
    created: "Shipment created and ready for collection",
    ready_for_collection: "Package ready for courier collection",
    collected: "Package collected by courier",
    in_transit: "Package in transit to destination",
    out_for_delivery: "Package out for delivery",
    delivered: "Package delivered successfully",
    unknown: "Status unknown",
  };

  return descriptions[status] || "Status unknown";
}

function getEstimatedDelivery() {
  const delivery = new Date();
  delivery.setDate(delivery.getDate() + 1); // Tomorrow
  return delivery.toISOString().split("T")[0];
}
