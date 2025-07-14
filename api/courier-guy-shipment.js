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

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed. Use POST.",
    });
  }

  try {
    const body = await parseRequestBody(req);
    const {
      pickup_address,
      delivery_address,
      parcel,
      service_level,
      reference,
    } = body;

    // Validate required fields
    validateFields(body, ["pickup_address", "delivery_address", "parcel"]);

    logEvent("courier_guy_shipment_started", {
      pickup: pickup_address?.city,
      delivery: delivery_address?.city,
      reference,
    });

    // Get API key
    const apiKey = process.env.COURIER_GUY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "Courier Guy API key not configured",
      });
    }

    // Prepare Courier Guy shipment request
    const shipmentRequest = {
      collection_address: {
        type: "residential",
        company: pickup_address.name || "",
        street_address:
          pickup_address.street || pickup_address.streetAddress || "",
        local_area: pickup_address.suburb || "",
        city: pickup_address.city,
        zone: pickup_address.province || "",
        country: "ZA",
        code: pickup_address.postal_code || pickup_address.postalCode || "",
        contact: pickup_address.name || "",
        phone: pickup_address.phone || "",
        email: pickup_address.email || "",
      },
      delivery_address: {
        type: "residential",
        company: delivery_address.name || "",
        street_address:
          delivery_address.street || delivery_address.streetAddress || "",
        local_area: delivery_address.suburb || "",
        city: delivery_address.city,
        zone: delivery_address.province || "",
        country: "ZA",
        code: delivery_address.postal_code || delivery_address.postalCode || "",
        contact: delivery_address.name || "",
        phone: delivery_address.phone || "",
        email: delivery_address.email || "",
      },
      parcels: [
        {
          parcel_size: determineParcelSize(parcel),
          parcel_weight: parcel.weight || 0.5,
          submitted_length_cm: parcel.length || 25,
          submitted_width_cm: parcel.width || 20,
          submitted_height_cm: parcel.height || 5,
          submitted_weight_kg: parcel.weight || 0.5,
          parcel_description: parcel.description || "Textbook",
        },
      ],
      declared_value: parcel.value || 100,
      special_instructions_collection: "Handle with care - contains books",
      special_instructions_delivery: "Handle with care - contains books",
      custom_tracking_reference: reference || "",
      service_level: service_level || "standard",
      collection_date: getNextBusinessDay(),
    };

    logEvent("courier_guy_shipment_request", {
      reference,
      collection_date: shipmentRequest.collection_date,
    });

    // Call Courier Guy shipment API
    const response = await fetch("https://api.courierguy.co.za/v2/shipments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(shipmentRequest),
    });

    const result = await response.json();

    if (!response.ok) {
      logEvent("courier_guy_shipment_error", {
        status: response.status,
        error: result,
      });

      return res.status(response.status).json({
        success: false,
        error: result.message || "Courier Guy shipment API error",
        details: result,
      });
    }

    // Process the response
    const shipment = result.data || result;

    if (!shipment) {
      return res.status(400).json({
        success: false,
        error: "Failed to create shipment",
      });
    }

    // Format the response
    const formattedResponse = {
      success: true,
      waybill_number: shipment.waybill_number || shipment.tracking_number,
      tracking_number: shipment.waybill_number || shipment.tracking_number,
      pickup_date: shipment.collection_date || getNextBusinessDay(),
      pickup_time_window: "09:00 - 17:00",
      estimated_delivery:
        shipment.estimated_delivery_date || getEstimatedDelivery(),
      cost: parseFloat(shipment.total_cost || shipment.cost || 0),
      currency: "ZAR",
      label_url: shipment.label_url || shipment.waybill_url,
      courier_provider: "courier-guy",
      service_level: service_level || "standard",
      raw_response: result,
    };

    logEvent("courier_guy_shipment_success", {
      waybill_number: formattedResponse.waybill_number,
      pickup_date: formattedResponse.pickup_date,
      cost: formattedResponse.cost,
    });

    return res.status(200).json(formattedResponse);
  } catch (error) {
    logEvent("courier_guy_shipment_error", {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create Courier Guy shipment",
    });
  }
}

// Helper functions
function determineParcelSize(parcel) {
  const weight = parcel.weight || 0.5;
  const length = parcel.length || 25;
  const width = parcel.width || 20;
  const height = parcel.height || 5;

  const volume = length * width * height;

  if (weight <= 1 && volume <= 10000) return 1;
  if (weight <= 5 && volume <= 50000) return 2;
  if (weight <= 10 && volume <= 100000) return 3;
  return 4;
}

function getNextBusinessDay() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // If tomorrow is weekend, move to Monday
  const dayOfWeek = tomorrow.getDay();
  if (dayOfWeek === 0) {
    // Sunday
    tomorrow.setDate(tomorrow.getDate() + 1);
  } else if (dayOfWeek === 6) {
    // Saturday
    tomorrow.setDate(tomorrow.getDate() + 2);
  }

  return tomorrow.toISOString().split("T")[0];
}

function getEstimatedDelivery() {
  const delivery = new Date();
  delivery.setDate(delivery.getDate() + 3); // 3 business days
  return delivery.toISOString().split("T")[0];
}
