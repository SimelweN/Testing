import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { testFunction } from "../_mock-data/edge-function-tester.ts";
import { parseRequestBody } from "../_shared/safe-body-parser.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DeliveryAddress {
  streetAddress?: string;
  suburb: string;
  city?: string;
  province: string;
  postalCode: string;
}

interface QuoteRequest {
  fromAddress?: DeliveryAddress;
  toAddress?: DeliveryAddress;
  weight: number;
  // Encrypted address lookup options
  fromBookId?: string;     // Lookup encrypted pickup address from books table
  toOrderId?: string;      // Lookup encrypted shipping address from orders table
  fromSellerId?: string;   // Lookup encrypted pickup address from profiles table
  useEncryption?: boolean; // Flag to enable encrypted address lookup
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 🧪 TEST MODE: Check if this is a test request with mock data
  const testResult = await testFunction("get-delivery-quotes", req);
  if (testResult.isTest) {
    return testResult.response;
  }

  try {
    const bodyResult = await parseRequestBody<QuoteRequest>(req, corsHeaders);
    if (!bodyResult.success) {
      return bodyResult.errorResponse!;
    }
    let { fromAddress, toAddress, weight, fromBookId, toOrderId, fromSellerId, useEncryption } = bodyResult.data;

    // If encryption is enabled and IDs are provided, decrypt addresses
    if (useEncryption && (fromBookId || toOrderId || fromSellerId)) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
      });

      try {
        // Decrypt pickup address
        if (fromBookId && !fromAddress) {
          const { data, error } = await supabase.functions.invoke('decrypt-address', {
            body: {
              fetch: {
                table: 'books',
                target_id: fromBookId,
                address_type: 'pickup'
              }
            }
          });

          if (!error && data?.success && data?.data) {
            const decryptedAddress = data.data;
            fromAddress = {
              streetAddress: decryptedAddress.streetAddress || decryptedAddress.street || '',
              suburb: decryptedAddress.suburb || decryptedAddress.city || '',
              city: decryptedAddress.city || decryptedAddress.suburb || '',
              province: decryptedAddress.province || '',
              postalCode: decryptedAddress.postalCode || ''
            };
          }
        }

        // Alternative: decrypt from seller profile
        if (fromSellerId && !fromAddress) {
          const { data, error } = await supabase.functions.invoke('decrypt-address', {
            body: {
              fetch: {
                table: 'profiles',
                target_id: fromSellerId,
                address_type: 'pickup'
              }
            }
          });

          if (!error && data?.success && data?.data) {
            const decryptedAddress = data.data;
            fromAddress = {
              streetAddress: decryptedAddress.streetAddress || decryptedAddress.street || '',
              suburb: decryptedAddress.suburb || decryptedAddress.city || '',
              city: decryptedAddress.city || decryptedAddress.suburb || '',
              province: decryptedAddress.province || '',
              postalCode: decryptedAddress.postalCode || ''
            };
          }
        }

        // Decrypt shipping address
        if (toOrderId && !toAddress) {
          const { data, error } = await supabase.functions.invoke('decrypt-address', {
            body: {
              fetch: {
                table: 'orders',
                target_id: toOrderId,
                address_type: 'shipping'
              }
            }
          });

          if (!error && data?.success && data?.data) {
            const decryptedAddress = data.data;
            toAddress = {
              streetAddress: decryptedAddress.streetAddress || decryptedAddress.street || '',
              suburb: decryptedAddress.suburb || decryptedAddress.city || '',
              city: decryptedAddress.city || decryptedAddress.suburb || '',
              province: decryptedAddress.province || '',
              postalCode: decryptedAddress.postalCode || ''
            };
          }
        }
      } catch (decryptError) {
        console.error("Error decrypting addresses:", decryptError);
        // Continue with provided addresses or fallback
      }
    }

    // Enhanced validation with specific error messages
    const validationErrors = [];
    if (!fromAddress) validationErrors.push("fromAddress is required");
    if (!toAddress) validationErrors.push("toAddress is required");
    if (!weight) validationErrors.push("weight is required");

    // Validate address structure
    if (fromAddress) {
      if (!fromAddress.suburb)
        validationErrors.push("fromAddress.suburb is required");
      if (!fromAddress.province)
        validationErrors.push("fromAddress.province is required");
      if (!fromAddress.postalCode)
        validationErrors.push("fromAddress.postalCode is required");
    }

    if (toAddress) {
      if (!toAddress.suburb)
        validationErrors.push("toAddress.suburb is required");
      if (!toAddress.province)
        validationErrors.push("toAddress.province is required");
      if (!toAddress.postalCode)
        validationErrors.push("toAddress.postalCode is required");
    }

    // Validate weight
    if (weight && (typeof weight !== "number" || weight <= 0 || weight > 50)) {
      validationErrors.push("weight must be a number between 0.1 and 50 kg");
    }

    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "VALIDATION_FAILED",
          details: {
            validation_errors: validationErrors,
                                    provided_fields: Object.keys({ fromAddress, toAddress, weight }),
            message: `Validation failed: ${validationErrors.join(", ")}`,
            required_format: {
              fromAddress: {
                suburb: "String, pickup suburb",
                province: "String, pickup province",
                postalCode: "String, pickup postal code",
                streetAddress: "String, optional street address",
                city: "String, optional city",
              },
              toAddress: {
                suburb: "String, delivery suburb",
                province: "String, delivery province",
                postalCode: "String, delivery postal code",
                streetAddress: "String, optional street address",
                city: "String, optional city",
              },
              weight: "Number, package weight in kg (0.1 - 50)",
            },
          },
          fix_instructions:
            "Provide valid fromAddress and toAddress objects with required fields (suburb, province, postalCode) and weight as a number between 0.1-50 kg",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("Getting quotes for delivery:", {
      fromAddress,
      toAddress,
      weight,
    });

    const quotes = [];
    const providerErrors = [];

    // Always add self-collection option
    quotes.push({
      service: "Self Collection",
      price: 0,
      currency: "ZAR",
      estimated_days: "Immediate",
      service_code: "SELF",
      provider: "self",
    });

    // Get Courier Guy quote
    try {
      const courierGuyResponse = await getCourierGuyQuote(
        fromAddress,
        toAddress,
        weight,
      );
      if (courierGuyResponse) {
        quotes.push({
          service: "Courier Guy Express",
          price: courierGuyResponse.price,
          currency: "ZAR",
          estimated_days: courierGuyResponse.estimatedDays,
          service_code: "CG_EXPRESS",
          provider: "courier-guy",
        });
      }
    } catch (error) {
            console.error("Courier Guy API error:", error?.message || error);
            providerErrors.push({
        provider: "courier-guy",
        error: error instanceof Error ? error.message :
               typeof error === "string" ? error :
               "Courier Guy API error",
        fallback_used: true,
      });
      // Add fallback quote
      quotes.push({
        service: "Courier Guy Express (Estimated)",
        price: 95,
        currency: "ZAR",
        estimated_days: 2,
        service_code: "CG_EXPRESS",
        provider: "courier-guy",
        fallback: true,
      });
    }



    return new Response(
      JSON.stringify({
        success: true,
        quotes,
        providers: ["self", "courier-guy"],
        total_quotes: quotes.length,
        provider_errors: providerErrors.length > 0 ? providerErrors : undefined,
        request_details: {
          from: `${fromAddress.suburb}, ${fromAddress.province} ${fromAddress.postalCode}`,
          to: `${toAddress.suburb}, ${toAddress.province} ${toAddress.postalCode}`,
          weight: `${weight}kg`,
        },
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error in get-delivery-quotes:", error);

    const errorMessage = error instanceof Error ? error.message :
                        typeof error === "string" ? error :
                        "Unexpected error occurred";

    return new Response(
      JSON.stringify({
        success: false,
        error: "UNEXPECTED_ERROR",
        details: {
          error_message: errorMessage,
          error_type: error instanceof Error ? error.constructor.name : typeof error,
          error_stack: error instanceof Error ? error.stack : undefined,
          error_type: error?.constructor?.name || 'Unknown',
          timestamp: new Date().toISOString(),
        },
        fix_instructions:
          "This is an unexpected server error. Check the server logs for more details and contact support if the issue persists.",
        fallback_quotes: [
          {
            service: "Self Collection",
            price: 0,
            currency: "ZAR",
            estimated_days: "Immediate",
            service_code: "SELF",
            provider: "self",
          },
          {
            service: "Standard Delivery (Estimated)",
            price: 90,
            currency: "ZAR",
            estimated_days: 3,
            service_code: "STANDARD",
            provider: "fallback",
            fallback: true,
          },
        ],
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});

async function getCourierGuyQuote(
  fromAddress: DeliveryAddress,
  toAddress: DeliveryAddress,
  weight: number,
) {
  const apiKey = Deno.env.get("COURIER_GUY_API_KEY");
  if (!apiKey) {
    throw new Error(
      "Courier Guy API key not configured - contact administrator",
    );
  }

  console.log("Calling Courier Guy API...");

  try {
    const response = await fetch("https://api.courierguy.co.za/v1/quotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        collection_address: {
          suburb: fromAddress.suburb,
          city: fromAddress.city || fromAddress.suburb,
          province: fromAddress.province,
          postal_code: fromAddress.postalCode,
          street_address: fromAddress.streetAddress || "Unknown",
        },
        delivery_address: {
          suburb: toAddress.suburb,
          city: toAddress.city || toAddress.suburb,
          province: toAddress.province,
          postal_code: toAddress.postalCode,
          street_address: toAddress.streetAddress || "Unknown",
        },
        parcel: {
          weight: weight,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Courier Guy API HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Courier Guy response:", data);

    if (!data.quotes || data.quotes.length === 0) {
      throw new Error("No quotes returned from Courier Guy API");
    }

    const quote = data.quotes[0];
    return {
      price: parseFloat(quote.price) || 95,
      estimatedDays: parseInt(quote.estimated_days) || 2,
    };
  } catch (fetchError) {
    throw new Error(`Courier Guy API connection failed: ${fetchError.message}`);
  }
}
