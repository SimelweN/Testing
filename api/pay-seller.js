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

    // Make request to the Supabase edge function
    const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/pay-seller`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error calling pay-seller function:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}
