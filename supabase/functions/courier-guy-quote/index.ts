import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { parseRequestBody } from "../_shared/safe-body-parser.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const bodyResult = await parseRequestBody(req, corsHeaders);
    if (!bodyResult.success) {
      return bodyResult.errorResponse!;
    }
    const {
      fromAddress,
      toAddress,
      weight,
      dimensions,
      serviceType = "standard",
    } = bodyResult.data;

    if (!fromAddress || !toAddress || !weight) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: fromAddress, toAddress, weight",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Courier Guy API integration
    const COURIER_GUY_API_KEY = Deno.env.get("COURIER_GUY_API_KEY");
    const COURIER_GUY_API_URL =
      Deno.env.get("COURIER_GUY_API_URL") || "https://api.courierguy.co.za";

    // If API key is not configured, return fallback quote
    if (!COURIER_GUY_API_KEY) {
      console.warn(
        "Courier Guy API key not configured, returning fallback quote",
      );
      return new Response(
        JSON.stringify({
          success: true,
          quotes: [
            {
              service_name: "Standard Delivery",
              price: 105,
              estimated_days: 3,
              service_code: "STANDARD",
              courier: "courier-guy",
            },
          ],
          provider: "courier-guy",
          fallback: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const quoteRequest = {
      collection_address: {
        suburb: fromAddress.suburb || "Unknown",
        postal_code: fromAddress.postal_code || "0001",
        province: fromAddress.province || "Gauteng",
      },
      delivery_address: {
        suburb: toAddress.suburb || "Unknown",
        postal_code: toAddress.postal_code || "0001",
        province: toAddress.province || "Gauteng",
      },
      parcel_details: {
        weight_kg: weight || 1,
        length_cm: dimensions?.length || 30,
        width_cm: dimensions?.width || 20,
        height_cm: dimensions?.height || 10,
      },
      service_type: serviceType,
    };

    try {
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
          service_name: service.service_name || "Standard Delivery",
          price: parseFloat(service.price) || 95.0,
          estimated_days: service.transit_days || 3,
          service_code: service.service_code || "STANDARD",
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
    } catch (apiError) {
      console.warn(
        "Courier Guy API request failed, returning fallback quote:",
        apiError.message,
      );

      // Return fallback quote when API fails
      return new Response(
        JSON.stringify({
          success: true,
          quotes: [
            {
              service_name: "Standard Delivery",
              price: 95.0,
              estimated_days: 3,
              service_code: "STANDARD",
              courier: "courier-guy",
            },
          ],
          provider: "courier-guy",
          fallback: true,
          api_error: apiError.message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  } catch (error) {
        console.error("Courier Guy quote error:", error?.message || error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message :
               typeof error === "string" ? error :
               "Failed to get Courier Guy quote",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
