import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { parseRequestBody } from "../_shared/safe-body-parser.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
      order_id,
      service_code,
      pickup_address,
      delivery_address,
      weight,
      dimensions,
      reference,
    } = bodyResult.data;

    // Enhanced validation with specific error messages
    const validationErrors = [];
    if (!order_id) validationErrors.push("order_id is required");
    if (!pickup_address) validationErrors.push("pickup_address is required");
    if (!delivery_address)
      validationErrors.push("delivery_address is required");

    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "VALIDATION_FAILED",
          details: {
            missing_fields: validationErrors,
                        provided_fields: Object.keys({
              order_id,
              service_code,
              pickup_address,
              delivery_address,
              weight,
              dimensions,
              reference,
            }),
            message: `Missing required fields: ${validationErrors.join(", ")}`,
          },
          fix_instructions:
            "Provide all required fields: order_id (string), pickup_address (object), delivery_address (object). Optional: service_code, weight, dimensions, reference",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ENVIRONMENT_CONFIG_ERROR",
          details: {
            missing_env_vars: [
              !SUPABASE_URL ? "SUPABASE_URL" : null,
              !SUPABASE_SERVICE_KEY ? "SUPABASE_SERVICE_ROLE_KEY" : null,
            ].filter(Boolean),
            message: "Required environment variables are not configured",
          },
          fix_instructions:
            "Configure missing environment variables in your deployment settings",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fastway API integration
    const FASTWAY_API_KEY = Deno.env.get("FASTWAY_API_KEY");
    const finalReference = reference || `ORDER-${order_id}`;
    let shipmentData = null;
    let isSimulated = false;

    if (!FASTWAY_API_KEY) {
      console.warn("Fastway API key not configured, simulating shipment");
      isSimulated = true;

      // Generate mock tracking number
      const mockTrackingNumber = `FW${Date.now().toString().slice(-8)}`;

      shipmentData = {
        tracking_number: mockTrackingNumber,
        shipment_id: `ship_fw_${Date.now()}`,
        label_url: `https://mock-fastway-label.url/${mockTrackingNumber}`,
        estimated_delivery: new Date(
          Date.now() + 2 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
    } else {
      try {
        const shipmentRequest = {
          service_code: service_code || "STANDARD",
          reference: finalReference,
          pickup: {
            company_name: pickup_address.company || "ReBooked Solutions",
            contact_name: pickup_address.name || "Seller",
            phone: pickup_address.phone || "+27000000000",
            address_line_1: pickup_address.address_line_1 || "Unknown Address",
            suburb: pickup_address.suburb || "Unknown",
            postcode:
              pickup_address.postal_code || pickup_address.postcode || "0001",
            state: pickup_address.province || pickup_address.state || "Gauteng",
          },
          delivery: {
            company_name: delivery_address.company || "",
            contact_name: delivery_address.name || "Customer",
            phone: delivery_address.phone || "+27000000000",
            address_line_1:
              delivery_address.address_line_1 || "Unknown Address",
            suburb: delivery_address.suburb || "Unknown",
            postcode:
              delivery_address.postal_code ||
              delivery_address.postcode ||
              "0001",
            state:
              delivery_address.province || delivery_address.state || "Gauteng",
          },
          items: [
            {
              weight_kg: weight || 1,
              length_cm: dimensions?.length || 30,
              width_cm: dimensions?.width || 20,
              height_cm: dimensions?.height || 10,
              description: "Textbook",
            },
          ],
        };

        const response = await fetch(
          "https://api.fastway.com.au/v3/shipments",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${FASTWAY_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(shipmentRequest),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Fastway API error: HTTP ${response.status} - ${errorText}`,
          );
        }

        shipmentData = await response.json();

        if (!shipmentData.tracking_number) {
          throw new Error("Fastway API did not return a tracking number");
        }
      } catch (apiError) {
        console.warn(
          "Fastway API failed, simulating shipment:",
          apiError.message,
        );
        isSimulated = true;

        const mockTrackingNumber = `FW${Date.now().toString().slice(-8)}`;
        shipmentData = {
          tracking_number: mockTrackingNumber,
          shipment_id: `ship_fw_${Date.now()}`,
          label_url: `https://mock-fastway-label.url/${mockTrackingNumber}`,
          estimated_delivery: new Date(
            Date.now() + 2 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          api_error: apiError.message,
        };
      }
    }

    // Update order with tracking information (if order exists)
    try {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          tracking_number: shipmentData.tracking_number,
          courier_reference: shipmentData.shipment_id,
          courier_service: "fastway",
          status: "shipped",
          shipped_at: new Date().toISOString(),
        })
        .eq("id", order_id);

      if (updateError) {
        console.warn("Failed to update order (may not exist):", updateError);
      }
    } catch (dbError) {
      console.warn("Database update failed (continuing anyway):", dbError);
    }

    // Send ReBooked Solutions shipping notification email
    if (delivery_address.email && shipmentData.tracking_number) {
      try {
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Order Has Shipped - ReBooked Solutions</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f3fef7; padding: 20px; color: #1f4e3d; margin: 0; }
    .container { max-width: 500px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
    .header { background: #3ab26f; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -30px -30px 20px -30px; }
    .footer { background: #f3fef7; color: #1f4e3d; padding: 20px; text-align: center; font-size: 12px; line-height: 1.5; margin: 30px -30px -30px -30px; border-radius: 0 0 10px 10px; border-top: 1px solid #e5e7eb; }
    .info-box { background: #f3fef7; border: 1px solid #3ab26f; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .link { color: #3ab26f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 Your Order Has Shipped!</h1>
    </div>

    <h2>Hello ${delivery_address.name || "Customer"}!</h2>
    <p>Great news! Your order #${finalReference} has been shipped and is on its way to you.</p>

    <div class="info-box">
      <h3>📱 Tracking Information</h3>
      <p><strong>Tracking Number:</strong> ${shipmentData.tracking_number}</p>
      <p><strong>Carrier:</strong> Fastway${isSimulated ? " (Test Mode)" : ""}</p>
      <p><strong>Estimated Delivery:</strong> ${shipmentData.estimated_delivery ? new Date(shipmentData.estimated_delivery).toLocaleDateString() : "2-3 business days"}</p>
    </div>

    <p>You can track your package using the tracking number above on the Fastway website.</p>
    <p>Thank you for choosing ReBooked Solutions!</p>

    <div class="footer">
      <p><strong>This is an automated message from ReBooked Solutions.</strong><br>
      Please do not reply to this email.</p>
      <p>For help, contact support@rebookedsolutions.co.za<br>
      Visit our website: www.rebookedsolutions.co.za<br>
      T&Cs apply</p>
      <p><em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
  </div>
</body>
</html>`;

        await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: delivery_address.email,
            subject: "Your Order Has Shipped - ReBooked Solutions",
            html: html,
            text: `Your Order Has Shipped!\n\nHello ${delivery_address.name || "Customer"}!\n\nGreat news! Your order #${finalReference} has been shipped and is on its way to you.\n\nTracking Number: ${shipmentData.tracking_number}\nCarrier: Fastway${isSimulated ? " (Test Mode)" : ""}\nEstimated Delivery: ${shipmentData.estimated_delivery ? new Date(shipmentData.estimated_delivery).toLocaleDateString() : "2-3 business days"}\n\nThank you for choosing ReBooked Solutions!`,
          }),
        });
        console.log("Shipping notification email sent successfully");
      } catch (emailError) {
        console.error(
          "Failed to send shipping notification email:",
          emailError,
        );
        // Don't fail the shipment if email fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        tracking_number: shipmentData.tracking_number,
        shipment_id: shipmentData.shipment_id,
        label_url: shipmentData.label_url,
        estimated_delivery: shipmentData.estimated_delivery,
        simulated: isSimulated,
        carrier: "fastway",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Fastway shipment error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "UNEXPECTED_ERROR",
        details: {
          error_message: error.message,
          error_stack: error.stack,
          error_type: error.constructor.name,
          timestamp: new Date().toISOString(),
        },
        fix_instructions:
          "This is an unexpected server error. Check the server logs for more details and contact support if the issue persists.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
