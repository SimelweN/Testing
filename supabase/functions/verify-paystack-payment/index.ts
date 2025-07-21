import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { parseRequestBody } from "../_shared/safe-body-parser.ts";
import { testFunction } from "../_mock-data/edge-function-tester.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (data: any, options: { status?: number; headers?: Record<string, string> } = {}) => {
  return new Response(JSON.stringify(data), {
    status: options.status || 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...options.headers
    }
  });
};

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 🧪 TEST MODE: Check if this is a test request with mock data
  const testResult = await testFunction("verify-paystack-payment", req);
  if (testResult.isTest) {
    return testResult.response;
  }

  try {
    // Parse request body
    const bodyResult = await parseRequestBody(req, corsHeaders);
    if (!bodyResult.success) {
      return bodyResult.errorResponse!;
    }
    const requestBody = bodyResult.data;

    const { reference } = requestBody;

    // Validate required fields
    if (!reference) {
      return jsonResponse({
        success: false,
        error: "MISSING_REQUIRED_FIELDS",
        details: {
          missing_fields: ["reference"],
          message: "Payment reference is required for verification"
        },
      }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Check if this is a test/mock reference
    if (reference.startsWith('test_ref_') || reference.startsWith('mock_') || reference.startsWith('fallback_ref_')) {
      console.log('Processing test/mock payment reference:', reference);
      
      // For test references, simulate successful payment
      const mockPaymentData = {
        reference,
        amount: 10000, // R100 in kobo
        currency: "ZAR",
        status: "success",
        paid_at: new Date().toISOString(),
        channel: "test",
        authorization: {
          authorization_code: `AUTH_mock_${Date.now()}`,
          bin: "408408",
          last4: "4081",
          exp_month: "12",
          exp_year: "2030",
          channel: "test",
          card_type: "visa DEBIT",
          bank: "Test Bank",
          country_code: "ZA",
          brand: "visa",
          reusable: true,
          signature: `SIG_mock_${Date.now()}`
        },
        customer: {
          email: "test@example.com"
        }
      };

      // Update transaction in database
      await supabase
        .from('payment_transactions')
        .update({
          status: 'success',
          verified_at: new Date().toISOString(),
          paystack_verification_data: mockPaymentData
        })
        .eq('reference', reference);

      return jsonResponse({
        success: true,
        data: mockPaymentData,
        mock: true,
        message: "Test payment verified successfully"
      });
    }

    // For real payments, verify with Paystack
    if (!PAYSTACK_SECRET_KEY) {
      return jsonResponse({
        success: false,
        error: "PAYSTACK_NOT_CONFIGURED",
        details: {
          message: "Paystack secret key not configured"
        },
      }, { status: 500 });
    }

    try {
      const paystackResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!paystackResponse.ok) {
        return jsonResponse({
          success: false,
          error: "PAYSTACK_VERIFICATION_FAILED",
          details: {
            status_code: paystackResponse.status,
            message: "Failed to verify payment with Paystack"
          },
        }, { status: 502 });
      }

      const paystackResult = await paystackResponse.json();

      if (!paystackResult.status) {
        return jsonResponse({
          success: false,
          error: "PAYMENT_VERIFICATION_FAILED",
          details: {
            paystack_message: paystackResult.message,
            reference
          },
        }, { status: 400 });
      }

      const paymentData = paystackResult.data;

      // Update transaction in database
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({
          status: paymentData.status,
          verified_at: new Date().toISOString(),
          paystack_verification_data: paymentData
        })
        .eq('reference', reference);

      if (updateError) {
        console.error('Failed to update transaction:', updateError);
      }

      // If payment is successful, trigger order creation
      if (paymentData.status === 'success') {
        try {
          // Get the original transaction data
          const { data: transaction } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('reference', reference)
            .single();

          if (transaction && transaction.items) {
            // Call create-order function
            await fetch(`${SUPABASE_URL}/functions/v1/create-order`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              },
              body: JSON.stringify({
                buyer_id: transaction.user_id,
                buyer_email: paymentData.customer.email,
                cart_items: transaction.items,
                shipping_address: transaction.shipping_address,
                payment_reference: reference,
                payment_data: paymentData
              }),
            });
          }
        } catch (orderError) {
          console.error('Failed to create order after payment verification:', orderError);
          // Don't fail the verification response - log and continue
        }
      }

      return jsonResponse({
        success: true,
        data: paymentData,
        message: `Payment ${paymentData.status}`
      });

    } catch (paystackError) {
      console.error('Paystack API error:', paystackError);
      return jsonResponse({
        success: false,
        error: "PAYSTACK_API_CONNECTION_ERROR",
        details: {
          error_message: paystackError.message
        },
      }, { status: 502 });
    }

  } catch (error) {
    console.error('Error in verify-paystack-payment:', error);

    const errorMessage = error instanceof Error ? error.message :
                        typeof error === "string" ? error :
                        "Internal server error occurred";

    return jsonResponse({
      success: false,
      error: "INTERNAL_SERVER_ERROR",
      details: {
        error_message: errorMessage,
        error_type: error instanceof Error ? error.constructor.name : typeof error,
        timestamp: new Date().toISOString()
      },
    }, { status: 500 });
  }
});
