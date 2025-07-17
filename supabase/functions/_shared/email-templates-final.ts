import { EmailTemplateName, EMAIL_TEMPLATES } from "./email-types.ts";

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

export function renderTemplate(
  templateName: EmailTemplateName,
  data: TemplateData,
): { html: string; text: string } {
  switch (templateName) {
    case EMAIL_TEMPLATES.ORDER_CONFIRMATION:
      return renderNewOrderConfirmationTemplate(data);
    case EMAIL_TEMPLATES.WELCOME:
      return renderNewWelcomeTemplate(data);
    case EMAIL_TEMPLATES.SHIPPING_NOTIFICATION:
      return renderNewShippingNotificationTemplate(data);
    case EMAIL_TEMPLATES.SELLER_PICKUP_NOTIFICATION:
      return renderNewSellerPickupNotificationTemplate(data);
    case EMAIL_TEMPLATES.BUYER_ORDER_CONFIRMED:
      return renderNewBuyerOrderConfirmedTemplate(data);
    case EMAIL_TEMPLATES.COMMIT_CONFIRMATION_BASIC:
      return renderNewCommitConfirmationBasicTemplate(data);
    case EMAIL_TEMPLATES.ORDER_COMMITTED_BUYER:
      return renderNewOrderCommittedBuyerTemplate(data);
    case EMAIL_TEMPLATES.ORDER_COMMITTED_SELLER:
      return renderNewOrderCommittedSellerTemplate(data);
    case EMAIL_TEMPLATES.SELLER_NEW_ORDER:
      return renderNewSellerNewOrderTemplate(data);
    case EMAIL_TEMPLATES.BUYER_ORDER_PENDING:
      return renderNewBuyerOrderPendingTemplate(data);
    default:
      throw new Error(`Template not found: ${templateName}`);
  }
}

// 1. ORDER CONFIRMATION TEMPLATE - COMPLETELY REWRITTEN
function renderNewOrderConfirmationTemplate(data: TemplateData): {
  html: string;
  text: string;
} {
  const { orderNumber, customerName, items, total, estimatedDelivery } = data;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmation - ReBooked Solutions</title>
  ${getNewReBookedStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
      <p>Thank you for your purchase, ${customerName}!</p>
    </div>
    
    <h2>Order #${orderNumber}</h2>
    <p>Your order has been confirmed and is being processed.</p>
    
    <h3>Order Details:</h3>
    ${
      Array.isArray(items) && items.length > 0
        ? items
            .map(
              (item: any) => `
        <div style="border-bottom: 1px solid #ddd; padding: 10px 0;">
          <strong>${item.name || "Item"}</strong><br>
          Quantity: ${item.quantity || 1} × R${item.price || 0}<br>
          Subtotal: R${((item.quantity || 1) * (item.price || 0)).toFixed(2)}
        </div>
      `,
            )
            .join("")
        : '<div style="padding: 10px 0;">No items found</div>'
    }
    
    <div class="total">
      <p>Total: R${total}</p>
    </div>
    
    ${estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>` : ""}
    
    <p>We'll send you another email when your order ships with tracking information.</p>
    
    ${getNewReBookedSignature()}
  </div>
</body>
</html>`;

  const text = `
Order Confirmed!

Thank you for your purchase, ${customerName}!

Order #${orderNumber}

Your order has been confirmed and is being processed.

Order Details:
${Array.isArray(items) ? items.map((item: any) => `${item.name || "Item"} - Quantity: ${item.quantity || 1} × R${item.price || 0} = R${((item.quantity || 1) * (item.price || 0)).toFixed(2)}`).join("\n") : "No items found"}

Total: R${total}

${estimatedDelivery ? `Estimated Delivery: ${estimatedDelivery}` : ""}

We'll send you another email when your order ships with tracking information.

${getNewTextSignature()}`;

  return { html, text };
}

// 2. WELCOME TEMPLATE - COMPLETELY REWRITTEN
function renderNewWelcomeTemplate(data: TemplateData): {
  html: string;
  text: string;
} {
  const { userName, loginUrl } = data;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to ReBooked Solutions</title>
  ${getNewReBookedStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to ReBooked Solutions!</h1>
    </div>
    
    <h2>Hello ${userName}!</h2>
    <p>Welcome to ReBooked Solutions - your marketplace for buying and selling textbooks.</p>
    
    <div class="info-box">
      <h3>Here's what you can do:</h3>
      <ul>
        <li>Browse thousands of affordable textbooks</li>
        <li>Sell your used textbooks to other students</li>
        <li>Connect with students from universities across South Africa</li>
        <li>Track your orders and manage your account</li>
      </ul>
    </div>
    
    <p>Ready to get started?</p>
    ${loginUrl ? `<a href="${loginUrl}" class="btn">Login to Your Account</a>` : ""}
    
    <p>If you have any questions, feel free to contact our support team.</p>
    
    ${getNewReBookedSignature()}
  </div>
</body>
</html>`;

  const text = `
Welcome to ReBooked Solutions!

Hello ${userName}!

Welcome to ReBooked Solutions - your marketplace for buying and selling textbooks.

Here's what you can do:
- Browse thousands of affordable textbooks
- Sell your used textbooks to other students
- Connect with students from universities across South Africa
- Track your orders and manage your account

${loginUrl ? `Login to your account: ${loginUrl}` : ""}

If you have any questions, feel free to contact our support team.

${getNewTextSignature()}`;

  return { html, text };
}

// 3. SHIPPING NOTIFICATION TEMPLATE - COMPLETELY REWRITTEN
function renderNewShippingNotificationTemplate(data: TemplateData): {
  html: string;
  text: string;
} {
  const {
    customerName,
    orderNumber,
    trackingNumber,
    carrier,
    estimatedDelivery,
  } = data;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Order Has Shipped - ReBooked Solutions</title>
  ${getNewReBookedStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 Your Order Has Shipped!</h1>
    </div>
    
    <h2>Hello ${customerName}!</h2>
    <p>Great news! Your order #${orderNumber} has been shipped and is on its way to you.</p>
    
    <div class="info-box">
      <h3>📱 Tracking Information</h3>
      <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
      <p><strong>Carrier:</strong> ${carrier}</p>
      ${estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>` : ""}
    </div>
    
    <p>You can track your package using the tracking number above on the ${carrier} website.</p>
    
    <p>Thank you for choosing ReBooked Solutions!</p>
    
    ${getNewReBookedSignature()}
  </div>
</body>
</html>`;

  const text = `
Your Order Has Shipped!

Hello ${customerName}!

Great news! Your order #${orderNumber} has been shipped and is on its way to you.

Tracking Information:
Tracking Number: ${trackingNumber}
Carrier: ${carrier}
${estimatedDelivery ? `Estimated Delivery: ${estimatedDelivery}` : ""}

You can track your package using the tracking number above on the ${carrier} website.

Thank you for choosing ReBooked Solutions!

${getNewTextSignature()}`;

  return { html, text };
}

// 4. SELLER NEW ORDER TEMPLATE - COMPLETELY REWRITTEN
function renderNewSellerNewOrderTemplate(data: TemplateData): {
  html: string;
  text: string;
} {
  const {
    sellerName,
    buyerName,
    orderId,
    items,
    totalAmount,
    expiresAt,
    commitUrl,
  } = data;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Order - Action Required</title>
  ${getNewReBookedStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 New Order - Action Required!</h1>
    </div>
    
    <h2>Hi ${sellerName}!</h2>
    <p>Great news! You have a new order from <strong>${buyerName}</strong>.</p>

    <div class="info-box">
      <h3>📋 Order Details</h3>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Buyer:</strong> ${buyerName}</p>
      <p><strong>Total Amount:</strong> R${totalAmount}</p>
    </div>

    <div class="warning">
      <h3>⏰ Action Required Within 48 Hours</h3>
      <p><strong>Expires:</strong> ${new Date(expiresAt).toLocaleString()}</p>
      <p>You must commit to this order within 48 hours or it will be automatically cancelled.</p>
    </div>

    <p>Once you commit, we'll arrange pickup and you'll be paid after delivery!</p>

    ${commitUrl ? `<a href="${commitUrl}" class="btn">Commit to Order</a>` : ""}

    <p><strong>ReBooked Solutions Team</strong></p>
    
    ${getNewReBookedSignature()}
  </div>
</body>
</html>`;

  const text = `
New Order - Action Required!

Hi ${sellerName}!

Great news! You have a new order from ${buyerName}.

Order Details:
- Order ID: ${orderId}
- Buyer: ${buyerName}
- Total Amount: R${totalAmount}

⏰ Action Required Within 48 Hours
Expires: ${new Date(expiresAt).toLocaleString()}

You must commit to this order within 48 hours or it will be automatically cancelled.

Once you commit, we'll arrange pickup and you'll be paid after delivery!

${commitUrl ? `Commit to order: ${commitUrl}` : ""}

ReBooked Solutions Team

${getNewTextSignature()}`;

  return { html, text };
}

// 5. BUYER ORDER PENDING TEMPLATE - COMPLETELY REWRITTEN
function renderNewBuyerOrderPendingTemplate(data: TemplateData): {
  html: string;
  text: string;
} {
  const { buyerName, sellerName, orderId, items, totalAmount, statusUrl } =
    data;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmed - Awaiting Seller Response</title>
  ${getNewReBookedStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
    </div>
    
    <h2>Thank you, ${buyerName}!</h2>
    <p>Your order has been confirmed and <strong>${sellerName}</strong> has been notified.</p>

    <div class="info-box">
      <h3>📋 Order Details</h3>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Seller:</strong> ${sellerName}</p>
      <p><strong>Total Amount:</strong> R${totalAmount}</p>
    </div>

    <div class="steps">
      <h3>📦 What happens next?</h3>
      <ul>
        <li>The seller has 48 hours to commit to your order</li>
        <li>Once committed, we'll arrange pickup and delivery</li>
        <li>You'll receive tracking information via email</li>
        <li>Your book(s) will be delivered within 2-3 business days</li>
      </ul>
    </div>

    <p>We'll notify you as soon as the seller confirms your order!</p>

    ${statusUrl ? `<a href="${statusUrl}" class="btn">Check Order Status</a>` : ""}

    <p><strong>ReBooked Solutions Team</strong></p>
    
    ${getNewReBookedSignature()}
  </div>
</body>
</html>`;

  const text = `
Order Confirmed!

Thank you, ${buyerName}!

Your order has been confirmed and ${sellerName} has been notified.

Order Details:
- Order ID: ${orderId}
- Seller: ${sellerName}
- Total Amount: R${totalAmount}

What happens next?
- The seller has 48 hours to commit to your order
- Once committed, we'll arrange pickup and delivery
- You'll receive tracking information via email
- Your book(s) will be delivered within 2-3 business days

We'll notify you as soon as the seller confirms your order!

${statusUrl ? `Check order status: ${statusUrl}` : ""}

ReBooked Solutions Team

${getNewTextSignature()}`;

  return { html, text };
}

// 6. ORDER COMMITTED BUYER TEMPLATE - COMPLETELY REWRITTEN
function renderNewOrderCommittedBuyerTemplate(data: TemplateData): {
  html: string;
  text: string;
} {
  const { buyer_name, order_id, seller_name, book_titles, estimated_delivery } =
    data;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmed - Preparing for Delivery</title>
  ${getNewReBookedStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
    </div>
    
    <h2>Great news, ${buyer_name}!</h2>
    <p><strong>${seller_name}</strong> has confirmed your order and is preparing your book(s) for delivery.</p>

    <div class="info-box">
      <h3>📚 Order Details</h3>
      <p><strong>Order ID:</strong> ${order_id}</p>
      <p><strong>Book(s):</strong> ${book_titles}</p>
      <p><strong>Seller:</strong> ${seller_name}</p>
      <p><strong>Estimated Delivery:</strong> ${estimated_delivery}</p>
    </div>

    <p>We'll keep you updated throughout the delivery process!</p>

    <p>Happy reading! 📖</p>
    <p><strong>ReBooked Solutions Team</strong></p>
    
    ${getNewReBookedSignature()}
  </div>
</body>
</html>`;

  const text = `
Order Confirmed!

Great news, ${buyer_name}!

${seller_name} has confirmed your order and is preparing your book(s) for delivery.

Order Details:
- Order ID: ${order_id}
- Book(s): ${book_titles}
- Seller: ${seller_name}
- Estimated Delivery: ${estimated_delivery}

We'll keep you updated throughout the delivery process!

Happy reading!
ReBooked Solutions Team

${getNewTextSignature()}`;

  return { html, text };
}

// 7. ORDER COMMITTED SELLER TEMPLATE - COMPLETELY REWRITTEN
function renderNewOrderCommittedSellerTemplate(data: TemplateData): {
  html: string;
  text: string;
} {
  const {
    seller_name,
    order_id,
    buyer_name,
    book_titles,
    pickup_instructions,
  } = data;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Commitment Confirmed - Prepare for Pickup</title>
  ${getNewReBookedStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Order Commitment Confirmed!</h1>
    </div>
    
    <h2>Thank you, ${seller_name}!</h2>
    <p>You've successfully committed to sell your book(s). The buyer has been notified and pickup has been scheduled.</p>

    <div class="info-box">
      <h3>📋 Order Details</h3>
      <p><strong>Order ID:</strong> ${order_id}</p>
      <p><strong>Book(s):</strong> ${book_titles}</p>
      <p><strong>Buyer:</strong> ${buyer_name}</p>
    </div>

    <div class="steps">
      <h3>📦 Next Steps</h3>
      <p>${pickup_instructions}</p>
    </div>

    <p>Thank you for selling with ReBooked Solutions! 📚</p>
    <p><strong>ReBooked Solutions Team</strong></p>
    
    ${getNewReBookedSignature()}
  </div>
</body>
</html>`;

  const text = `
Order Commitment Confirmed!

Thank you, ${seller_name}!

You've successfully committed to sell your book(s). The buyer has been notified and pickup has been scheduled.

Order Details:
- Order ID: ${order_id}
- Book(s): ${book_titles}
- Buyer: ${buyer_name}

${pickup_instructions}

Thank you for selling with ReBooked Solutions!
ReBooked Solutions Team

${getNewTextSignature()}`;

  return { html, text };
}

// 8. SELLER PICKUP NOTIFICATION TEMPLATE - COMPLETELY REWRITTEN
function renderNewSellerPickupNotificationTemplate(data: TemplateData): {
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

// 9. BUYER ORDER CONFIRMED TEMPLATE - COMPLETELY REWRITTEN
function renderNewBuyerOrderConfirmedTemplate(data: TemplateData): {
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

// 10. COMMIT CONFIRMATION BASIC TEMPLATE - COMPLETELY REWRITTEN
function renderNewCommitConfirmationBasicTemplate(data: TemplateData): {
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
