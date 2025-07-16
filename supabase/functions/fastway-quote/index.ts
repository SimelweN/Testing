import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  createErrorResponse,
  createSuccessResponse,
  handleCORSPreflight,
  validateRequiredFields,
  parseRequestBody,
  logFunction,
} from "../_shared/utils.ts";
import { isDevelopmentMode, createMockResponse } from "../_shared/dev-mode.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCORSPreflight(req);
  if (corsResponse) return corsResponse;

  try {
    logFunction("fastway-quote", "Processing quote request");

    const requestData = await parseRequestBody(req);
    validateRequiredFields(requestData, ["fromAddress", "toAddress"]);

    const {
      fromAddress,
      toAddress,
      weight = 1, // Default weight for testing
      dimensions,
      serviceType = "standard",
    } = requestData;

    // Fastway API integration
    const FASTWAY_API_KEY = Deno.env.get("FASTWAY_API_KEY");

    // Return mock response in development mode if API key is not configured
    if (!FASTWAY_API_KEY) {
      if (isDevelopmentMode()) {
        logFunction("fastway-quote", "Using mock response (no API key)");
        const mockResponse = createMockResponse("fastway", "quote");
        return createSuccessResponse(mockResponse);
      } else {
        return createErrorResponse("Fastway API key not configured", 500);
      }
    }

    const quoteRequest = {
      from_suburb: fromAddress.suburb,
      from_postcode: fromAddress.postal_code,
      to_suburb: toAddress.suburb,
      to_postcode: toAddress.postal_code,
      weight_kg: weight,
      length_cm: dimensions?.length || 30,
      width_cm: dimensions?.width || 20,
      height_cm: dimensions?.height || 10,
      service_type: serviceType,
    };

    const response = await fetch("https://api.fastway.com.au/v3/quote", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FASTWAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(quoteRequest),
    });

    if (!response.ok) {
      throw new Error(`Fastway API error: ${response.status}`);
    }

    const quoteData = await response.json();

    // Format the response for our system
    const quotes =
      quoteData.quotes?.map((quote: any) => ({
        service_name: quote.service_name,
        price: parseFloat(quote.price),
        estimated_days: quote.transit_days,
        service_code: quote.service_code,
        courier: "fastway",
      })) || [];

    return new Response(
      JSON.stringify({
        success: true,
        quotes,
        provider: "fastway",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Fastway quote error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to get Fastway quote",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
