import { handleCORS, parseRequestBody } from './_lib/utils.js';

export default async function handler(req, res) {
  handleCORS(req, res);
  if (req.method === 'OPTIONS') return;

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const body = await parseRequestBody(req);
    const { payoutId, action, message } = body;

    if (!payoutId || !action || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: payoutId, action, message' 
      });
    }

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock successful email sending
    console.log(`Mock email sent for payout ${payoutId}: ${action} - ${message}`);

    return res.status(200).json({
      success: true,
      message: `Payout ${action} notification sent successfully (Mock)`,
      payoutId,
      action,
      emailSent: true,
      mock: true
    });

  } catch (error) {
    console.error('Error in mock email API:', error);
    return res.status(500).json({
      error: 'Failed to send payout notification',
      details: error.message,
    });
  }
}
