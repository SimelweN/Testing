import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      order_id,
      service_code,
      pickup_address,
      delivery_address,
      weight,
      dimensions,
      reference,
    } = await req.json();

    if (!order_id || !service_code || !pickup_address || !delivery_address) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields",
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

    if (!COURIER_GUY_API_KEY) {
      throw new Error("Courier Guy API key not configured");
    }

    const shipmentRequest = {
      service_code,
      reference: reference || `ORDER-${order_id}`,
      collection_details: {
        company_name: pickup_address.company || "ReBooked Solutions",
        contact_name: pickup_address.name,
        phone: pickup_address.phone,
        // email: pickup_address.email, // Removed to prevent Courier Guy from sending their own emails
        address_line_1: pickup_address.address_line_1,
        suburb: pickup_address.suburb,
        postal_code: pickup_address.postal_code,
        province: pickup_address.province,
      },
      delivery_details: {
        company_name: delivery_address.company || "",
        contact_name: delivery_address.name,
        phone: delivery_address.phone,
        // email: delivery_address.email, // Removed to prevent Courier Guy from sending their own emails
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

    // Send ReBooked Solutions shipping notification email using DIRECT HTML (the only way that works!)
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
    .btn {
      display: inline-block;
      padding: 12px 20px;
      background-color: #3ab26f;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
      font-weight: bold;
    }
    .link {
      color: #3ab26f;
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 Your Order Has Shipped!</h1>
    </div>

    <h2>Hello ${delivery_address.name}!</h2>
    <p>Great news! Your order #${reference || `ORDER-${order_id}`} has been shipped and is on its way to you.</p>

    <div class="info-box">
      <h3>📱 Tracking Information</h3>
      <p><strong>Tracking Number:</strong> ${shipmentData.tracking_number}</p>
      <p><strong>Carrier:</strong> Courier Guy</p>
      <p><strong>Estimated Delivery:</strong> ${shipmentData.estimated_delivery || "2-3 business days"}</p>
    </div>

    <p>You can track your package using the tracking number above on the Courier Guy website.</p>

    <p>Thank you for choosing ReBooked Solutions!</p>

    <div class="footer">
      <p><strong>This is an automated message from ReBooked Solutions.</strong><br>
      Please do not reply to this email.</p>
      <p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>
      Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p>
      <p>T&Cs apply.</p>
      <p><em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
  </div>
</body>
</html>`;

        const text = `
Your Order Has Shipped!

Hello ${delivery_address.name}!

Great news! Your order #${reference || `ORDER-${order_id}`} has been shipped and is on its way to you.

Tracking Information:
Tracking Number: ${shipmentData.tracking_number}
Carrier: Courier Guy
Estimated Delivery: ${shipmentData.estimated_delivery || "2-3 business days"}

You can track your package using the tracking number above on the Courier Guy website.

Thank you for choosing ReBooked Solutions!

This is an automated message from ReBooked Solutions. Please do not reply to this email.
For assistance, contact: support@rebookedsolutions.co.za
Visit us at: https://rebookedsolutions.co.za
T&Cs apply.
"Pre-Loved Pages, New Adventures"
        `;

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
            text: text,
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
