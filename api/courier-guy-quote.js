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
    const { pickup_address, delivery_address, parcel } = body;

    // Validate required fields
    validateFields(body, ["pickup_address", "delivery_address", "parcel"]);

    logEvent("courier_guy_quote_started", {
      pickup: pickup_address?.city,
      delivery: delivery_address?.city,
    });

    // Validate addresses
    if (!pickup_address?.city || !delivery_address?.city) {
      return res.status(400).json({
        success: false,
        error: "Missing required address fields",
      });
    }

    // Get API key
    const apiKey = process.env.COURIER_GUY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "Courier Guy API key not configured",
      });
    }

    // Prepare Courier Guy API request
    const courierGuyRequest = {
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
        },
      ],
      declared_value: parcel.value || 100,
      special_instructions_collection: "",
      special_instructions_delivery: "",
      custom_tracking_reference: parcel.reference || "",
      service_level: parcel.service_level || "standard",
    };

    logEvent("courier_guy_api_request", { request: courierGuyRequest });

    // Call Courier Guy API
    const response = await fetch("https://api.courierguy.co.za/v2/quotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(courierGuyRequest),
    });

    const result = await response.json();

    if (!response.ok) {
      logEvent("courier_guy_api_error", {
        status: response.status,
        error: result,
      });

      return res.status(response.status).json({
        success: false,
        error: result.message || "Courier Guy API error",
        details: result,
      });
    }

    // Process the response
    const quotes = result.data || result;

    if (!quotes || quotes.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No quotes available for this route",
      });
    }

    // Format the response
    const formattedQuotes = quotes.map((quote) => ({
      service: quote.service_type || "standard",
      price: parseFloat(quote.total_cost || quote.cost || 0),
      currency: "ZAR",
      estimated_delivery_days: quote.estimated_delivery_days || 2,
      service_level: quote.service_level || "standard",
      collection_time: quote.collection_time || "Next business day",
      provider: "courier-guy",
    }));

    logEvent("courier_guy_quote_success", {
      quotes_count: formattedQuotes.length,
      cheapest_price: Math.min(...formattedQuotes.map((q) => q.price)),
    });

    return res.status(200).json({
      success: true,
      quotes: formattedQuotes,
      provider: "courier-guy",
      raw_response: result,
    });
  } catch (error) {
    logEvent("courier_guy_quote_error", {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to get Courier Guy quote",
    });
  }
}

// Helper function to determine parcel size
function determineParcelSize(parcel) {
  const weight = parcel.weight || 0.5;
  const length = parcel.length || 25;
  const width = parcel.width || 20;
  const height = parcel.height || 5;

  // Calculate volume in cubic cm
  const volume = length * width * height;

  if (weight <= 1 && volume <= 10000) return 1; // Small
  if (weight <= 5 && volume <= 50000) return 2; // Medium
  if (weight <= 10 && volume <= 100000) return 3; // Large
  return 4; // Extra Large
}
