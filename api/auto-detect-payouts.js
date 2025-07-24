import { handleCORS, createSupabaseClient, logEvent } from './_lib/utils.js';

export default async function handler(req, res) {
  handleCORS(req, res);
  if (req.method === 'OPTIONS') return;

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST or GET.'
    });
  }

  try {
    const supabase = createSupabaseClient();

    // Fetch all orders with delivered status that don't have pending/approved payouts
    const { data: deliveredOrders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        seller_id,
        buyer_email,
        amount,
        delivery_status,
        delivery_data,
        created_at,
        committed_at,
        delivered_at
      `)
      .eq('delivery_status', 'delivered')
      .eq('status', 'delivered');

    if (ordersError) {
      throw new Error(`Failed to fetch delivered orders: ${ordersError.message}`);
    }

    if (!deliveredOrders || deliveredOrders.length === 0) {
      return res.status(200).json({
        message: 'No delivered orders found',
        payouts_created: 0,
        orders_processed: 0
      });
    }

    // Group orders by seller
    const ordersBySeller = deliveredOrders.reduce((acc, order) => {
      if (!acc[order.seller_id]) {
        acc[order.seller_id] = [];
      }
      acc[order.seller_id].push(order);
      return acc;
    }, {});

    const payoutResults = [];

    // Process each seller's orders
    for (const [sellerId, orders] of Object.entries(ordersBySeller)) {
      try {
        // Check if this seller already has a pending or approved payout
        const { data: existingPayouts, error: payoutCheckError } = await supabase
          .from('payout_requests')
          .select('id, status')
          .eq('seller_id', sellerId)
          .in('status', ['pending', 'approved']);

        if (payoutCheckError) {
          console.error(`Error checking existing payouts for seller ${sellerId}:`, payoutCheckError);
          continue;
        }

        // Skip if seller already has pending/approved payout
        if (existingPayouts && existingPayouts.length > 0) {
          console.log(`Seller ${sellerId} already has pending/approved payout, skipping`);
          continue;
        }

        // Get seller information from banking_subaccounts
        const { data: sellerInfo, error: sellerError } = await supabase
          .from('banking_subaccounts')
          .select('business_name, email, account_number, bank_name, bank_code')
          .eq('user_id', sellerId)
          .single();

        if (sellerError || !sellerInfo) {
          console.error(`No banking info found for seller ${sellerId}, skipping`);
          continue;
        }

        // Calculate total amount (90% of book sales - 10% commission)
        const totalBookSales = orders.reduce((sum, order) => sum + Number(order.amount), 0);
        const sellerAmount = totalBookSales * 0.9; // 90% to seller, 10% platform commission

        // Create recipient on Paystack first
        const recipientResponse = await fetch(`${process.env.SUPABASE_URL}/functions/v1/pay-seller`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ sellerId }),
        });

        if (!recipientResponse.ok) {
          console.error(`Failed to create recipient for seller ${sellerId}`);
          continue;
        }

        const recipientResult = await recipientResponse.json();

        // Create payout request record
        const { data: payoutRequest, error: payoutError } = await supabase
          .from('payout_requests')
          .insert({
            seller_id: sellerId,
            seller_name: sellerInfo.business_name || `Seller ${sellerId}`,
            seller_email: sellerInfo.email,
            total_amount: sellerAmount,
            order_count: orders.length,
            status: 'pending',
            recipient_code: recipientResult.recipient_code,
            order_ids: orders.map(o => o.id),
            created_at: new Date().toISOString(),
            payment_breakdown: recipientResult.payment_breakdown
          })
          .select()
          .single();

        if (payoutError) {
          console.error(`Error creating payout request for seller ${sellerId}:`, payoutError);
          continue;
        }

        payoutResults.push({
          seller_id: sellerId,
          seller_name: sellerInfo.business_name,
          total_amount: sellerAmount,
          order_count: orders.length,
          payout_id: payoutRequest.id,
          recipient_code: recipientResult.recipient_code
        });

        console.log(`Created payout request for seller ${sellerId}: ${payoutRequest.id}`);

      } catch (error) {
        console.error(`Error processing seller ${sellerId}:`, error);
        continue;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Auto-detection completed: ${payoutResults.length} payout requests created`,
      payouts_created: payoutResults.length,
      orders_processed: deliveredOrders.length,
      sellers_processed: Object.keys(ordersBySeller).length,
      results: payoutResults
    });

  } catch (error) {
    console.error('Error in auto-detect payouts:', error);
    return res.status(500).json({
      error: 'Failed to auto-detect payouts',
      details: error.message,
    });
  }
}
