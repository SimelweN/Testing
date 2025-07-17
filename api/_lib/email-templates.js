// Email templates for Vercel functions
export const EMAIL_TEMPLATES = {
  ORDER_CONFIRMATION: "order-confirmation",
  WELCOME: "welcome",
  PASSWORD_RESET: "password-reset",
  SHIPPING_NOTIFICATION: "shipping-notification",
  CONTACT_FORM: "contact-form",
  BOOKING_CONFIRMATION: "booking-confirmation",
  SELLER_PICKUP_NOTIFICATION: "seller-pickup-notification",
  BUYER_ORDER_CONFIRMED: "buyer-order-confirmed",
  COMMIT_CONFIRMATION_BASIC: "commit-confirmation-basic",
};

export function renderTemplate(templateName, data) {
  switch (templateName) {
    case EMAIL_TEMPLATES.SELLER_PICKUP_NOTIFICATION:
      return renderSellerPickupNotificationTemplate(data);

    case EMAIL_TEMPLATES.BUYER_ORDER_CONFIRMED:
      return renderBuyerOrderConfirmedTemplate(data);

    case EMAIL_TEMPLATES.COMMIT_CONFIRMATION_BASIC:
      return renderCommitConfirmationBasicTemplate(data);

    case EMAIL_TEMPLATES.ORDER_CONFIRMATION:
      return renderOrderConfirmationTemplate(data);

    case EMAIL_TEMPLATES.WELCOME:
      return renderWelcomeTemplate(data);

    case EMAIL_TEMPLATES.PASSWORD_RESET:
      return renderPasswordResetTemplate(data);

    case EMAIL_TEMPLATES.SHIPPING_NOTIFICATION:
      return renderShippingNotificationTemplate(data);

    case EMAIL_TEMPLATES.CONTACT_FORM:
      return renderContactFormTemplate(data);

    case EMAIL_TEMPLATES.BOOKING_CONFIRMATION:
      return renderBookingConfirmationTemplate(data);

    default:
      throw new Error(`Template not found: ${templateName}`);
  }
}

function renderSellerPickupNotificationTemplate(data) {
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
          
          <p>Happy selling! <span class="emoji">📚</span></p>
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

ReBooked Solutions
  `;

  return { html, text };
}

function renderBuyerOrderConfirmedTemplate(data) {
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
          
          <p>Happy reading! <span class="emoji">📖</span></p>
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

ReBooked Solutions
  `;

  return { html, text };
}

function renderCommitConfirmationBasicTemplate(data) {
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

function renderOrderConfirmationTemplate(data) {
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
              (item) => `
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
${Array.isArray(items) ? items.map((item) => `${item.name || "Item"} - Quantity: ${item.quantity || 1} × R${item.price || 0} = R${((item.quantity || 1) * (item.price || 0)).toFixed(2)}`).join("\n") : "No items found"}

Total: R${total}

${estimatedDelivery ? `Estimated Delivery: ${estimatedDelivery}` : ""}

We'll send you another email when your order ships with tracking information.

${getNewTextSignature()}`;

  return { html, text };
}

function renderWelcomeTemplate(data) {
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

function renderPasswordResetTemplate(data) {
  const { resetUrl, userName } = data;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Password Reset - ReBooked Solutions</title>
  ${getNewReBookedStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Password Reset Request</h1>
    </div>

    <h2>Hello ${userName || "User"}!</h2>
    <p>We received a request to reset your password for your ReBooked Solutions account.</p>

    <div class="info-box">
      <h3>Reset Your Password</h3>
      <p>Click the button below to reset your password. This link will expire in 24 hours.</p>
    </div>

    ${resetUrl ? `<a href="${resetUrl}" class="btn">Reset Password</a>` : ""}

    <p>If you didn't request this password reset, please ignore this email.</p>

    ${getNewReBookedSignature()}
  </div>
</body>
</html>`;

  const text = `
Password Reset Request

Hello ${userName || "User"}!

We received a request to reset your password for your ReBooked Solutions account.

Click here to reset your password: ${resetUrl}

This link will expire in 24 hours.

If you didn't request this password reset, please ignore this email.

${getNewTextSignature()}`;

  return { html, text };
}

function renderShippingNotificationTemplate(data) {
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

function renderContactFormTemplate(data) {
  const { email, message, name } = data;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Contact Form Submission - ReBooked Solutions</title>
  ${getNewReBookedStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📧 New Contact Form Submission</h1>
    </div>

    <h2>Contact Form Message</h2>

    <div class="info-box">
      <h3>Sender Information</h3>
      <p><strong>Name:</strong> ${name || "Not provided"}</p>
      <p><strong>Email:</strong> ${email}</p>
    </div>

    <div class="info-box">
      <h3>Message</h3>
      <p>${message}</p>
    </div>

    ${getNewReBookedSignature()}
  </div>
</body>
</html>`;

  const text = `
New Contact Form Submission

Sender Information:
Name: ${name || "Not provided"}
Email: ${email}

Message:
${message}

${getNewTextSignature()}`;

  return { html, text };
}

function renderBookingConfirmationTemplate(data) {
  const { bookingId, customerName, bookingDetails } = data;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Booking Confirmed - ReBooked Solutions</title>
  ${getNewReBookedStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Booking Confirmed!</h1>
    </div>

    <h2>Hello ${customerName}!</h2>
    <p>Your booking has been confirmed successfully.</p>

    <div class="info-box">
      <h3>Booking Details</h3>
      <p><strong>Booking ID:</strong> ${bookingId}</p>
      ${bookingDetails ? `<p><strong>Details:</strong> ${bookingDetails}</p>` : ""}
    </div>

    <p>Thank you for choosing ReBooked Solutions!</p>

    ${getNewReBookedSignature()}
  </div>
</body>
</html>`;

  const text = `
Booking Confirmed!

Hello ${customerName}!

Your booking has been confirmed successfully.

Booking ID: ${bookingId}
${bookingDetails ? `Details: ${bookingDetails}` : ""}

Thank you for choosing ReBooked Solutions!

${getNewTextSignature()}`;

  return { html, text };
}
