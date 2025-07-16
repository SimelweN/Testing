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
    logFunction("courier-guy-quote", "Processing quote request");

    const requestData = await parseRequestBody(req);
    validateRequiredFields(requestData, ["fromAddress", "toAddress"]);

    const {
      fromAddress,
      toAddress,
      weight = 1, // Default weight for testing
      dimensions,
      serviceType = "standard",
    } = requestData;

    // Courier Guy API integration
    const COURIER_GUY_API_KEY = Deno.env.get("COURIER_GUY_API_KEY");
    const COURIER_GUY_API_URL =
      Deno.env.get("COURIER_GUY_API_URL") || "https://api.courierguy.co.za";

    // Return mock response in development mode if API key is not configured
    if (!COURIER_GUY_API_KEY) {
      if (isDevelopmentMode()) {
        logFunction("courier-guy-quote", "Using mock response (no API key)");
        const mockResponse = createMockResponse("courier", "quote");
        return createSuccessResponse(mockResponse);
      } else {
        return createErrorResponse("Courier Guy API key not configured", 500);
      }
    }

    const quoteRequest = {
      collection_address: {
        suburb: fromAddress.suburb,
        postal_code: fromAddress.postal_code,
        province: fromAddress.province,
      },
      delivery_address: {
        suburb: toAddress.suburb,
        postal_code: toAddress.postal_code,
        province: toAddress.province,
      },
      parcel_details: {
        weight_kg: weight,
        length_cm: dimensions?.length || 30,
        width_cm: dimensions?.width || 20,
        height_cm: dimensions?.height || 10,
      },
      service_type: serviceType,
    };

    const response = await fetch(`${COURIER_GUY_API_URL}/api/v1/quote`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${COURIER_GUY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(quoteRequest),
    });

    if (!response.ok) {
      throw new Error(`Courier Guy API error: ${response.status}`);
    }

    const quoteData = await response.json();

    // Format the response for our system
    const quotes =
      quoteData.services?.map((service: any) => ({
        service_name: service.service_name,
        price: parseFloat(service.price),
        estimated_days: service.transit_days,
        service_code: service.service_code,
        courier: "courier-guy",
      })) || [];

    return new Response(
      JSON.stringify({
        success: true,
        quotes,
        provider: "courier-guy",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Courier Guy quote error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to get Courier Guy quote",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
