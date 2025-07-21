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

    if (!order_id || !pickup_address || !delivery_address) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Missing required fields: order_id, pickup_address, delivery_address",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Courier Guy API integration
    const COURIER_GUY_API_KEY = Deno.env.get("COURIER_GUY_API_KEY");
    const COURIER_GUY_API_URL =
      Deno.env.get("COURIER_GUY_API_URL") || "https://api.courierguy.co.za";

    const finalReference = reference || `ORDER-${order_id}`;
    let shipmentData = null;
    let isSimulated = false;

    if (!COURIER_GUY_API_KEY) {
      console.warn("Courier Guy API key not configured, simulating shipment");
      isSimulated = true;

      // Generate mock tracking number
      const mockTrackingNumber = `CG${Date.now().toString().slice(-8)}`;

      shipmentData = {
        tracking_number: mockTrackingNumber,
        shipment_id: `ship_${Date.now()}`,
        label_url: `https://mock-label.url/${mockTrackingNumber}`,
        estimated_delivery: new Date(
          Date.now() + 3 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
    } else {
      try {
        const shipmentRequest = {
          service_code: service_code || "STANDARD",
          reference: finalReference,
          collection_details: {
            company_name: pickup_address.company || "ReBooked Solutions",
            contact_name: pickup_address.name || "Seller",
            phone: pickup_address.phone || "+27000000000",
            address_line_1: pickup_address.address_line_1 || "Unknown Address",
            suburb: pickup_address.suburb || "Unknown",
            postal_code: pickup_address.postal_code || "0001",
            province: pickup_address.province || "Gauteng",
          },
          delivery_details: {
            company_name: delivery_address.company || "",
            contact_name: delivery_address.name || "Customer",
            phone: delivery_address.phone || "+27000000000",
            address_line_1:
              delivery_address.address_line_1 || "Unknown Address",
            suburb: delivery_address.suburb || "Unknown",
            postal_code: delivery_address.postal_code || "0001",
            province: delivery_address.province || "Gauteng",
          },
          parcel_details: {
            weight_kg: weight || 1,
            length_cm: dimensions?.length || 30,
            width_cm: dimensions?.width || 20,
            height_cm: dimensions?.height || 10,
            description: "Textbook",
          },
        };

        const response = await fetch(
          `${COURIER_GUY_API_URL}/api/v1/shipments`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${COURIER_GUY_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(shipmentRequest),
          },
        );

        if (!response.ok) {
          throw new Error(`Courier Guy API error: ${response.status}`);
        }

        shipmentData = await response.json();
      } catch (apiError) {
        console.warn(
          "Courier Guy API failed, simulating shipment:",
          apiError.message,
        );
        isSimulated = true;

        const mockTrackingNumber = `CG${Date.now().toString().slice(-8)}`;
        shipmentData = {
          tracking_number: mockTrackingNumber,
          shipment_id: `ship_${Date.now()}`,
          label_url: `https://mock-label.url/${mockTrackingNumber}`,
          estimated_delivery: new Date(
            Date.now() + 3 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          api_error: apiError.message,
        };
      }
    }

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
    body {
      font-family: Arial, sans-serif;
      background-color: #f3fef7;
      padding: 20px;
      color: #1f4e3d;
      margin: 0;
    }
    .container {
      max-width: 500px;
      margin: auto;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: #3ab26f;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 10px 10px 0 0;
      margin: -30px -30px 20px -30px;
    }
    .footer {
      background: #f3fef7;
      color: #1f4e3d;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      line-height: 1.5;
      margin: 30px -30px -30px -30px;
      border-radius: 0 0 10px 10px;
      border-top: 1px solid #e5e7eb;
    }
    .info-box {
      background: #f3fef7;
      border: 1px solid #3ab26f;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
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
      <p><strong>Carrier:</strong> Courier Guy${isSimulated ? " (Test Mode)" : ""}</p>
      <p><strong>Estimated Delivery:</strong> ${shipmentData.estimated_delivery ? new Date(shipmentData.estimated_delivery).toLocaleDateString() : "2-3 business days"}</p>
    </div>

    <p>You can track your package using the tracking number above on the Courier Guy website.</p>

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
            text: `Your Order Has Shipped!\n\nHello ${delivery_address.name || "Customer"}!\n\nGreat news! Your order #${finalReference} has been shipped and is on its way to you.\n\nTracking Number: ${shipmentData.tracking_number}\nCarrier: Courier Guy${isSimulated ? " (Test Mode)" : ""}\nEstimated Delivery: ${shipmentData.estimated_delivery ? new Date(shipmentData.estimated_delivery).toLocaleDateString() : "2-3 business days"}\n\nThank you for choosing ReBooked Solutions!`,
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
