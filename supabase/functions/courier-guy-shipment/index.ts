import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  createSupabaseClient,
  createErrorResponse,
  createSuccessResponse,
  handleCORSPreflight,
  validateRequiredFields,
  parseRequestBody,
  logFunction,
} from "../_shared/utils.ts";
import { validateSupabaseConfig } from "../_shared/config.ts";
import { isDevelopmentMode, createMockResponse } from "../_shared/dev-mode.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCORSPreflight(req);
  if (corsResponse) return corsResponse;

  try {
    logFunction("courier-guy-shipment", "Processing shipment request");

    validateSupabaseConfig();

    const requestData = await parseRequestBody(req);
    validateRequiredFields(requestData, ["order_id"]);

    const {
      order_id,
      service_code = "STD",
      pickup_address,
      delivery_address,
      weight = 1.5,
      dimensions,
      reference,
    } = requestData;

    // Courier Guy API integration
    const COURIER_GUY_API_KEY = Deno.env.get("COURIER_GUY_API_KEY");

    // Return mock response in development mode or if no API key
    if (!COURIER_GUY_API_KEY || isDevelopmentMode()) {
      logFunction(
        "courier-guy-shipment",
        "Using mock response (no API key or development mode)",
      );
      const mockResponse = createMockResponse("courier", "shipment");
      return createSuccessResponse(mockResponse);
    }

    const supabase = createSupabaseClient();
    const COURIER_GUY_API_URL =
      Deno.env.get("COURIER_GUY_API_URL") || "https://api.courierguy.co.za";

    const shipmentRequest = {
      service_code,
      reference: reference || `ORDER-${order_id}`,
      collection_details: {
        company_name: pickup_address.company || "ReBooked Solutions",
        contact_name: pickup_address.name,
        phone: pickup_address.phone,
        email: pickup_address.email,
        address_line_1: pickup_address.address_line_1,
        suburb: pickup_address.suburb,
        postal_code: pickup_address.postal_code,
        province: pickup_address.province,
      },
      delivery_details: {
        company_name: delivery_address.company || "",
        contact_name: delivery_address.name,
        phone: delivery_address.phone,
        email: delivery_address.email,
        address_line_1: delivery_address.address_line_1,
        suburb: delivery_address.suburb,
        postal_code: delivery_address.postal_code,
        province: delivery_address.province,
      },
      parcel_details: {
        weight_kg: weight,
        length_cm: dimensions?.length || 30,
        width_cm: dimensions?.width || 20,
        height_cm: dimensions?.height || 10,
        description: "Textbook",
      },
    };

    const response = await fetch(`${COURIER_GUY_API_URL}/api/v1/shipments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${COURIER_GUY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(shipmentRequest),
    });

    if (!response.ok) {
      throw new Error(`Courier Guy API error: ${response.status}`);
    }

    const shipmentData = await response.json();

    // Update order with tracking information
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        tracking_number: shipmentData.tracking_number,
        courier_reference: shipmentData.shipment_id,
        courier_service: "courier-guy",
        status: "shipped",
        shipped_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    if (updateError) {
      console.error("Failed to update order:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        tracking_number: shipmentData.tracking_number,
        shipment_id: shipmentData.shipment_id,
        label_url: shipmentData.label_url,
        estimated_delivery: shipmentData.estimated_delivery,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Courier Guy shipment error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to create Courier Guy shipment",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
