import { handleCORS } from './_lib/utils.js';

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
    // Mock payout data for testing
    const mockPayouts = [
      {
        id: 'payout_001',
        seller_id: 'seller_123',
        seller_name: 'John Doe',
        seller_email: 'john.doe@email.com',
        total_amount: 450.00,
        order_count: 3,
        created_at: new Date().toISOString(),
        status: 'pending',
        recipient_code: 'RCP_1234567890',
        orders: [
          {
            id: 'order_001',
            book_title: 'Physics Textbook',
            amount: 200.00,
            delivered_at: new Date().toISOString(),
            buyer_email: 'buyer1@email.com'
          },
          {
            id: 'order_002', 
            book_title: 'Mathematics Guide',
            amount: 150.00,
            delivered_at: new Date().toISOString(),
            buyer_email: 'buyer2@email.com'
          },
          {
            id: 'order_003',
            book_title: 'Chemistry Notes',
            amount: 100.00,
            delivered_at: new Date().toISOString(),
            buyer_email: 'buyer3@email.com'
          }
        ]
      },
      {
        id: 'payout_002',
        seller_id: 'seller_456',
        seller_name: 'Jane Smith',
        seller_email: 'jane.smith@email.com',
        total_amount: 270.00,
        order_count: 2,
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        status: 'approved',
        recipient_code: 'RCP_0987654321',
        orders: [
          {
            id: 'order_004',
            book_title: 'Biology Handbook',
            amount: 180.00,
            delivered_at: new Date(Date.now() - 86400000).toISOString(),
            buyer_email: 'buyer4@email.com'
          },
          {
            id: 'order_005',
            book_title: 'English Literature',
            amount: 90.00,
            delivered_at: new Date(Date.now() - 86400000).toISOString(),
            buyer_email: 'buyer5@email.com'
          }
        ]
      }
    ];

    return res.status(200).json({
      success: true,
      payouts: mockPayouts,
      total: mockPayouts.length
    });

  } catch (error) {
    console.error('Error fetching mock payout data:', error);
    return res.status(500).json({
      error: 'Failed to fetch payout data',
      details: error.message,
    });
  }
}
