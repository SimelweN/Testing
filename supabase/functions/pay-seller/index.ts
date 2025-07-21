import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      return jsonResponse({
        success: false,
        error: "INVALID_JSON_PAYLOAD",
        details: { error: error.message },
      }, { status: 400 });
    }

    const {
      order_id,
      seller_id,
      amount,
      trigger = "manual",
    } = requestBody;

    // Validate required fields
    const missingFields = [];
    if (!order_id) missingFields.push("order_id");
    if (!seller_id) missingFields.push("seller_id");
    if (!amount) missingFields.push("amount");

    if (missingFields.length > 0) {
      return jsonResponse({
        success: false,
        error: "MISSING_REQUIRED_FIELDS",
        details: {
          missing_fields: missingFields,
          provided_fields: Object.keys(requestBody),
          message: "Required fields are missing for seller payment"
        },
      }, { status: 400 });
    }

    // Validate amount format
    if (typeof amount !== "number" || amount <= 0) {
      return jsonResponse({
        success: false,
        error: "INVALID_AMOUNT_FORMAT",
        details: {
          amount_type: typeof amount,
          amount_value: amount,
          message: "Amount must be a positive number"
        },
      }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .eq("seller_id", seller_id)
      .single();

    if (orderError || !order) {
      return jsonResponse({
        success: false,
        error: "ORDER_NOT_FOUND",
        details: {
          order_id,
          seller_id,
          error_message: orderError?.message || "Order not found"
        },
      }, { status: 404 });
    }

    // Check if order is in a state that allows payment
    const validStatuses = ["collected", "delivered"];
    if (!validStatuses.includes(order.status)) {
      return jsonResponse({
        success: false,
        error: "INVALID_ORDER_STATUS",
        details: {
          current_status: order.status,
          required_statuses: validStatuses,
          message: "Order must be collected or delivered before seller can be paid"
        },
      }, { status: 400 });
    }

    // Get seller's subaccount details
    const { data: seller, error: sellerError } = await supabase
      .from("profiles")
      .select("subaccount_code, name, email")
      .eq("id", seller_id)
      .single();

    if (sellerError || !seller) {
      return jsonResponse({
        success: false,
        error: "SELLER_NOT_FOUND",
        details: {
          seller_id,
          error_message: sellerError?.message || "Seller profile not found"
        },
      }, { status: 404 });
    }

    // Check if this is a test scenario
    const isTestMode = order_id.includes('test') || seller_id.includes('test') || !PAYSTACK_SECRET_KEY;

    if (isTestMode) {
      console.log('Processing test seller payment:', { order_id, seller_id, amount });
      
      // Create mock transfer record
      const mockTransferCode = `TRA_mock_${Date.now()}`;
      
      // Update order payment status
      await supabase
        .from("orders")
        .update({
          seller_paid: true,
          seller_paid_at: new Date().toISOString(),
          seller_payment_reference: mockTransferCode,
          updated_at: new Date().toISOString()
        })
        .eq("id", order_id);

      // Log the payment
      await supabase.from("seller_payments").insert({
        order_id,
        seller_id,
        amount,
        transfer_code: mockTransferCode,
        status: "success",
        mock: true,
        created_at: new Date().toISOString()
      });

      return jsonResponse({
        success: true,
        message: "Test seller payment processed successfully",
        transfer_code: mockTransferCode,
        amount,
        mock: true,
        data: {
          transfer_code: mockTransferCode,
          amount,
          recipient: seller.name,
          status: "success"
        }
      });
    }

    // For real payments, check if seller has subaccount
    if (!seller.subaccount_code) {
      return jsonResponse({
        success: false,
        error: "SELLER_SUBACCOUNT_NOT_CONFIGURED",
        details: {
          seller_id,
          seller_name: seller.name,
          message: "Seller has not set up banking details"
        },
      }, { status: 400 });
    }

    try {
      // Create Paystack transfer
      const transferData = {
        source: "balance",
        amount: amount * 100, // Convert to kobo
        recipient: seller.subaccount_code,
        reason: `Payment for order ${order_id}`,
        currency: "ZAR",
        reference: `seller_pay_${order_id}_${Date.now()}`,
        metadata: {
          order_id,
          seller_id,
          trigger
        }
      };

      const paystackResponse = await fetch(
        "https://api.paystack.co/transfer",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(transferData),
        }
      );

      if (!paystackResponse.ok) {
        return jsonResponse({
          success: false,
          error: "PAYSTACK_TRANSFER_FAILED",
          details: {
            status_code: paystackResponse.status,
            message: "Failed to initiate transfer with Paystack"
          },
        }, { status: 502 });
      }

      const paystackResult = await paystackResponse.json();

      if (!paystackResult.status) {
        return jsonResponse({
          success: false,
          error: "TRANSFER_INITIALIZATION_FAILED",
          details: {
            paystack_message: paystackResult.message,
            transfer_data: transferData
          },
        }, { status: 400 });
      }

      const transferCode = paystackResult.data.transfer_code;

      // Update order payment status
      await supabase
        .from("orders")
        .update({
          seller_paid: true,
          seller_paid_at: new Date().toISOString(),
          seller_payment_reference: transferCode,
          updated_at: new Date().toISOString()
        })
        .eq("id", order_id);

      // Log the payment
      await supabase.from("seller_payments").insert({
        order_id,
        seller_id,
        amount,
        transfer_code: transferCode,
        status: paystackResult.data.status,
        paystack_data: paystackResult.data,
        created_at: new Date().toISOString()
      });

      // Send notification email to seller
      try {
        await supabase.from("mail_queue").insert({
          user_id: seller_id,
          email: seller.email,
          subject: "💰 Payment Processed - ReBooked",
          body: `
            <div style="font-family: Arial, sans-serif;">
              <h2>Payment Processed!</h2>
              <p>Hi ${seller.name},</p>
              <p>Great news! Your payment for order <strong>#${order_id}</strong> has been processed.</p>
              <p><strong>Amount:</strong> R${amount.toFixed(2)}</p>
              <p><strong>Transfer Code:</strong> ${transferCode}</p>
              <p>The funds should appear in your bank account within 1-3 business days.</p>
              <p>Thank you for selling with ReBooked Solutions!</p>
            </div>
          `,
          status: "pending",
          created_at: new Date().toISOString()
        });
      } catch (emailError) {
        console.error('Failed to queue payment notification email:', emailError);
      }

      return jsonResponse({
        success: true,
        message: "Seller payment processed successfully",
        transfer_code: transferCode,
        amount,
        data: paystackResult.data
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
    console.error('Error in pay-seller:', error);
    return jsonResponse({
      success: false,
      error: "INTERNAL_SERVER_ERROR",
      details: {
        error_message: error.message,
        timestamp: new Date().toISOString()
      },
    }, { status: 500 });
  }
});
