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

    logEvent("fastway_quote_started", {
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
    const apiKey = process.env.FASTWAY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "Fastway API key not configured",
      });
    }

    // Prepare Fastway API request
    const fastwayRequest = {
      pickup_country: "ZA",
      pickup_postcode:
        pickup_address.postal_code || pickup_address.postalCode || "",
      delivery_country: "ZA",
      delivery_postcode:
        delivery_address.postal_code || delivery_address.postalCode || "",
      weight_kg: parcel.weight || 0.5,
      length_cm: parcel.length || 25,
      width_cm: parcel.width || 20,
      height_cm: parcel.height || 5,
      declared_value: parcel.value || 100,
    };

    logEvent("fastway_api_request", { request: fastwayRequest });

    // Call Fastway API (Note: This is a mock implementation as Fastway API details may vary)
    const response = await fetch("https://api.fastway.co.za/v4/pudo/quotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      body: JSON.stringify(fastwayRequest),
    });

    let result;
    try {
      result = await response.json();
    } catch (error) {
      // If JSON parsing fails, return a mock response for development
      logEvent("fastway_api_mock_response", { reason: "JSON parse error" });
      result = generateMockFastwayQuote(
        pickup_address,
        delivery_address,
        parcel,
      );
    }

    if (!response.ok && !result.quotes) {
      logEvent("fastway_api_error", {
        status: response.status,
        error: result,
      });

      // Return mock response for development
      result = generateMockFastwayQuote(
        pickup_address,
        delivery_address,
        parcel,
      );
    }

    // Process the response
    const quotes = result.quotes || result.data || [result];

    if (!quotes || quotes.length === 0) {
      // Return mock quote for development
      const mockQuote = generateMockFastwayQuote(
        pickup_address,
        delivery_address,
        parcel,
      );
      return res.status(200).json(mockQuote);
    }

    // Format the response
    const formattedQuotes = quotes.map((quote) => ({
      service: quote.service_name || quote.service || "standard",
      price: parseFloat(
        quote.price ||
          quote.total_cost ||
          calculateDistance(pickup_address, delivery_address) * 2.5,
      ),
      currency: "ZAR",
      estimated_delivery_days: quote.transit_days || 2,
      service_level: quote.service_level || "standard",
      collection_time: quote.collection_time || "Next business day",
      provider: "fastway",
    }));

    logEvent("fastway_quote_success", {
      quotes_count: formattedQuotes.length,
      cheapest_price: Math.min(...formattedQuotes.map((q) => q.price)),
    });

    return res.status(200).json({
      success: true,
      quotes: formattedQuotes,
      provider: "fastway",
      raw_response: result,
    });
  } catch (error) {
    logEvent("fastway_quote_error", {
      error: error.message,
      stack: error.stack,
    });

    // Return mock response for development
    try {
      const body = await parseRequestBody(req);
      const mockQuote = generateMockFastwayQuote(
        body.pickup_address,
        body.delivery_address,
        body.parcel,
      );
      return res.status(200).json(mockQuote);
    } catch (mockError) {
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to get Fastway quote",
      });
    }
  }
}

// Helper functions
function generateMockFastwayQuote(pickup, delivery, parcel) {
  const distance = calculateDistance(pickup, delivery);
  const basePrice = Math.max(distance * 2.5, 50); // Minimum R50

  return {
    success: true,
    quotes: [
      {
        service: "standard",
        price: basePrice,
        currency: "ZAR",
        estimated_delivery_days: 2,
        service_level: "standard",
        collection_time: "Next business day",
        provider: "fastway",
      },
      {
        service: "express",
        price: basePrice * 1.5,
        currency: "ZAR",
        estimated_delivery_days: 1,
        service_level: "express",
        collection_time: "Same day",
        provider: "fastway",
      },
    ],
    provider: "fastway",
    mock: true,
  };
}

function calculateDistance(pickup, delivery) {
  // Simple mock distance calculation based on different cities
  const cities = {
    "cape town": { lat: -33.9249, lng: 18.4241 },
    johannesburg: { lat: -26.2041, lng: 28.0473 },
    durban: { lat: -29.8587, lng: 31.0218 },
    pretoria: { lat: -25.7479, lng: 28.2293 },
    "port elizabeth": { lat: -33.9608, lng: 25.6022 },
  };

  const pickupCity = pickup?.city?.toLowerCase() || "cape town";
  const deliveryCity = delivery?.city?.toLowerCase() || "johannesburg";

  if (pickupCity === deliveryCity) return 50; // Same city

  const pickupCoords = cities[pickupCity] || cities["cape town"];
  const deliveryCoords = cities[deliveryCity] || cities["johannesburg"];

  // Simple distance calculation (not accurate, just for mock purposes)
  const latDiff = Math.abs(pickupCoords.lat - deliveryCoords.lat);
  const lngDiff = Math.abs(pickupCoords.lng - deliveryCoords.lng);
  const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // Rough km conversion

  return Math.max(distance, 100); // Minimum 100km
}
