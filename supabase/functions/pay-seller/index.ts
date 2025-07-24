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

// Helper function to generate consistent seller and subaccount info
const generateSellerInfo = (bankingDetails: any) => {
  const maskedAccountNumber = bankingDetails.account_number?.slice(-4).padStart(bankingDetails.account_number?.length || 0, '*');

  return {
    seller_info: {
      name: bankingDetails.business_name,
      email: bankingDetails.email,
      account_number: maskedAccountNumber,
      bank_name: bankingDetails.bank_name
    },
    subaccount_details: {
      subaccount_code: bankingDetails.subaccount_code,
      business_name: bankingDetails.business_name,
      bank_name: bankingDetails.bank_name,
      account_number: bankingDetails.account_number,
      bank_code: bankingDetails.bank_code,
      email: bankingDetails.email,
      status: bankingDetails.status,
      created_at: bankingDetails.created_at,
      updated_at: bankingDetails.updated_at,
      recipient_code: bankingDetails.recipient_code,
      ...(bankingDetails.fallback_source && { fallback_source: bankingDetails.fallback_source })
    }
  };
};

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

    // Get seller banking details using the same approach as "Sellers' Banking Info" section
    console.log('🔍 Fetching banking subaccount for seller:', sellerId);

    // Step 1: Get subaccount_code from profiles table
    console.log('📋 Checking profile table for subaccount_code...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('subaccount_code, preferences, email')
      .eq('id', sellerId)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile data:', profileError);
      return new Response(JSON.stringify({
        error: 'Failed to fetch seller profile data',
        details: profileError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const subaccountCode = profileData?.subaccount_code;

    if (!subaccountCode) {
      console.log('❌ No subaccount code found in profile');
      return new Response(JSON.stringify({
        error: 'Seller banking subaccount not found',
        message: 'No subaccount code found in seller profile. Seller needs to complete banking setup first.'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('✅ Found subaccount code:', subaccountCode);

    // Step 2: Get detailed banking info from banking_subaccounts table using subaccount_code
    console.log('📦 Fetching detailed banking info...');
    const { data: bankingDetails, error: bankingError } = await supabase
      .from('banking_subaccounts')
      .select('*')
      .eq('subaccount_code', subaccountCode)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (bankingError) {
      console.error('❌ Error fetching banking details:', bankingError);
      return new Response(JSON.stringify({
        error: 'Failed to fetch banking details',
        details: bankingError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!bankingDetails) {
      console.log('❌ No banking details found for subaccount code');

      // Fallback - use preferences data if available and continue with recipient creation
      const preferences = profileData?.preferences || {};
      bankingDetails = {
        subaccount_code: subaccountCode,
        business_name: preferences.business_name || `Seller ${sellerId}`,
        bank_name: preferences.bank_details?.bank_name || 'Banking details incomplete',
        account_number: preferences.bank_details?.account_number || 'Not available',
        bank_code: preferences.bank_details?.bank_code || 'N/A',
        email: profileData?.email || 'Please update',
        status: 'incomplete',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        recipient_code: null,
        user_id: sellerId,
        fallback_source: 'preferences' // Flag to indicate this is fallback data
      };

      console.log('⚠️ Using fallback banking details from preferences');
    }

    console.log('✅ Banking subaccount data retrieved successfully:', {
      subaccount_code: bankingDetails.subaccount_code,
      business_name: bankingDetails.business_name,
      bank_name: bankingDetails.bank_name,
      account_number: bankingDetails.account_number?.slice(-4).padStart(bankingDetails.account_number?.length || 0, '*'),
      email: bankingDetails.email
    });

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

      return {
        order_id: order.id,
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
          delivery_status: order.delivery_status
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

    if (bankingDetails.recipient_code) {
      console.log('✅ Recipient already exists:', bankingDetails.recipient_code);

      const { seller_info, subaccount_details } = generateSellerInfo(bankingDetails);

      return new Response(JSON.stringify({
        success: true,
        recipient_code: bankingDetails.recipient_code,
        message: 'Recipient already exists - Ready for manual payment',
        already_existed: true,
        payment_breakdown: paymentBreakdown,
        ...{ seller_info, subaccount_details },
        payout_timeline: {
          orders_delivered: completedOrders.length,
          total_amount_due: sellerAmount,
          recipient_created: bankingDetails.created_at,
          ready_for_payout: new Date().toISOString(),
          next_steps: 'Manual payment processing can now be initiated'
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

      // Update banking details with new recipient code
      bankingDetails.recipient_code = recipientCode;

      const { seller_info, subaccount_details } = generateSellerInfo(bankingDetails);

      return new Response(JSON.stringify({
        success: true,
        recipient_code: recipientCode,
        message: 'Mock recipient created - Ready for manual payment (Development Mode)',
        development_mode: true,
        payment_breakdown: paymentBreakdown,
        ...{ seller_info, subaccount_details },
        payout_timeline: {
          orders_delivered: completedOrders.length,
          total_amount_due: sellerAmount,
          recipient_created: new Date().toISOString(),
          ready_for_payout: new Date().toISOString(),
          next_steps: 'Mock recipient created - Manual payment processing can now be initiated (Dev Mode)'
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

    // Update banking details with new recipient code
    bankingDetails.recipient_code = recipientCode;

    const { seller_info, subaccount_details } = generateSellerInfo(bankingDetails);

    return new Response(JSON.stringify({
      success: true,
      recipient_code: recipientCode,
      message: 'PayStack recipient created - Ready for manual payment',
      payment_breakdown: paymentBreakdown,
      ...{ seller_info, subaccount_details },
      payout_timeline: {
        orders_delivered: completedOrders.length,
        total_amount_due: sellerAmount,
        recipient_created: new Date().toISOString(),
        ready_for_payout: new Date().toISOString(),
        next_steps: 'Paystack recipient created - Manual payment processing can now be initiated'
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
