import { handleCORS, createSupabaseClient, logEvent } from './_lib/utils.js';

export default async function handler(req, res) {
  handleCORS(req, res);
  if (req.method === 'OPTIONS') return;

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed. Use GET.' 
    });
  }

  try {
    const supabase = createSupabaseClient();

    console.log('Fetching sellers with delivered orders...');

    // Get all orders that have been delivered
    const { data: deliveredOrders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        seller_id,
        seller_name,
        seller_email,
        delivery_status,
        status
      `)
      .eq('delivery_status', 'delivered')
      .eq('status', 'delivered');

    if (ordersError) {
      throw new Error(`Failed to fetch delivered orders: ${ordersError.message}`);
    }

    if (!deliveredOrders || deliveredOrders.length === 0) {
      return res.status(200).json({
        success: true,
        sellers: [],
        message: 'No delivered orders found'
      });
    }

    // Group orders by seller and count them
    const sellerOrderCounts = deliveredOrders.reduce((acc, order) => {
      const sellerId = order.seller_id;
      if (!acc[sellerId]) {
        acc[sellerId] = {
          id: sellerId,
          name: order.seller_name || `Seller ${sellerId}`,
          email: order.seller_email || 'unknown@email.com',
          orders: 0
        };
      }
      acc[sellerId].orders++;
      return acc;
    }, {});

    const sellersWithOrders = Object.values(sellerOrderCounts);
    console.log('Found sellers with delivered orders:', sellersWithOrders.length);

    // For each seller, check if they have banking details
    const sellersWithBanking = await Promise.all(
      sellersWithOrders.map(async (seller) => {
        try {
          const { data: bankingData, error: bankingError } = await supabase
            .from('banking_subaccounts')
            .select('user_id, business_name, email, status')
            .eq('user_id', seller.id)
            .maybeSingle();

          return {
            ...seller,
            has_banking: !bankingError && bankingData !== null,
            banking_status: bankingData?.status || 'none',
            business_name: bankingData?.business_name || seller.name
          };
        } catch (error) {
          console.error(`Error checking banking for seller ${seller.id}:`, error);
          return {
            ...seller,
            has_banking: false,
            banking_status: 'error'
          };
        }
      })
    );

    // Sort by: banking details first, then by order count
    const sortedSellers = sellersWithBanking.sort((a, b) => {
      if (a.has_banking && !b.has_banking) return -1;
      if (!a.has_banking && b.has_banking) return 1;
      return b.orders - a.orders;
    });

    const eligibleSellers = sortedSellers.filter(seller => seller.has_banking);
    
    console.log('Sellers with banking details:', eligibleSellers.length);
    console.log('Total sellers with delivered orders:', sortedSellers.length);

    return res.status(200).json({
      success: true,
      sellers: sortedSellers,
      eligible_count: eligibleSellers.length,
      total_count: sortedSellers.length,
      message: `Found ${sortedSellers.length} sellers with delivered orders, ${eligibleSellers.length} have banking details`
    });

  } catch (error) {
    console.error('Error fetching sellers with delivered orders:', error);
    logEvent('get_sellers_with_delivered_orders_error', { error: error.message });
    
    return res.status(500).json({
      error: 'Failed to fetch sellers with delivered orders',
      details: error.message,
    });
  }
}
