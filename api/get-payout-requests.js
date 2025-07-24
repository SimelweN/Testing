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

    // Fetch all payout requests
    const { data: payoutRequests, error: payoutError } = await supabase
      .from('payout_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (payoutError) {
      throw new Error(`Failed to fetch payout requests: ${payoutError.message}`);
    }

    // For each payout request, fetch the associated order details
    const payoutsWithOrders = await Promise.all(
      (payoutRequests || []).map(async (payout) => {
        try {
          // Fetch order details for this payout
          const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select(`
              id,
              amount,
              delivery_data,
              buyer_email,
              delivered_at,
              book_data
            `)
            .in('id', payout.order_ids || []);

          if (ordersError) {
            console.error(`Error fetching orders for payout ${payout.id}:`, ordersError);
          }

          // Transform orders data to match expected format
          const transformedOrders = (orders || []).map(order => ({
            id: order.id,
            book_title: order.book_data?.title || 'Unknown Book',
            amount: Number(order.amount),
            delivered_at: order.delivered_at || new Date().toISOString(),
            buyer_email: order.buyer_email || 'Unknown'
          }));

          return {
            ...payout,
            orders: transformedOrders
          };
        } catch (error) {
          console.error(`Error processing payout ${payout.id}:`, error);
          return {
            ...payout,
            orders: []
          };
        }
      })
    );

    return res.status(200).json({
      success: true,
      payouts: payoutsWithOrders,
      total: payoutsWithOrders.length
    });

  } catch (error) {
    console.error('Error fetching payout requests:', error);
    return res.status(500).json({
      error: 'Failed to fetch payout requests',
      details: error.message,
    });
  }
}
