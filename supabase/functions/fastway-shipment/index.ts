import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FastwayAddress {
  company?: string;
  contact: string;
  phone: string;
  email?: string;
  addr1: string;
  addr2?: string;
  city: string;
  province: string;
  postcode: string;
  country: string;
}

interface FastwayParcel {
  reference: string;
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  description: string;
  value?: number;
}

interface FastwayShipmentRequest {
  collection: FastwayAddress;
  delivery: FastwayAddress;
  parcels: FastwayParcel[];
  service_type: "Standard" | "Express" | "Overnight";
  collection_date?: string;
  special_instructions?: string;
  require_signature?: boolean;
  insurance?: boolean;
  reference?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Fastway Shipment API called");

    const requestData: FastwayShipmentRequest = await req.json();
    console.log("Shipment request:", requestData);

    // Validate required fields
    if (
      !requestData.collection ||
      !requestData.delivery ||
      !requestData.parcels?.length
    ) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: collection, delivery, parcels",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get Fastway API credentials
    const fastwayApiKey = Deno.env.get("FASTWAY_API_KEY");
    const fastwayApiUrl =
      Deno.env.get("FASTWAY_API_URL") || "https://api.fastway.org/v2";

    if (!fastwayApiKey) {
      console.error("Fastway API key not configured");

      // Return mock shipment for development
      const mockShipment = generateMockShipment(requestData);
      return new Response(JSON.stringify({ shipment: mockShipment }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prepare Fastway shipment request
    const fastwayRequest = {
      pickup: {
        company_name: requestData.collection.company || "",
        contact_name: requestData.collection.contact,
        phone_number: requestData.collection.phone,
        email_address: requestData.collection.email || "",
        address_line_1: requestData.collection.addr1,
        address_line_2: requestData.collection.addr2 || "",
        suburb: "",
        city: requestData.collection.city,
        province: requestData.collection.province,
        postal_code: requestData.collection.postcode,
        country_code: requestData.collection.country || "ZA",
      },
      destination: {
        company_name: requestData.delivery.company || "",
        contact_name: requestData.delivery.contact,
        phone_number: requestData.delivery.phone,
        email_address: requestData.delivery.email || "",
        address_line_1: requestData.delivery.addr1,
        address_line_2: requestData.delivery.addr2 || "",
        suburb: "",
        city: requestData.delivery.city,
        province: requestData.delivery.province,
        postal_code: requestData.delivery.postcode,
        country_code: requestData.delivery.country || "ZA",
      },
      parcels: requestData.parcels.map((parcel) => ({
        reference: parcel.reference,
        weight_kg: parcel.weight,
        length_cm: parcel.length || 20,
        width_cm: parcel.width || 20,
        height_cm: parcel.height || 20,
        description: parcel.description,
        value: parcel.value || 100,
      })),
      service_code: getServiceCode(requestData.service_type),
      collection_date:
        requestData.collection_date || new Date().toISOString().split("T")[0],
      special_instructions: requestData.special_instructions || "",
      signature_required: requestData.require_signature || false,
      insurance_required: requestData.insurance || false,
      customer_reference: requestData.reference || "",
    };

    console.log("Calling Fastway Shipment API:", fastwayRequest);

    // Call Fastway shipment API
    const fastwayResponse = await fetch(`${fastwayApiUrl}/shipments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${fastwayApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fastwayRequest),
    });

    if (!fastwayResponse.ok) {
      console.error(
        "Fastway Shipment API error:",
        fastwayResponse.status,
        await fastwayResponse.text(),
      );

      // Return mock shipment on API error for development
      const mockShipment = generateMockShipment(requestData);
      return new Response(
        JSON.stringify({
          shipment: mockShipment,
          fallback: true,
          error: `Fastway API error: ${fastwayResponse.status}`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const fastwayData = await fastwayResponse.json();
    console.log("Fastway Shipment API response:", fastwayData);

    // Transform response to our format
    const shipment = {
      consignment_id: fastwayData.consignment_id || generateId(),
      tracking_number: fastwayData.tracking_number || generateTrackingNumber(),
      barcode: fastwayData.barcode || generateBarcode(),
      labels: fastwayData.labels || [],
      cost: parseFloat(fastwayData.total_cost || "50"),
      service_code:
        fastwayData.service_code || getServiceCode(requestData.service_type),
      collection_date:
        fastwayData.collection_date ||
        requestData.collection_date ||
        new Date().toISOString().split("T")[0],
      estimated_delivery_date:
        fastwayData.estimated_delivery_date ||
        calculateDeliveryDate(requestData.service_type),
      reference: requestData.reference,
    };

    return new Response(JSON.stringify({ shipment }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in fastway-shipment function:", error);

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getServiceCode(serviceType: string): string {
  switch (serviceType) {
    case "Express":
      return "EXPRESS";
    case "Overnight":
      return "OVERNIGHT";
    case "Standard":
    default:
      return "STANDARD";
  }
}

function calculateDeliveryDate(serviceType: string): string {
  const today = new Date();
  let daysToAdd = 3;

  switch (serviceType) {
    case "Express":
    case "Overnight":
      daysToAdd = 1;
      break;
    case "Standard":
    default:
      daysToAdd = 3;
      break;
  }

  const deliveryDate = new Date(today);
  deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);

  // Skip weekends
  while (deliveryDate.getDay() === 0 || deliveryDate.getDay() === 6) {
    deliveryDate.setDate(deliveryDate.getDate() + 1);
  }

  return deliveryDate.toISOString().split("T")[0];
}

function generateId(): string {
  return (
    "FW" +
    Date.now().toString() +
    Math.random().toString(36).substr(2, 5).toUpperCase()
  );
}

function generateTrackingNumber(): string {
  return "FW" + Math.random().toString(36).substr(2, 10).toUpperCase();
}

function generateBarcode(): string {
  return Math.random().toString().substr(2, 12);
}

function generateMockShipment(request: FastwayShipmentRequest) {
  return {
    consignment_id: generateId(),
    tracking_number: generateTrackingNumber(),
    barcode: generateBarcode(),
    labels: ["base64-encoded-label-data"], // Mock label
    cost: calculateMockCost(request.parcels[0]?.weight || 1),
    service_code: getServiceCode(request.service_type),
    collection_date:
      request.collection_date || new Date().toISOString().split("T")[0],
    estimated_delivery_date: calculateDeliveryDate(request.service_type),
    reference: request.reference,
  };
}

function calculateMockCost(weight: number): number {
  return Math.max(45, weight * 12);
}
