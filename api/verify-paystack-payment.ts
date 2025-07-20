import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  handleCORS,
  createSupabaseClient,
  validateFields,
  logEvent,
  parseRequestBody,
} from './_lib/utils.js';
import type { APIResponse, VerifyPaymentRequest } from './types';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse<APIResponse>
) {
  // Handle CORS
  handleCORS(req, res);
  if (req.method === 'OPTIONS') return;

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    const body: VerifyPaymentRequest = await parseRequestBody(req);
    const { reference } = body;

    // Validate required fields
    validateFields(body, ['reference']);

    logEvent('payment_verification_started', { reference });

    // Verify payment with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const paystackResult = await paystackResponse.json();

    if (!paystackResult.status) {
      throw new Error(`Paystack verification failed: ${paystackResult.message}`);
    }

    const transaction = paystackResult.data;
    const supabase = createSupabaseClient();

    // Update transaction status in database
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: transaction.status,
        paystack_data: transaction,
        verified_at: new Date().toISOString(),
      })
      .eq('reference', reference);

    if (updateError) {
      logEvent('transaction_update_failed', {
        reference,
        error: updateError.message,
      });
    }

    // If payment is successful, process the order
    if (transaction.status === 'success') {
      logEvent('payment_verified_success', {
        reference,
        amount: transaction.amount / 100, // Convert from kobo
      });

      // Get transaction details to process order
      const { data: transactionRecord } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('reference', reference)
        .single();

      if (transactionRecord) {
        // Call create-order function to process the order
        try {
          const orderResponse = await fetch(`${req.headers.host}/api/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: transactionRecord.user_id,
              items: transactionRecord.items,
              total_amount: transactionRecord.amount,
              shipping_address: transactionRecord.shipping_address,
              payment_reference: reference,
              payment_data: transaction,
            }),
          });

          const orderResult = await orderResponse.json();
          
          if (!orderResult.success) {
            throw new Error(`Order creation failed: ${orderResult.error}`);
          }

          logEvent('order_created_from_payment', {
            reference,
            orders_count: orderResult.orders?.length || 0,
          });
        } catch (orderError) {
          logEvent('order_creation_failed', {
            reference,
            error: orderError.message,
          });
          
          // Don't fail the verification if order creation fails
          // The payment is still valid and verified
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        reference: transaction.reference,
        status: transaction.status,
        amount: transaction.amount / 100, // Convert from kobo to Rand
        currency: transaction.currency,
        paid_at: transaction.paid_at,
        gateway_response: transaction.gateway_response,
      },
    });

  } catch (error: any) {
    logEvent('payment_verification_error', {
      reference: req.body?.reference,
      error: error.message,
    });

    let statusCode = 500;
    if (error.message.includes('Missing required fields')) {
      statusCode = 400;
    }
    if (error.message.includes('Paystack verification failed')) {
      statusCode = 402; // Payment Required
    }

    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to verify payment',
    });
  }
}
