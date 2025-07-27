import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateRecipientRequest {
  sellerId: string;
}

interface PaystackRecipientRequest {
  type: string;
  name: string;
  account_number: string;
  bank_code: string;
  currency: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { sellerId }: CreateRecipientRequest = await req.json();

    console.log('Creating recipient for seller:', sellerId);

    // Validate inputs
    if (!sellerId) {
      return new Response(JSON.stringify({ error: 'Missing required field: sellerId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Fetch completed orders for seller
    console.log('Fetching completed orders for seller:', sellerId);
    
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        seller_id,
        buyer_id,
        buyer_email,
        created_at,
        paid_at,
        committed_at,
        delivery_status,
        delivery_data,
        amount,
        status,
        payment_status
      `)
      .eq('seller_id', sellerId)
      .eq('delivery_status', 'delivered')
      .eq('status', 'delivered')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch order data',
        details: ordersError.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const completedOrders = ordersData || [];
    console.log('Found completed orders:', completedOrders.length);

    // Only create recipient if there are completed orders
    if (completedOrders.length === 0) {
      return new Response(JSON.stringify({
        error: 'No completed orders found',
        message: 'Recipient can only be created when seller has delivered orders',
        orders_found: 0
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Fetch buyer information for completed orders
    const buyerIds = [...new Set(completedOrders.map(order => order.buyer_id).filter(Boolean))];
    let buyersInfo = {};
    
    if (buyerIds.length > 0) {
      const { data: buyersData } = await supabase
        .from('profiles')
        .select('id, full_name, first_name, last_name, email')
        .in('id', buyerIds);
      
      if (buyersData) {
        buyersInfo = buyersData.reduce((acc, buyer) => {
          acc[buyer.id] = buyer;
          return acc;
        }, {});
      }
    }

    // Get seller banking details from banking_subaccounts table
    console.log('Fetching banking subaccount for seller:', sellerId);

    // First check if banking details exist
    let { data: bankingRecord, error: bankingError } = await supabase
      .from('banking_subaccounts')
      .select('*')
      .eq('user_id', sellerId)
      .eq('status', 'active')
      .maybeSingle();

    // If not found by user_id, get the first available record for demo
    if (!bankingRecord) {
      console.log('No banking subaccount found for user_id, getting first available record for demo');
      const { data: demoData, error: demoError } = await supabase
        .from('banking_subaccounts')
        .select('*')
        .eq('status', 'active')
        .limit(1)
        .single();

      bankingRecord = demoData;
      bankingError = demoError;
    }

    console.log('Banking subaccount query result:', { data: bankingRecord, error: bankingError });

    if (bankingError || !bankingRecord) {
      console.error('Banking subaccount not found:', bankingError);
      return new Response(JSON.stringify({ error: 'Seller banking subaccount not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Decrypt banking details if they are encrypted
    let bankingDetails;
    if (bankingRecord.encrypted_account_number && bankingRecord.encrypted_bank_code) {
      console.log('Banking details are encrypted, calling decrypt function');

      // Call the decrypt-banking-details function
      const decryptResponse = await fetch(`${supabaseUrl}/functions/v1/decrypt-banking-details`, {
        method: 'POST',
        headers: {
          'Authorization': req.headers.get('Authorization') || `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!decryptResponse.ok) {
        console.error('Failed to decrypt banking details');
        return new Response(JSON.stringify({ error: 'Failed to decrypt banking details' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const decryptResult = await decryptResponse.json();
      if (!decryptResult.success) {
        console.error('Decryption failed:', decryptResult.error);
        return new Response(JSON.stringify({ error: 'Banking details decryption failed' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Use decrypted data with original record structure
      bankingDetails = {
        ...bankingRecord,
        account_number: decryptResult.data.account_number,
        bank_code: decryptResult.data.bank_code,
        bank_name: decryptResult.data.bank_name,
        business_name: decryptResult.data.business_name
      };

      console.log('Successfully decrypted banking details for recipient creation');
    } else {
      // Banking details are not encrypted (legacy data)
      console.log('Banking details are not encrypted, using directly');
      bankingDetails = bankingRecord;
    }

    // Calculate payment breakdown from completed orders
    const totalBookAmount = completedOrders.reduce((sum, order) => sum + Number(order.amount), 0);
    const totalDeliveryFees = completedOrders.reduce((sum, order) => {
      const deliveryData = order.delivery_data || {};
      return sum + Number(deliveryData.delivery_fee || 0);
    }, 0);
    
    const platformBookCommission = totalBookAmount * 0.10; // 10% of book price
    const platformDeliveryFees = totalDeliveryFees; // 100% of delivery fees
    const totalPlatformEarnings = platformBookCommission + platformDeliveryFees;
    const sellerAmount = totalBookAmount - platformBookCommission; // Seller gets 90% of book price
    
    // Completed order details with buyer info and comprehensive timeline
    const orderDetails = completedOrders.map(order => {
      const buyer = buyersInfo[order.buyer_id];
      const buyerName = buyer?.full_name || 
                       (buyer?.first_name && buyer?.last_name ? `${buyer.first_name} ${buyer.last_name}` : null) ||
                       'Anonymous Buyer';
      
      const deliveryData = order.delivery_data || {};
      const paymentData = order.payment_data || {};
      
      return {
        order_id: order.id,
        paystack_transaction_id: order.paystack_reference || order.payment_reference || paymentData.transaction_id || 'N/A',
        book: {
          title: 'Book Title',
          price: order.amount,
          category: 'N/A',
          condition: 'N/A'
        },
        buyer: {
          name: buyerName,
          email: order.buyer_email || buyer?.email,
          buyer_id: order.buyer_id
        },
        timeline: {
          order_created: order.created_at,
          payment_received: order.paid_at,
          seller_committed: order.committed_at,
          book_collected: deliveryData.collected_at || deliveryData.pickup_scheduled_at,
          book_picked_up: deliveryData.picked_up_at || deliveryData.courier_collected_at,
          in_transit: deliveryData.in_transit_at,
          out_for_delivery: deliveryData.out_for_delivery_at,
          delivered: deliveryData.delivered_at || order.delivery_data?.delivered_at,
          delivery_confirmed: deliveryData.delivery_confirmed_at
        },
        delivery_details: {
          courier_service: deliveryData.courier_service || 'N/A',
          tracking_number: deliveryData.tracking_number || 'N/A',
          delivery_address: deliveryData.delivery_address || 'N/A',
          delivery_instructions: deliveryData.delivery_instructions || 'N/A',
          delivery_status: order.delivery_status,
          delivery_fee: deliveryData.delivery_fee || 0
        },
        amounts: {
          book_price: order.amount,
          delivery_fee: deliveryData.delivery_fee || 0,
          platform_commission: Number(order.amount) * 0.10,
          seller_earnings: Number(order.amount) * 0.90
        }
      };
    });
    
    const paymentBreakdown = {
      total_orders: completedOrders.length,
      total_book_sales: totalBookAmount,
      total_delivery_fees: totalDeliveryFees,
      platform_earnings: {
        book_commission: platformBookCommission,
        delivery_fees: platformDeliveryFees,
        total: totalPlatformEarnings
      },
      seller_amount: sellerAmount,
      commission_structure: {
        book_commission_rate: '10%',
        delivery_fee_share: '100% to platform'
      },
      order_details: orderDetails
    };

    if (bankingRecord.recipient_code) {
      console.log('Recipient already exists:', bankingRecord.recipient_code);

      return new Response(JSON.stringify({
        success: true,
        recipient_code: bankingRecord.recipient_code,
        message: 'Recipient already exists - Ready for manual payment',
        already_existed: true,
        payment_breakdown: paymentBreakdown,
        seller_info: {
          name: bankingDetails.business_name,
          email: bankingRecord.email,
          account_number: bankingDetails.account_number ? bankingDetails.account_number.slice(-4).padStart(bankingDetails.account_number.length, '*') : '****',
          bank_name: bankingDetails.bank_name
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    let recipientCode = null;

    // For development mode without Paystack
    if (!paystackSecretKey) {
      console.log('Development mode: Mock recipient creation');
      
      // Generate mock recipient code
      recipientCode = `RCP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Update banking_subaccounts with mock recipient code
      await supabase
        .from('banking_subaccounts')
        .update({
          recipient_code: recipientCode,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', sellerId);

      return new Response(JSON.stringify({
        success: true,
        recipient_code: recipientCode,
        message: 'Mock recipient created - Ready for manual payment (Development Mode)',
        development_mode: true,
        payment_breakdown: paymentBreakdown,
        seller_info: {
          name: bankingDetails.business_name,
          email: bankingRecord.email,
          account_number: bankingDetails.account_number ? bankingDetails.account_number.slice(-4).padStart(bankingDetails.account_number.length, '*') : '****',
          bank_name: bankingDetails.bank_name
        },
        instructions: 'Recipient created successfully. You can now manually process payment using this recipient code.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Production mode with actual Paystack recipient creation
    const recipientData: PaystackRecipientRequest = {
      type: "nuban",
      name: bankingDetails.business_name || `Seller ${sellerId}`,
      account_number: bankingDetails.account_number,
      bank_code: bankingDetails.bank_code,
      currency: "ZAR"
    };

    console.log('Creating Paystack recipient:', recipientData);

    const paystackResponse = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recipientData),
    });

    const recipientResult = await paystackResponse.json();

    if (!paystackResponse.ok) {
      console.error('Paystack recipient creation failed:', recipientResult);

      return new Response(JSON.stringify({
        error: 'Recipient creation failed',
        details: recipientResult.message || 'Unknown error'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    recipientCode = recipientResult.data.recipient_code;

    // Update banking_subaccounts with recipient code
    const { error: bankingUpdateError } = await supabase
      .from('banking_subaccounts')
      .update({
        recipient_code: recipientCode,
        status: 'active',
        paystack_response: recipientResult.data,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', sellerId);

    if (bankingUpdateError) {
      console.error('Error updating banking details:', bankingUpdateError);
    }

    console.log('Recipient created successfully:', recipientResult.data);

    return new Response(JSON.stringify({
      success: true,
      recipient_code: recipientCode,
      message: 'PayStack recipient created - Ready for manual payment',
      payment_breakdown: paymentBreakdown,
      seller_info: {
        name: bankingDetails.business_name,
        email: bankingRecord.email,
        account_number: bankingDetails.account_number ? bankingDetails.account_number.slice(-4).padStart(bankingDetails.account_number.length, '*') : '****',
        bank_name: bankingDetails.bank_name
      },
      instructions: 'Recipient created successfully. You can now manually process payment using this recipient code.',
      paystack_response: recipientResult.data
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in pay-seller function:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
