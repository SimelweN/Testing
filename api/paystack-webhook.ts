import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';
import {
  createSupabaseClient,
  logEvent,
  parseRequestBody,
} from './_lib/utils.js';
import type { APIResponse, PaystackWebhookEvent } from './types';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

/**
 * Verifies Paystack webhook signature
 */
function verifyPaystackSignature(payload: string, signature: string): boolean {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('Paystack secret key not configured');
  }

  const hash = createHash('sha512')
    .update(payload, 'utf8')
    .digest('hex');
  
  return hash === signature;
}

/**
 * Handles Paystack webhook events for payment processing
 * 
 * @param req - Vercel request object
 * @param res - Vercel response object
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse<APIResponse>
) {
  // Only allow POST requests for webhooks
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Webhooks must use POST.',
    });
  }

  try {
    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['x-paystack-signature'] as string;

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing Paystack signature header',
      });
    }

    // Verify webhook signature
    if (!verifyPaystackSignature(rawBody, signature)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature',
      });
    }

    const webhookEvent: PaystackWebhookEvent = await parseRequestBody(req);
    const { event, data } = webhookEvent;

    logEvent('paystack_webhook_received', { 
      event, 
      reference: data.reference,
      status: data.status 
    });

    const supabase = createSupabaseClient();

    switch (event) {
      case 'charge.success':
        // Handle successful payment
        const { error: updateError } = await supabase
          .from('payment_transactions')
          .update({
            status: 'success',
            paystack_data: data,
            verified_at: new Date().toISOString(),
          })
          .eq('reference', data.reference);

        if (updateError) {
          logEvent('webhook_transaction_update_failed', {
            reference: data.reference,
            error: updateError.message,
          });
        } else {
          logEvent('webhook_payment_success_processed', {
            reference: data.reference,
            amount: data.amount / 100,
          });

          // Trigger order creation
          try {
            const { data: transaction } = await supabase
              .from('payment_transactions')
              .select('*')
              .eq('reference', data.reference)
              .single();

            if (transaction) {
              const orderResponse = await fetch(`${req.headers.host}/api/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  user_id: transaction.user_id,
                  items: transaction.items,
                  total_amount: transaction.amount,
                  shipping_address: transaction.shipping_address,
                  payment_reference: data.reference,
                  payment_data: data,
                }),
              });

              const orderResult = await orderResponse.json();
              
              if (orderResult.success) {
                logEvent('webhook_order_created', {
                  reference: data.reference,
                  orders_count: orderResult.orders?.length || 0,
                });
              }
            }
          } catch (orderError: any) {
            logEvent('webhook_order_creation_failed', {
              reference: data.reference,
              error: orderError.message,
            });
          }
        }
        break;

      case 'charge.failed':
        // Handle failed payment
        await supabase
          .from('payment_transactions')
          .update({
            status: 'failed',
            paystack_data: data,
            verified_at: new Date().toISOString(),
          })
          .eq('reference', data.reference);

        logEvent('webhook_payment_failed_processed', {
          reference: data.reference,
          reason: data.gateway_response,
        });
        break;

      case 'transfer.success':
        // Handle successful transfer to seller
        logEvent('webhook_transfer_success', {
          transfer_code: data.transfer_code,
          amount: data.amount / 100,
        });
        break;

      case 'transfer.failed':
        // Handle failed transfer to seller
        logEvent('webhook_transfer_failed', {
          transfer_code: data.transfer_code,
          reason: data.gateway_response,
        });
        break;

      default:
        logEvent('webhook_event_ignored', { event });
        break;
    }

    // Always return 200 to acknowledge receipt
    return res.status(200).json({
      success: true,
      message: `Webhook event ${event} processed successfully`,
    });

  } catch (error: any) {
    logEvent('paystack_webhook_error', { 
      error: error.message,
      event: req.body?.event 
    });

    // Return 200 even on error to prevent Paystack retries
    // Log the error for investigation
    return res.status(200).json({
      success: false,
      error: 'Webhook processing failed',
      message: 'Event acknowledged but processing failed',
    });
  }
}
