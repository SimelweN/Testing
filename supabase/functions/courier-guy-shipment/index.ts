import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface ShipmentData {
  senderName: string;
  senderAddress: string;
  senderCity: string;
  senderProvince: string;
  senderPostalCode: string;
  senderPhone: string;
  recipientName: string;
  recipientAddress: string;
  recipientCity: string;
  recipientProvince: string;
  recipientPostalCode: string;
  recipientPhone: string;
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  description: string;
  value: number;
  reference?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const COURIER_GUY_API_KEY = Deno.env.get("COURIER_GUY_API_KEY");

    if (!COURIER_GUY_API_KEY) {
      throw new Error("Courier Guy API key not configured");
    }

    const shipmentData: ShipmentData = await req.json();

    // Validate required fields
    const requiredFields = [
      "senderName",
      "senderAddress",
      "senderCity",
      "senderProvince",
      "senderPostalCode",
      "recipientName",
      "recipientAddress",
      "recipientCity",
      "recipientProvince",
      "recipientPostalCode",
      "weight",
      "description",
      "value",
    ];

    for (const field of requiredFields) {
      if (!shipmentData[field as keyof ShipmentData]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Format data for Courier Guy API
    const courierGuyPayload = {
      collection: {
        name: shipmentData.senderName,
        address: {
          street: shipmentData.senderAddress,
          city: shipmentData.senderCity,
          province: shipmentData.senderProvince,
          postal_code: shipmentData.senderPostalCode,
        },
        contact: {
          phone: shipmentData.senderPhone || "",
        },
      },
      delivery: {
        name: shipmentData.recipientName,
        address: {
          street: shipmentData.recipientAddress,
          city: shipmentData.recipientCity,
          province: shipmentData.recipientProvince,
          postal_code: shipmentData.recipientPostalCode,
        },
        contact: {
          phone: shipmentData.recipientPhone || "",
        },
      },
      parcels: [
        {
          weight: shipmentData.weight,
          dimensions: shipmentData.dimensions || {
            length: 30,
            width: 20,
            height: 10,
          },
          description: shipmentData.description,
          value: shipmentData.value,
        },
      ],
      reference: shipmentData.reference || `RBS-${Date.now()}`,
      service_type: "standard", // Can be made configurable
    };

    console.log("Creating shipment with Courier Guy:", courierGuyPayload);

    const response = await fetch("https://api.courierguy.co.za/v1/shipments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${COURIER_GUY_API_KEY}`,
      },
      body: JSON.stringify(courierGuyPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Courier Guy API error:", errorText);
      throw new Error(
        `Courier Guy API error: ${response.status} - ${errorText}`,
      );
    }

    const shipmentResult = await response.json();
    console.log("Shipment created successfully:", shipmentResult);

    return new Response(
      JSON.stringify({
        success: true,
        shipment: shipmentResult,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error creating shipment:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
