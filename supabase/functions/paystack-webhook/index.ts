import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
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

// Helper function to verify Paystack webhook signature using HMAC-SHA512
async function verifyPaystackSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  if (!secret || !signature) return false;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"]
    );

    const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    const sigHex = Array.from(new Uint8Array(sigBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return sigHex === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 🧪 TEST MODE: Check if this is a test request with mock data
  const testResult = await testFunction("paystack-webhook", req);
  if (testResult.isTest) {
    return testResult.response;
  }

  try {
    // Get raw body for signature verification
    const rawBody = await req.text();
    let webhookData;
    
    try {
      webhookData = JSON.parse(rawBody);
    } catch (error) {
      return jsonResponse({
        success: false,
        error: "INVALID_JSON_PAYLOAD",
        details: { error: error.message },
      }, { status: 400 });
    }

    const { event, data } = webhookData;

    if (!event || !data) {
      return jsonResponse({
        success: false,
        error: "MISSING_WEBHOOK_DATA",
        details: {
          message: "Webhook must contain event and data fields"
        },
      }, { status: 400 });
    }

    // Verify webhook signature (skip for test/development)
    const signature = req.headers.get('x-paystack-signature');
    const isTestWebhook = event.includes('test') || data.reference?.includes('test') || data.reference?.includes('mock');
    
    if (!isTestWebhook && PAYSTACK_SECRET_KEY) {
      if (!signature || !await verifyPaystackSignature(rawBody, signature, PAYSTACK_SECRET_KEY)) {
        return jsonResponse({
          success: false,
          error: "INVALID_WEBHOOK_SIGNATURE",
          details: {
            message: "Webhook signature verification failed"
          },
        }, { status: 401 });
      }
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    console.log(`Processing Paystack webhook: ${event} for reference: ${data.reference}`);

    // Log the webhook event
    await supabase.from("webhook_logs").insert({
      event,
      reference: data.reference,
      status: data.status,
      webhook_data: webhookData,
      processed_at: new Date().toISOString()
    });

    // Handle different webhook events
    switch (event) {
      case 'charge.success':
      case 'transaction.success':
        await handleSuccessfulPayment(supabase, data);
        break;
        
      case 'charge.failed':
      case 'transaction.failed':
        await handleFailedPayment(supabase, data);
        break;
        
      case 'transfer.success':
        await handleSuccessfulTransfer(supabase, data);
        break;
        
      case 'transfer.failed':
        await handleFailedTransfer(supabase, data);
        break;
        
      default:
        console.log(`Unhandled webhook event: ${event}`);
        return jsonResponse({
          success: false,
          error: "UNHANDLED_EVENT",
          event,
          message: `Event type '${event}' is not supported by this webhook handler`
        }, { status: 400 });
    }

    return jsonResponse({
      success: true,
      message: `Webhook ${event} processed successfully`,
      event,
      reference: data.reference
    });

  } catch (error) {
    console.error('Error in paystack-webhook:', error);

    const errorMessage = error instanceof Error ? error.message :
                        typeof error === "string" ? error :
                        "Webhook processing error occurred";

    return jsonResponse({
      success: false,
      error: "WEBHOOK_PROCESSING_ERROR",
      details: {
        error_message: errorMessage,
        error_type: error instanceof Error ? error.constructor.name : typeof error,
        timestamp: new Date().toISOString()
      },
    }, { status: 500 });
  }
});

async function handleSuccessfulPayment(supabase: any, data: any) {
  const { reference, amount, customer, status } = data;

  try {
    // Check if this payment was already processed to handle duplicate webhooks
    const { data: existingTransaction } = await supabase
      .from('payment_transactions')
      .select('status, webhook_processed_at')
      .eq('reference', reference)
      .single();

    if (existingTransaction?.status === 'success' && existingTransaction?.webhook_processed_at) {
      console.log(`Duplicate webhook detected for reference: ${reference}, skipping processing`);
      await supabase.from('webhook_logs').insert({
        event: 'duplicate_webhook_detected',
        reference,
        status: 'skipped',
        webhook_data: { message: 'Duplicate successful payment webhook', original_data: data },
        processed_at: new Date().toISOString()
      });
      return;
    }

    // Update payment transaction
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: 'success',
        webhook_processed_at: new Date().toISOString(),
        paystack_webhook_data: data
      })
      .eq('reference', reference);

    if (updateError) {
      console.error('Failed to update payment transaction:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    // Get transaction details to create order
    const { data: transaction } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('reference', reference)
      .single();

    if (transaction && transaction.items) {
      // Call create-order function
      const orderResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          buyer_id: transaction.user_id,
          buyer_email: customer.email,
          cart_items: transaction.items,
          shipping_address: transaction.shipping_address,
          payment_reference: reference,
          payment_data: data
        }),
      });

      if (orderResponse.ok) {
        const orderResult = await orderResponse.json();
        console.log('Order created successfully from webhook:', {
          status: orderResponse.status,
          order_data: orderResult
        });
      } else {
        const errorText = await orderResponse.text();
        console.error('Failed to create order from webhook:', {
          status: orderResponse.status,
          statusText: orderResponse.statusText,
          error_response: errorText
        });
        throw new Error(`Order creation failed: ${orderResponse.status} - ${errorText}`);
      }
    }
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

async function handleFailedPayment(supabase: any, data: any) {
  const { reference } = data;

  try {
    // Check for duplicate webhook processing
    const { data: existingTransaction } = await supabase
      .from('payment_transactions')
      .select('status, webhook_processed_at')
      .eq('reference', reference)
      .single();

    if (existingTransaction?.status === 'failed' && existingTransaction?.webhook_processed_at) {
      console.log(`Duplicate failed payment webhook for reference: ${reference}, skipping`);
      return;
    }

    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: 'failed',
        webhook_processed_at: new Date().toISOString(),
        paystack_webhook_data: data
      })
      .eq('reference', reference);

    if (updateError) {
      console.error('Failed to update payment transaction:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }
  } catch (error) {
    console.error('Error handling failed payment:', error);
    throw error;
  }
}

async function handleSuccessfulTransfer(supabase: any, data: any) {
  const { transfer_code, reference } = data;

  try {
    // Check for duplicate webhook processing
    const { data: existingTransfer } = await supabase
      .from('seller_payments')
      .select('status, webhook_processed_at')
      .eq('transfer_code', transfer_code)
      .single();

    if (existingTransfer?.status === 'success' && existingTransfer?.webhook_processed_at) {
      console.log(`Duplicate successful transfer webhook for transfer_code: ${transfer_code}, skipping`);
      return;
    }

    const { error: updateError } = await supabase
      .from('seller_payments')
      .update({
        status: 'success',
        webhook_processed_at: new Date().toISOString(),
        paystack_webhook_data: data
      })
      .eq('transfer_code', transfer_code);

    if (updateError) {
      console.error('Failed to update seller payment:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }
  } catch (error) {
    console.error('Error handling successful transfer:', error);
    throw error;
  }
}

async function handleFailedTransfer(supabase: any, data: any) {
  const { transfer_code } = data;

  try {
    // Check for duplicate webhook processing
    const { data: existingTransfer } = await supabase
      .from('seller_payments')
      .select('status, webhook_processed_at')
      .eq('transfer_code', transfer_code)
      .single();

    if (existingTransfer?.status === 'failed' && existingTransfer?.webhook_processed_at) {
      console.log(`Duplicate failed transfer webhook for transfer_code: ${transfer_code}, skipping`);
      return;
    }

    const { error: updateError } = await supabase
      .from('seller_payments')
      .update({
        status: 'failed',
        webhook_processed_at: new Date().toISOString(),
        paystack_webhook_data: data
      })
      .eq('transfer_code', transfer_code);

    if (updateError) {
      console.error('Failed to update seller payment:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }
  } catch (error) {
    console.error('Error handling failed transfer:', error);
    throw error;
  }
}
