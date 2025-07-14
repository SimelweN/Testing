export interface TemplateData {
  [key: string]: any;
}

function renderSellerPickupNotificationTemplate(data: TemplateData): {
  html: string;
  text: string;
} {
  const {
    sellerName,
    bookTitle,
    orderId,
    pickupDate,
    pickupTimeWindow,
    courierProvider,
    trackingNumber,
    shippingLabelUrl,
    pickupAddress,
  } = data;

  const courierDisplayName =
    courierProvider === "courier-guy" ? "Courier Guy" : "Fastway";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Courier Pickup Scheduled</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2d6e55; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 14px; }
        .info-box { background: white; border: 2px solid #2d6e55; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .btn { background: #2d6e55; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
        .steps { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .steps ol { margin: 0; padding-left: 20px; }
        .emoji { font-size: 18px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1><span class="emoji">📦</span> Courier Pickup Scheduled!</h1>
        </div>
        <div class="content">
          <h2>Hi ${sellerName}!</h2>
          <p>Great news! Your order commitment has been processed and a courier pickup has been automatically scheduled.</p>
          
          <div class="info-box">
            <h3><span class="emoji">📋</span> Order Details</h3>
            <p><strong>Book:</strong> ${bookTitle}</p>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
          </div>
          
          <div class="info-box">
            <h3><span class="emoji">🚚</span> Pickup Information</h3>
            <p><strong>Courier:</strong> ${courierDisplayName}</p>
            <p><strong>Pickup Date:</strong> ${pickupDate}</p>
            <p><strong>Time Window:</strong> ${pickupTimeWindow}</p>
            <p><strong>Address:</strong><br>
              ${pickupAddress?.streetAddress || "Your registered address"}<br>
              ${pickupAddress?.city ? `${pickupAddress.city}, ${pickupAddress.province}` : ""}
            </p>
          </div>
          
          ${
            shippingLabelUrl
              ? `
          <div style="text-align: center; margin: 20px 0;">
            <a href="${shippingLabelUrl}" class="btn" target="_blank">
              <span class="emoji">📄</span> Download Shipping Label (PDF)
            </a>
          </div>
          `
              : ""
          }
          
          <div class="steps">
            <h3><span class="emoji">📋</span> What You Need To Do:</h3>
            <ol>
              <li><strong>Download the shipping label</strong> using the button above</li>
              <li><strong>Print the label</strong> and attach it securely to your package</li>
              <li><strong>Package the book</strong> safely with bubble wrap or padding</li>
              <li><strong>Be available</strong> during the pickup time window</li>
              <li><strong>Hand over</strong> the packaged book to the courier</li>
            </ol>
          </div>
          
          <div class="info-box">
            <h3><span class="emoji">📱</span> Track Your Shipment</h3>
            <p>Use tracking number <strong>${trackingNumber}</strong> on the ${courierDisplayName} website.</p>
          </div>
          
          <p>If you have any questions or the courier doesn't arrive during the scheduled window, please contact our support team.</p>
          
          <p>Happy selling! <span class="emoji">📚</span></p>
          <p><strong>ReBooked Solutions Team</strong></p>
        </div>
        <div class="footer">
          <p>ReBooked Solutions | noreply@rebookedsolutions.co.za</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Courier Pickup Scheduled! 

Hi ${sellerName},

Your order commitment has been processed and courier pickup scheduled.

Order Details:
- Book: ${bookTitle}
- Order ID: ${orderId}
- Tracking: ${trackingNumber}

Pickup Information:
- Courier: ${courierDisplayName}
- Date: ${pickupDate}
- Time: ${pickupTimeWindow}

${shippingLabelUrl ? `Download your shipping label: ${shippingLabelUrl}` : ""}

Steps:
1. Download & print the shipping label
2. Package the book securely
3. Be available during pickup time
4. Hand over to courier

Questions? Contact our support team.

ReBooked Solutions
  `;

  return { html, text };
}

function renderBuyerOrderConfirmedTemplate(data: TemplateData): {
  html: string;
  text: string;
} {
  const { buyerName, bookTitle, orderId, sellerName, expectedDelivery } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your Order is Confirmed</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2d6e55; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 14px; }
        .info-box { background: white; border: 2px solid #2d6e55; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .steps { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .emoji { font-size: 18px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1><span class="emoji">🎉</span> Your Order is Confirmed!</h1>
        </div>
        <div class="content">
          <h2>Hi ${buyerName}!</h2>
          <p>Excellent news! <strong>${sellerName}</strong> has confirmed your order and your book is being prepared for shipment.</p>
          
          <div class="info-box">
            <h3><span class="emoji">📚</span> Your Order</h3>
            <p><strong>Book:</strong> ${bookTitle}</p>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Seller:</strong> ${sellerName}</p>
            <p><strong>Expected Delivery:</strong> ${expectedDelivery}</p>
          </div>
          
          <div class="steps">
            <h3><span class="emoji">📦</span> What Happens Next?</h3>
            <ul>
              <li>The seller packages your book securely</li>
              <li>Courier picks up the package from the seller</li>
              <li>You'll receive tracking information via email</li>
              <li>Your book will be delivered within ${expectedDelivery}</li>
            </ul>
          </div>
          
          <p>We'll keep you updated throughout the delivery process. If you have any questions, our support team is here to help!</p>
          
          <p>Happy reading! <span class="emoji">📖</span></p>
          <p><strong>ReBooked Solutions Team</strong></p>
        </div>
        <div class="footer">
          <p>ReBooked Solutions | noreply@rebookedsolutions.co.za</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Your Order is Confirmed! 

Hi ${buyerName}, 

${sellerName} has confirmed your order for "${bookTitle}". 

Order ID: ${orderId}
Expected delivery: ${expectedDelivery}

We'll keep you updated with tracking information.

ReBooked Solutions
  `;

  return { html, text };
}

function renderCommitConfirmationBasicTemplate(data: TemplateData): {
  html: string;
  text: string;
} {
  const { sellerName, bookTitle, orderId, buyerEmail } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Commitment Confirmed</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2d6e55; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 14px; }
        .info-box { background: white; border: 2px solid #2d6e55; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .emoji { font-size: 18px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1><span class="emoji">✅</span> Order Commitment Confirmed</h1>
        </div>
        <div class="content">
          <h2>Hi ${sellerName}!</h2>
          <p>You have successfully committed to sell <strong>"${bookTitle}"</strong></p>
          
          <div class="info-box">
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Buyer:</strong> ${buyerEmail}</p>
          </div>
          
          <h3>Next Steps:</h3>
          <ul>
            <li>We'll arrange courier pickup within 24 hours</li>
            <li>You'll receive pickup details via email</li>
            <li>Prepare your book for shipping</li>
          </ul>
          
          <p>Best regards,<br><strong>ReBooked Solutions</strong></p>
        </div>
        <div class="footer">
          <p>ReBooked Solutions | noreply@rebookedsolutions.co.za</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Order Commitment Confirmed. 

Hi ${sellerName}, you have committed to sell "${bookTitle}". 

Order ID: ${orderId}
Buyer: ${buyerEmail}

We'll arrange courier pickup within 24 hours.

ReBooked Solutions
  `;

  return { html, text };
}

export {
  renderSellerPickupNotificationTemplate,
  renderBuyerOrderConfirmedTemplate,
  renderCommitConfirmationBasicTemplate,
};
