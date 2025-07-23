import { handleCORS, createSupabaseClient, logEvent, parseRequestBody } from './_lib/utils.js';

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

    // Prepare email template based on action
    const emailTemplate = action === 'approve' 
      ? {
          subject: '🎉 Your Payment is on the Way!',
          template: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 28px;">🎉 Great News!</h1>
                <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Your payout has been approved</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                <h2 style="color: #1f2937; margin-top: 0;">Payment Status Update</h2>
                <p style="color: #4b5563; line-height: 1.6; margin-bottom: 15px;">
                  We're excited to let you know that your seller payout has been approved and processed!
                </p>
                <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10B981;">
                  <p style="margin: 0; color: #059669; font-weight: 600;">✅ ${message}</p>
                </div>
              </div>
              
              <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                <h3 style="color: #0369a1; margin-top: 0;">What happens next?</h3>
                <ul style="color: #075985; line-height: 1.6; padding-left: 20px;">
                  <li>Your payment will be transferred to your registered bank account</li>
                  <li>Processing typically takes 1-3 business days</li>
                  <li>You'll receive a confirmation once the transfer is complete</li>
                </ul>
              </div>
              
              <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; margin: 0;">Thank you for being part of our marketplace!</p>
                <p style="color: #9ca3af; font-size: 14px; margin: 5px 0 0 0;">Payout ID: ${payoutId}</p>
              </div>
            </div>
          `
        }
      : {
          subject: '⚠️ Payout Processing Update',
          template: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #EF4444, #DC2626); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 28px;">⚠️ Payout Update</h1>
                <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Important information about your payout</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                <h2 style="color: #1f2937; margin-top: 0;">Payout Status Update</h2>
                <p style="color: #4b5563; line-height: 1.6; margin-bottom: 15px;">
                  We need to inform you about an issue with your recent payout request.
                </p>
                <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #EF4444;">
                  <p style="margin: 0; color: #DC2626; font-weight: 600;">❌ ${message}</p>
                </div>
              </div>
              
              <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                <h3 style="color: #92400e; margin-top: 0;">What we're doing:</h3>
                <ul style="color: #a16207; line-height: 1.6; padding-left: 20px;">
                  <li>Our team is investigating the issue</li>
                  <li>We'll contact you directly to resolve this</li>
                  <li>No action is required from your side at this time</li>
                </ul>
              </div>
              
              <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; margin: 0;">We apologize for any inconvenience and appreciate your patience.</p>
                <p style="color: #9ca3af; font-size: 14px; margin: 5px 0 0 0;">Payout ID: ${payoutId}</p>
              </div>
            </div>
          `
        };

    // Call Supabase edge function to send email
    const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        to: 'seller@example.com', // This should be fetched from the payout request
        subject: emailTemplate.subject,
        html: emailTemplate.template,
        type: 'payout_notification'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send email');
    }

    const result = await response.json();

    return res.status(200).json({
      success: true,
      message: `Payout ${action} notification sent successfully`,
      payoutId,
      action,
      emailSent: true
    });

  } catch (error) {
    console.error('Error sending payout email:', error);
    return res.status(500).json({
      error: 'Failed to send payout notification',
      details: error.message,
    });
  }
}
