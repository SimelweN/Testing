import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CourierAddress {
  street: string;
  city: string;
  province: string;
  postal_code: string;
  country?: string;
}

interface ParcelDetails {
  weight: number;
  length: number;
  width: number;
  height: number;
  value: number;
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { pickup_address, delivery_address, parcel_details } =
      await req.json();

    // Get environment variables
    const COURIER_GUY_API_KEY = Deno.env.get("COURIER_GUY_API_KEY");
    const COURIER_GUY_BASE_URL = "https://api.courierguy.co.za/v1";

    if (!COURIER_GUY_API_KEY) {
      console.warn("Courier Guy API key not configured, using fallback rates");
      return getFallbackRates(pickup_address, delivery_address, parcel_details);
    }

    // 🔑 Real Courier Guy API integration
    const quoteData = {
      collection_address: {
        street_address: pickup_address.street, // ← Real seller street
        suburb: "",
        city: pickup_address.city, // ← Real seller city
        postal_code: pickup_address.postal_code, // ← Real seller postal code
        province: pickup_address.province, // ← Real seller province
      },
      delivery_address: {
        street_address: delivery_address.street, // ← Real buyer street
        suburb: "",
        city: delivery_address.city, // ← Real buyer city
        postal_code: delivery_address.postal_code, // ← Real buyer postal code
        province: delivery_address.province, // ← Real buyer province
      },
      parcel: {
        submitted_length_cm: parcel_details.length || 20,
        submitted_width_cm: parcel_details.width || 15,
        submitted_height_cm: parcel_details.height || 5,
        submitted_weight_kg: parcel_details.weight || 0.5, // ← Real package weight
      },
    };

    console.log(
      "Calling Courier Guy API with:",
      JSON.stringify(quoteData, null, 2),
    );

    // 📡 Call Real Courier Guy API
    const response = await fetch(`${COURIER_GUY_BASE_URL}/rates`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${COURIER_GUY_API_KEY}`, // ← Real API key
        "Content-Type": "application/json",
      },
      body: JSON.stringify(quoteData),
    });

    if (!response.ok) {
      console.warn(
        `Courier Guy API error: ${response.status} ${response.statusText}`,
      );
      return getFallbackRates(pickup_address, delivery_address, parcel_details);
    }

    const data = await response.json();
    console.log("Courier Guy API response:", JSON.stringify(data, null, 2));

    // 🔄 Transform API response to standard format
    const quotes =
      data.rates?.map((rate: any) => ({
        service_name: rate.service_name, // ← Real service name
        service_code: rate.service_code,
        price: parseFloat(rate.rate) || parseFloat(rate.price) || 0, // ← Real price from Courier Guy
        currency: "ZAR",
        estimated_days: rate.delivery_time || rate.estimated_days || "1-2", // ← Real delivery time
        description: `${rate.service_name} delivery via Courier Guy`,
      })) || [];

    return new Response(
      JSON.stringify({
        success: true,
        quotes, // ← Real quotes from API
        provider: "courier-guy",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Courier Guy API error:", error);

    // 🔄 Fallback quote on error
    return new Response(
      JSON.stringify({
        success: true,
        quotes: [
          {
            service_name: "Standard Overnight",
            service_code: "ON",
            price: 89.0, // ← Fallback rate
            currency: "ZAR",
            estimated_days: "1-2",
            description: "Standard overnight delivery (fallback rate)",
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
});

// Fallback rate calculation
function getFallbackRates(
  fromAddress: CourierAddress,
  toAddress: CourierAddress,
  parcel: ParcelDetails,
) {
  const majorProvinces = ["Gauteng", "Western Cape", "KwaZulu-Natal"];
  const fromMajor = majorProvinces.includes(fromAddress.province);
  const toMajor = majorProvinces.includes(toAddress.province);

  let baseStandard = 60;
  let baseExpress = 85;

  if (fromAddress.province === toAddress.province) {
    // Same province
    baseStandard = fromMajor ? 45 : 55;
    baseExpress = fromMajor ? 65 : 75;
  } else if (fromMajor && toMajor) {
    // Major to major province
    baseStandard = 75;
    baseExpress = 95;
  } else if (fromMajor || toMajor) {
    // Major to minor or vice versa
    baseStandard = 85;
    baseExpress = 110;
  } else {
    // Minor to minor province
    baseStandard = 95;
    baseExpress = 125;
  }

  // Weight multiplier
  const weightMultiplier = Math.max(1, parcel.weight / 2);

  const quotes = [
    {
      service_name: "Standard Delivery",
      service_code: "STD",
      price: Math.round(baseStandard * weightMultiplier),
      currency: "ZAR",
      estimated_days: "2-3",
      description: "Standard delivery service (calculated rate)",
    },
    {
      service_name: "Express Delivery",
      service_code: "EXP",
      price: Math.round(baseExpress * weightMultiplier),
      currency: "ZAR",
      estimated_days: "1-2",
      description: "Express delivery service (calculated rate)",
    },
  ];

  return new Response(
    JSON.stringify({
      success: true,
      quotes,
      provider: "courier-guy",
      fallback: true,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}
