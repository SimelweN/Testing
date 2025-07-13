import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DeliveryAddress {
  streetAddress: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
}

interface QuoteRequest {
  fromAddress: DeliveryAddress;
  toAddress: DeliveryAddress;
  weight: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fromAddress, toAddress, weight }: QuoteRequest = await req.json();

    console.log("Getting quotes for delivery:", {
      fromAddress,
      toAddress,
      weight,
    });

    const quotes = [];

    // Get Fastway quote
    try {
      const fastwayResponse = await getFastwayQuote(
        fromAddress,
        toAddress,
        weight,
      );
      if (fastwayResponse) {
        quotes.push({
          courier: "fastway",
          price: fastwayResponse.price,
          estimatedDays: fastwayResponse.estimatedDays,
          serviceName: "Fastway Standard",
        });
      }
    } catch (error) {
      console.error("Fastway API error:", error);
      // Add fallback quote
      quotes.push({
        courier: "fastway",
        price: 85,
        estimatedDays: 3,
        serviceName: "Fastway Standard",
      });
    }

    // Get Courier Guy quote
    try {
      const courierGuyResponse = await getCourierGuyQuote(
        fromAddress,
        toAddress,
        weight,
      );
      if (courierGuyResponse) {
        quotes.push({
          courier: "courier-guy",
          price: courierGuyResponse.price,
          estimatedDays: courierGuyResponse.estimatedDays,
          serviceName: "Courier Guy Express",
        });
      }
    } catch (error) {
      console.error("Courier Guy API error:", error);
      // Add fallback quote
      quotes.push({
        courier: "courier-guy",
        price: 95,
        estimatedDays: 2,
        serviceName: "Courier Guy Express",
      });
    }

    return new Response(JSON.stringify({ quotes }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in get-delivery-quotes:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        quotes: [
          {
            courier: "fastway",
            price: 85,
            estimatedDays: 3,
            serviceName: "Fastway Standard",
          },
          {
            courier: "courier-guy",
            price: 95,
            estimatedDays: 2,
            serviceName: "Courier Guy Express",
          },
        ],
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});

async function getFastwayQuote(
  fromAddress: DeliveryAddress,
  toAddress: DeliveryAddress,
  weight: number,
) {
  const apiKey = Deno.env.get("FASTWAY_API_KEY");
  if (!apiKey) throw new Error("Fastway API key not configured");

  console.log("Calling Fastway API with key:", apiKey.substring(0, 8) + "...");

  const response = await fetch("https://api.fastway.org/v2/quotes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from_postcode: fromAddress.postalCode,
      to_postcode: toAddress.postalCode,
      weight: weight,
    }),
  });

  if (!response.ok) {
    console.error(
      "Fastway API response not ok:",
      response.status,
      response.statusText,
    );
    throw new Error(`Fastway API error: ${response.status}`);
  }

  const data = await response.json();
  console.log("Fastway response:", data);

  if (!data.quotes || data.quotes.length === 0)
    throw new Error("No quotes returned");

  const quote = data.quotes[0];
  return {
    price: quote.price,
    estimatedDays: quote.estimated_days,
  };
}

async function getCourierGuyQuote(
  fromAddress: DeliveryAddress,
  toAddress: DeliveryAddress,
  weight: number,
) {
  const apiKey = Deno.env.get("COURIER_GUY_API_KEY");
  if (!apiKey) {
    throw new Error("Courier Guy API key not configured");
  }

  console.log(
    "Calling Courier Guy API with key:",
    apiKey.substring(0, 8) + "...",
  );

  const response = await fetch("https://api.courierguy.co.za/v1/quotes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      collection_address: {
        suburb: fromAddress.suburb,
        city: fromAddress.city,
        province: fromAddress.province,
        postal_code: fromAddress.postalCode,
        street_address: fromAddress.streetAddress,
      },
      delivery_address: {
        suburb: toAddress.suburb,
        city: toAddress.city,
        province: toAddress.province,
        postal_code: toAddress.postalCode,
        street_address: toAddress.streetAddress,
      },
      parcel: {
        weight: weight,
      },
    }),
  });

  if (!response.ok) {
    console.error(
      "Courier Guy API response not ok:",
      response.status,
      response.statusText,
    );
    throw new Error(`Courier Guy API error: ${response.status}`);
  }

  const data = await response.json();
  console.log("Courier Guy response:", data);

  // Assuming the response has a 'quotes' array or similar structure:
  if (!data.quotes || data.quotes.length === 0) {
    throw new Error("No quotes returned from Courier Guy");
  }

  const quote = data.quotes[0]; // Pick first quote or filter as needed

  return {
    price: quote.price,
    estimatedDays: quote.estimated_days,
  };
}
