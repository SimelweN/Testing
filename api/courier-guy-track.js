import {
  handleCORS,
  validateFields,
  logEvent,
  parseRequestBody,
} from "./_lib/utils.js";

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

    logEvent("courier_guy_tracking_started", {
      tracking_number: trackingNumber,
    });

    // Get API key
    const apiKey = process.env.COURIER_GUY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "Courier Guy API key not configured",
      });
    }

    // Call Courier Guy tracking API
    const response = await fetch(
      `https://api.courierguy.co.za/v2/track/${trackingNumber}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    const result = await response.json();

    if (!response.ok) {
      logEvent("courier_guy_tracking_error", {
        tracking_number: trackingNumber,
        status: response.status,
        error: result,
      });

      return res.status(response.status).json({
        success: false,
        error: result.message || "Courier Guy tracking API error",
        details: result,
      });
    }

    // Process the response
    const tracking = result.data || result;

    if (!tracking) {
      return res.status(404).json({
        success: false,
        error: "Tracking information not found",
      });
    }

    // Format tracking events
    const events = tracking.events || tracking.tracking_events || [];
    const formattedEvents = events.map((event) => ({
      timestamp: event.timestamp || event.date,
      status: event.status || event.description,
      location: event.location || event.facility,
      description: event.description || event.status,
      code: event.code || event.status_code,
    }));

    // Determine current status
    const currentStatus = determineStatus(formattedEvents);

    const formattedResponse = {
      success: true,
      tracking_number: trackingNumber,
      status: currentStatus,
      status_description: getStatusDescription(currentStatus),
      estimated_delivery: tracking.estimated_delivery_date,
      current_location: tracking.current_location || tracking.last_location,
      events: formattedEvents,
      provider: "courier-guy",
      last_updated: tracking.last_updated || new Date().toISOString(),
      raw_response: result,
    };

    logEvent("courier_guy_tracking_success", {
      tracking_number: trackingNumber,
      status: currentStatus,
      events_count: formattedEvents.length,
    });

    return res.status(200).json(formattedResponse);
  } catch (error) {
    logEvent("courier_guy_tracking_error", {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to track Courier Guy shipment",
    });
  }
}

// Helper functions
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
