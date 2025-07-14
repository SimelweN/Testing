import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const FASTWAY_API_KEY = Deno.env.get("FASTWAY_API_KEY");
    const FASTWAY_BASE_URL = "https://api.fastway.co.za/v1";

    if (!FASTWAY_API_KEY) {
      console.warn("Fastway API key not configured, using fallback rates");
      return getFallbackRates(pickup_address, delivery_address, parcel_details);
    }

    // 🔑 Real Fastway API integration
    const quoteData = {
      pickup_address: {
        street_address: pickup_address.street,
        city: pickup_address.city,
        province: pickup_address.province,
        postal_code: pickup_address.postal_code,
        country: pickup_address.country || "South Africa",
      },
      delivery_address: {
        street_address: delivery_address.street,
        city: delivery_address.city,
        province: delivery_address.province,
        postal_code: delivery_address.postal_code,
        country: delivery_address.country || "South Africa",
      },
      parcel: {
        weight_kg: parcel_details.weight || 0.5,
        length_cm: parcel_details.length || 20,
        width_cm: parcel_details.width || 15,
        height_cm: parcel_details.height || 5,
        value_zar: parcel_details.value || 100,
      },
    };

    console.log(
      "Calling Fastway API with:",
      JSON.stringify(quoteData, null, 2),
    );

    // 📡 Call Real Fastway API
    const response = await fetch(`${FASTWAY_BASE_URL}/quote`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FASTWAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(quoteData),
    });

    if (!response.ok) {
      console.warn(
        `Fastway API error: ${response.status} ${response.statusText}`,
      );
      return getFallbackRates(pickup_address, delivery_address, parcel_details);
    }

    const data = await response.json();
    console.log("Fastway API response:", JSON.stringify(data, null, 2));

    // 🔄 Transform API response to standard format
    const quotes =
      data.quotes?.map((quote: any) => ({
        service_name: quote.service_name,
        service_code: quote.service_code,
        price: parseFloat(quote.total_price) || parseFloat(quote.price) || 0,
        currency: "ZAR",
        estimated_days: quote.delivery_days || quote.estimated_days || "2-3",
        description: `${quote.service_name} delivery via Fastway`,
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
    console.error("Fastway API error:", error);

    // 🔄 Fallback quote on error
    return getFallbackRates(pickup_address, delivery_address, parcel_details);
  }
});

// Fallback rate calculation for Fastway
function getFallbackRates(
  fromAddress: CourierAddress,
  toAddress: CourierAddress,
  parcel: ParcelDetails,
) {
  const majorProvinces = ["Gauteng", "Western Cape", "KwaZulu-Natal"];
  const fromMajor = majorProvinces.includes(fromAddress.province);
  const toMajor = majorProvinces.includes(toAddress.province);

  let baseStandard = 65;
  let baseExpress = 90;

  if (fromAddress.province === toAddress.province) {
    baseStandard = fromMajor ? 50 : 60;
    baseExpress = fromMajor ? 70 : 80;
  } else if (fromMajor && toMajor) {
    baseStandard = 80;
    baseExpress = 100;
  } else if (fromMajor || toMajor) {
    baseStandard = 90;
    baseExpress = 115;
  } else {
    baseStandard = 100;
    baseExpress = 130;
  }

  const weightMultiplier = Math.max(1, parcel.weight / 2);

  const quotes = [
    {
      service_name: "Standard Delivery",
      service_code: "STD",
      price: Math.round(baseStandard * weightMultiplier),
      currency: "ZAR",
      estimated_days: "2-4",
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
      provider: "fastway",
      fallback: true,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}
