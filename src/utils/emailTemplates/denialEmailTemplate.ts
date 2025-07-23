export interface DenialEmailData {
  sellerName: string;
  bookTitle: string;
  orderId: string;
  denialReason: string;
  sellerEarnings: number;
  orderDate: string;
  deliveryDate: string;
}

export const createDenialEmailTemplate = (data: DenialEmailData): { subject: string; html: string; text: string } => {
  const subject = "Delivery Issue – Payment Delayed";
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Delayed - ReBooked Solutions</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #65c69f 0%, #44ab83 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background: #fff;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
        }
        .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 8px 8px;
            font-size: 14px;
            color: #6b7280;
        }
        .alert {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .order-details {
            background: #f8fafc;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .order-details h3 {
            margin-top: 0;
            color: #1f2937;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .contact-info {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            color: #1e40af;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0; font-size: 24px;">📚 ReBooked Solutions</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Payment Update</p>
    </div>
    
    <div class="content">
        <h2 style="color: #dc2626; margin-top: 0;">Payment Temporarily Delayed</h2>
        
        <p>Hi <strong>${data.sellerName}</strong>,</p>
        
        <p>We're writing to inform you about a temporary delay in processing your payment for a recent book sale.</p>
        
        <div class="alert">
            <strong>⚠️ Issue Identified:</strong> There was an issue with the delivery of your book that requires our review before we can process your payment.
        </div>
        
        <div class="order-details">
            <h3>📋 Order Details</h3>
            <div class="detail-row">
                <span><strong>Order ID:</strong></span>
                <span>${data.orderId}</span>
            </div>
            <div class="detail-row">
                <span><strong>Book Title:</strong></span>
                <span>${data.bookTitle}</span>
            </div>
            <div class="detail-row">
                <span><strong>Expected Earnings:</strong></span>
                <span>R${data.sellerEarnings.toFixed(2)}</span>
            </div>
            <div class="detail-row">
                <span><strong>Order Date:</strong></span>
                <span>${new Date(data.orderDate).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
                <span><strong>Delivery Date:</strong></span>
                <span>${new Date(data.deliveryDate).toLocaleDateString()}</span>
            </div>
        </div>
        
        <div class="alert">
            <strong>Reason for Delay:</strong><br>
            ${data.denialReason}
        </div>
        
        <h3>🔍 What happens next?</h3>
        <ul>
            <li><strong>Investigation:</strong> Our team is reviewing the delivery issue to determine the best course of action</li>
            <li><strong>Resolution:</strong> We'll work to resolve this matter fairly for both you and the buyer</li>
            <li><strong>Communication:</strong> We'll keep you updated throughout the process</li>
            <li><strong>Payment:</strong> Once resolved, we'll process your payment immediately</li>
        </ul>
        
        <div class="contact-info">
            <strong>📞 Need to discuss this?</strong><br>
            If you have any questions or additional information about this order, please don't hesitate to contact our support team. We're here to help resolve this quickly and fairly.
        </div>
        
        <p>We understand this delay may be inconvenient, and we appreciate your patience while we work to resolve this matter. Our goal is to ensure a fair outcome for everyone involved.</p>
        
        <p>Thank you for being part of the ReBooked Solutions community.</p>
        
        <p>Best regards,<br>
        <strong>The ReBooked Solutions Team</strong></p>
    </div>
    
    <div class="footer">
        <p><strong>ReBooked Solutions</strong><br>
        Connecting students with affordable textbooks</p>
        <p>📧 support@rebookedsolutions.co.za | 🌐 www.rebookedsolutions.co.za</p>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 15px;">
            This email was sent regarding order ${data.orderId}. Please keep this email for your records.
        </p>
    </div>
</body>
</html>
  `;

  const text = `
ReBooked Solutions - Payment Delayed

Hi ${data.sellerName},

We're writing to inform you about a temporary delay in processing your payment for a recent book sale.

ISSUE IDENTIFIED:
There was an issue with the delivery of your book that requires our review before we can process your payment.

ORDER DETAILS:
- Order ID: ${data.orderId}
- Book Title: ${data.bookTitle}
- Expected Earnings: R${data.sellerEarnings.toFixed(2)}
- Order Date: ${new Date(data.orderDate).toLocaleDateString()}
- Delivery Date: ${new Date(data.deliveryDate).toLocaleDateString()}

REASON FOR DELAY:
${data.denialReason}

WHAT HAPPENS NEXT:
1. Investigation: Our team is reviewing the delivery issue to determine the best course of action
2. Resolution: We'll work to resolve this matter fairly for both you and the buyer
3. Communication: We'll keep you updated throughout the process
4. Payment: Once resolved, we'll process your payment immediately

NEED TO DISCUSS THIS?
If you have any questions or additional information about this order, please don't hesitate to contact our support team. We're here to help resolve this quickly and fairly.

We understand this delay may be inconvenient, and we appreciate your patience while we work to resolve this matter. Our goal is to ensure a fair outcome for everyone involved.

Thank you for being part of the ReBooked Solutions community.

Best regards,
The ReBooked Solutions Team

ReBooked Solutions
Connecting students with affordable textbooks
Email: support@rebookedsolutions.co.za
Website: www.rebookedsolutions.co.za

This email was sent regarding order ${data.orderId}. Please keep this email for your records.
  `;

  return { subject, html, text };
};

// Example usage:
export const sendDenialEmail = async (emailData: DenialEmailData) => {
  const template = createDenialEmailTemplate(emailData);
  
  // This would integrate with your email service
  console.log("Sending denial email:", {
    to: "seller@example.com", // Would be emailData.sellerEmail
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
  
  // Example integration with Supabase Edge Function
  // const response = await supabase.functions.invoke('send-email', {
  //   body: {
  //     to: emailData.sellerEmail,
  //     subject: template.subject,
  //     html: template.html,
  //     text: template.text,
  //   }
  // });
  
  return template;
};
