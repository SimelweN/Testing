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

// Add other template functions here (simplified versions)
function renderOrderConfirmationTemplate(data) {
  return {
    html: `<h1>Order Confirmation</h1><p>Thank you ${data.customerName}!</p>`,
    text: `Order Confirmation - Thank you ${data.customerName}!`,
  };
}

function renderWelcomeTemplate(data) {
  return {
    html: `<h1>Welcome ${data.userName}!</h1>`,
    text: `Welcome ${data.userName}!`,
  };
}

function renderPasswordResetTemplate(data) {
  return {
    html: `<h1>Password Reset</h1><p>Click here: ${data.resetUrl}</p>`,
    text: `Password Reset - Click here: ${data.resetUrl}`,
  };
}

function renderShippingNotificationTemplate(data) {
  return {
    html: `<h1>Your Order Has Shipped!</h1><p>Tracking: ${data.trackingNumber}</p>`,
    text: `Your order has shipped! Tracking: ${data.trackingNumber}`,
  };
}

function renderContactFormTemplate(data) {
  return {
    html: `<h1>Contact Form</h1><p>From: ${data.email}</p><p>${data.message}</p>`,
    text: `Contact Form - From: ${data.email} - ${data.message}`,
  };
}

function renderBookingConfirmationTemplate(data) {
  return {
    html: `<h1>Booking Confirmed</h1><p>Booking ID: ${data.bookingId}</p>`,
    text: `Booking Confirmed - ID: ${data.bookingId}`,
  };
}
