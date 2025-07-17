export interface TemplateData {
  [key: string]: any;
}

// EXACT STYLING AS REQUESTED - NO DEVIATIONS
const getNewReBookedStyles = () => `
<style>
  body {
    font-family: Arial, sans-serif;
    background-color: #f3fef7;
    padding: 20px;
    color: #1f4e3d;
  }
  .container {
    max-width: 500px;
    margin: auto;
    background-color: #ffffff;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  .btn {
    display: inline-block;
    padding: 12px 20px;
    background-color: #3ab26f;
    color: white;
    text-decoration: none;
    border-radius: 5px;
    margin-top: 20px;
    font-weight: bold;
  }
  .link {
    color: #3ab26f;
  }
  .header {
    background: #3ab26f;
    color: white;
    padding: 20px;
    text-align: center;
    border-radius: 10px 10px 0 0;
    margin: -30px -30px 20px -30px;
  }
  .footer {
    background: #f3fef7;
    color: #1f4e3d;
    padding: 20px;
    text-align: center;
    font-size: 12px;
    line-height: 1.5;
    margin: 30px -30px -30px -30px;
    border-radius: 0 0 10px 10px;
    border-top: 1px solid #e5e7eb;
  }
  .info-box {
    background: #f3fef7;
    border: 1px solid #3ab26f;
    padding: 15px;
    border-radius: 5px;
    margin: 15px 0;
  }
  .warning {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    padding: 10px;
    border-radius: 5px;
    margin: 10px 0;
  }
  .steps {
    background: #f3fef7;
    padding: 15px;
    border-radius: 5px;
    margin: 15px 0;
  }
  .steps ol {
    margin: 0;
    padding-left: 20px;
  }
  .total {
    font-weight: bold;
    font-size: 18px;
    color: #3ab26f;
  }
</style>
`;

const getNewReBookedSignature = () => `
<div class="footer">
  <p><strong>This is an automated message from ReBooked Solutions.</strong><br>
  Please do not reply to this email.</p>
  <p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>
  Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p>
  <p>T&Cs apply.</p>
  <p><em>"Pre-Loved Pages, New Adventures"</em></p>
</div>
`;

const getNewTextSignature = () => `

This is an automated message from ReBooked Solutions. Please do not reply to this email.
For assistance, contact: support@rebookedsolutions.co.za
Visit us at: https://rebookedsolutions.co.za
T&Cs apply.
"Pre-Loved Pages, New Adventures"
`;

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
  <title>Courier Pickup Scheduled - ReBooked Solutions</title>
  ${getNewReBookedStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 Courier Pickup Scheduled!</h1>
    </div>
    
    <h2>Hi ${sellerName}!</h2>
    <p>Great news! Your order commitment has been processed and a courier pickup has been automatically scheduled.</p>
    
    <div class="info-box">
      <h3>📋 Order Details</h3>
      <p><strong>Book:</strong> ${bookTitle}</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
    </div>
    
    <div class="info-box">
      <h3>🚚 Pickup Information</h3>
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
        📄 Download Shipping Label (PDF)
      </a>
    </div>
    `
        : ""
    }
    
    <div class="steps">
      <h3>📋 What You Need To Do:</h3>
      <ol>
        <li><strong>Download the shipping label</strong> using the button above</li>
        <li><strong>Print the label</strong> and attach it securely to your package</li>
        <li><strong>Package the book</strong> safely with bubble wrap or padding</li>
        <li><strong>Be available</strong> during the pickup time window</li>
        <li><strong>Hand over</strong> the packaged book to the courier</li>
      </ol>
    </div>
    
    <div class="info-box">
      <h3>📱 Track Your Shipment</h3>
      <p>Use tracking number <strong>${trackingNumber}</strong> on the ${courierDisplayName} website.</p>
    </div>
    
    <p>If you have any questions or the courier doesn't arrive during the scheduled window, please contact our support team.</p>
    
    <p>Happy selling! 📚</p>
    <p><strong>ReBooked Solutions Team</strong></p>
    
    ${getNewReBookedSignature()}
  </div>
</body>
</html>`;

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

${getNewTextSignature()}`;

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
  <title>Your Order is Confirmed - ReBooked Solutions</title>
  ${getNewReBookedStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Your Order is Confirmed!</h1>
    </div>
    
    <h2>Hi ${buyerName}!</h2>
    <p>Excellent news! <strong>${sellerName}</strong> has confirmed your order and your book is being prepared for shipment.</p>
    
    <div class="info-box">
      <h3>📚 Your Order</h3>
      <p><strong>Book:</strong> ${bookTitle}</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Seller:</strong> ${sellerName}</p>
      <p><strong>Expected Delivery:</strong> ${expectedDelivery}</p>
    </div>
    
    <div class="steps">
      <h3>📦 What Happens Next?</h3>
      <ul>
        <li>The seller packages your book securely</li>
        <li>Courier picks up the package from the seller</li>
        <li>You'll receive tracking information via email</li>
        <li>Your book will be delivered within ${expectedDelivery}</li>
      </ul>
    </div>
    
    <p>We'll keep you updated throughout the delivery process. If you have any questions, our support team is here to help!</p>
    
    <p>Happy reading! 📖</p>
    <p><strong>ReBooked Solutions Team</strong></p>
    
    ${getNewReBookedSignature()}
  </div>
</body>
</html>`;

  const text = `
Your Order is Confirmed! 

Hi ${buyerName}, 

${sellerName} has confirmed your order for "${bookTitle}". 

Order ID: ${orderId}
Expected delivery: ${expectedDelivery}

We'll keep you updated with tracking information.

ReBooked Solutions

${getNewTextSignature()}`;

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
  <title>Order Commitment Confirmed - ReBooked Solutions</title>
  ${getNewReBookedStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Order Commitment Confirmed</h1>
    </div>
    
    <h2>Hi ${sellerName}!</h2>
    <p>You have successfully committed to sell <strong>"${bookTitle}"</strong></p>
    
    <div class="info-box">
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Buyer:</strong> ${buyerEmail}</p>
    </div>
    
    <div class="steps">
      <h3>Next Steps:</h3>
      <ul>
        <li>We'll arrange courier pickup within 24 hours</li>
        <li>You'll receive pickup details via email</li>
        <li>Prepare your book for shipping</li>
      </ul>
    </div>
    
    <p>Best regards,<br><strong>ReBooked Solutions</strong></p>
    
    ${getNewReBookedSignature()}
  </div>
</body>
</html>`;

  const text = `
Order Commitment Confirmed. 

Hi ${sellerName}, you have committed to sell "${bookTitle}". 

Order ID: ${orderId}
Buyer: ${buyerEmail}

We'll arrange courier pickup within 24 hours.

ReBooked Solutions

${getNewTextSignature()}`;

  return { html, text };
}

export {
  renderSellerPickupNotificationTemplate,
  renderBuyerOrderConfirmedTemplate,
  renderCommitConfirmationBasicTemplate,
};
