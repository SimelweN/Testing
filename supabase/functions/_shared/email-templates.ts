import { EmailTemplateName, EMAIL_TEMPLATES } from "./email-types.ts";
import {
  renderSellerPickupNotificationTemplate,
  renderBuyerOrderConfirmedTemplate,
  renderCommitConfirmationBasicTemplate,
} from "./email-templates-commit.ts";

export interface TemplateData {
  [key: string]: any;
}

// Common styles and signature for all emails
const getEmailStyles = () => `
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
    .emoji {
      font-size: 18px;
    }
  </style>
`;

const getEmailSignature = () => `
  <div class="footer">
    <p><strong>This is an automated message from ReBooked Solutions.</strong><br>
    Please do not reply to this email.</p>
    <p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>
    Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p>
    <p>T&Cs apply.</p>
    <p><em>"Pre-Loved Pages, New Adventures"</em></p>
  </div>
`;

export function renderTemplate(
  templateName: EmailTemplateName,
  data: TemplateData,
): { html: string; text: string } {
  switch (templateName) {
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

    case EMAIL_TEMPLATES.SELLER_PICKUP_NOTIFICATION:
      return renderSellerPickupNotificationTemplate(data);

    case EMAIL_TEMPLATES.BUYER_ORDER_CONFIRMED:
      return renderBuyerOrderConfirmedTemplate(data);

    case EMAIL_TEMPLATES.COMMIT_CONFIRMATION_BASIC:
      return renderCommitConfirmationBasicTemplate(data);

    case EMAIL_TEMPLATES.ORDER_COMMITTED_BUYER:
      return renderOrderCommittedBuyerTemplate(data);

    case EMAIL_TEMPLATES.ORDER_COMMITTED_SELLER:
      return renderOrderCommittedSellerTemplate(data);

    case EMAIL_TEMPLATES.SELLER_NEW_ORDER:
      return renderSellerNewOrderTemplate(data);

    case EMAIL_TEMPLATES.BUYER_ORDER_PENDING:
      return renderBuyerOrderPendingTemplate(data);

    default:
      throw new Error(`Template not found: ${templateName}`);
  }
}

function renderOrderConfirmationTemplate(data: TemplateData): {
  html: string;
  text: string;
} {
  const { orderNumber, customerName, items, total, estimatedDelivery } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2d6e55; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 14px; }
        .order-item { border-bottom: 1px solid #ddd; padding: 10px 0; }
        .total { font-weight: bold; font-size: 18px; color: #2d6e55; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmed!</h1>
          <p>Thank you for your purchase, ${customerName}!</p>
        </div>
        <div class="content">
          <h2>Order #${orderNumber}</h2>
          <p>Your order has been confirmed and is being processed.</p>
          
          <h3>Order Details:</h3>
          ${
            items
              ?.map(
                (item: any) => `
            <div class="order-item">
              <strong>${item.name}</strong><br>
              Quantity: ${item.quantity} × R${item.price}<br>
              Subtotal: R${(item.quantity * item.price).toFixed(2)}
            </div>
          `,
              )
              .join("") || ""
          }
          
          <div class="total">
            <p>Total: R${total}</p>
          </div>
          
          ${estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>` : ""}
          
          <p>We'll send you another email when your order ships with tracking information.</p>
        </div>
        <div class="footer">
          <p>ReBooked Solutions | noreply@rebookedsolutions.co.za</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Order Confirmed!

Thank you for your purchase, ${customerName}!

Order #${orderNumber}

Your order has been confirmed and is being processed.

Order Details:
${items?.map((item: any) => `${item.name} - Quantity: ${item.quantity} × R${item.price} = R${(item.quantity * item.price).toFixed(2)}`).join("\n") || ""}

Total: R${total}

${estimatedDelivery ? `Estimated Delivery: ${estimatedDelivery}` : ""}

We'll send you another email when your order ships with tracking information.

ReBooked Solutions
noreply@rebookedsolutions.co.za
  `;

  return { html, text };
}

function renderWelcomeTemplate(data: TemplateData): {
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
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2d6e55; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 14px; }
        .btn { background: #2d6e55; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ReBooked Solutions!</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName}!</h2>
          <p>Welcome to ReBooked Solutions - your marketplace for buying and selling textbooks.</p>
          
          <p>Here's what you can do:</p>
          <ul>
            <li>Browse thousands of affordable textbooks</li>
            <li>Sell your used textbooks to other students</li>
            <li>Connect with students from universities across South Africa</li>
            <li>Track your orders and manage your account</li>
          </ul>
          
          <p>Ready to get started?</p>
          ${loginUrl ? `<a href="${loginUrl}" class="btn">Login to Your Account</a>` : ""}
          
          <p>If you have any questions, feel free to contact our support team.</p>
        </div>
        <div class="footer">
          <p>ReBooked Solutions | noreply@rebookedsolutions.co.za</p>
        </div>
      </div>
    </body>
    </html>
  `;

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

ReBooked Solutions
noreply@rebookedsolutions.co.za
  `;

  return { html, text };
}

function renderPasswordResetTemplate(data: TemplateData): {
  html: string;
  text: string;
} {
  const { userName, resetUrl, expiryTime } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset Request</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2d6e55; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 14px; }
        .btn { background: #2d6e55; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName}!</h2>
          <p>We received a request to reset your password for your ReBooked Solutions account.</p>
          
          <p>If you requested this password reset, click the button below:</p>
          <a href="${resetUrl}" class="btn">Reset Your Password</a>
          
          <div class="warning">
            <p><strong>Important:</strong> This link will expire in ${expiryTime || "1 hour"}.</p>
          </div>
          
          <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          
          <p>For security reasons, this link can only be used once.</p>
        </div>
        <div class="footer">
          <p>ReBooked Solutions | noreply@rebookedsolutions.co.za</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Password Reset Request

Hello ${userName}!

We received a request to reset your password for your ReBooked Solutions account.

If you requested this password reset, use this link: ${resetUrl}

Important: This link will expire in ${expiryTime || "1 hour"}.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

For security reasons, this link can only be used once.

ReBooked Solutions
noreply@rebookedsolutions.co.za
  `;

  return { html, text };
}

function renderShippingNotificationTemplate(data: TemplateData): {
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
      <title>Your Order Has Shipped</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2d6e55; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 14px; }
        .tracking-box { background: white; border: 2px solid #2d6e55; padding: 15px; border-radius: 5px; text-align: center; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Order Has Shipped!</h1>
        </div>
        <div class="content">
          <h2>Hello ${customerName}!</h2>
          <p>Great news! Your order #${orderNumber} has been shipped and is on its way to you.</p>
          
          <div class="tracking-box">
            <h3>Tracking Information</h3>
            <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
            <p><strong>Carrier:</strong> ${carrier}</p>
            ${estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>` : ""}
          </div>
          
          <p>You can track your package using the tracking number above on the ${carrier} website.</p>
          
          <p>Thank you for choosing ReBooked Solutions!</p>
        </div>
        <div class="footer">
          <p>ReBooked Solutions | noreply@rebookedsolutions.co.za</p>
        </div>
      </div>
    </body>
    </html>
  `;

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

ReBooked Solutions
noreply@rebookedsolutions.co.za
  `;

  return { html, text };
}

function renderContactFormTemplate(data: TemplateData): {
  html: string;
  text: string;
} {
  const { name, email, subject, message, timestamp } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Contact Form Submission</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2d6e55; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 14px; }
        .info-box { background: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Contact Form Submission</h1>
        </div>
        <div class="content">
          <div class="info-box">
            <h3>Contact Details</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Submitted:</strong> ${timestamp || new Date().toLocaleString()}</p>
          </div>
          
          <div class="info-box">
            <h3>Message</h3>
            <p>${message.replace(/\n/g, "<br>")}</p>
          </div>
        </div>
        <div class="footer">
          <p>ReBooked Solutions Contact Form</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
New Contact Form Submission

Contact Details:
Name: ${name}
Email: ${email}
Subject: ${subject}
Submitted: ${timestamp || new Date().toLocaleString()}

Message:
${message}

ReBooked Solutions Contact Form
  `;

  return { html, text };
}

function renderBookingConfirmationTemplate(data: TemplateData): {
  html: string;
  text: string;
} {
  const {
    customerName,
    bookingId,
    bookTitle,
    pickupDate,
    pickupLocation,
    contactInfo,
  } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2d6e55; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 14px; }
        .booking-box { background: white; border: 2px solid #2d6e55; padding: 15px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Confirmed!</h1>
        </div>
        <div class="content">
          <h2>Hello ${customerName}!</h2>
          <p>Your booking has been confirmed. Here are the details:</p>
          
          <div class="booking-box">
            <h3>Booking Details</h3>
            <p><strong>Booking ID:</strong> ${bookingId}</p>
            <p><strong>Book:</strong> ${bookTitle}</p>
            <p><strong>Pickup Date:</strong> ${pickupDate}</p>
            <p><strong>Pickup Location:</strong> ${pickupLocation}</p>
            ${contactInfo ? `<p><strong>Contact:</strong> ${contactInfo}</p>` : ""}
          </div>
          
          <p>Please arrive at the specified location on time. Bring a valid ID for verification.</p>
          
          <p>If you need to make any changes or have questions, please contact us immediately.</p>
        </div>
        <div class="footer">
          <p>ReBooked Solutions | noreply@rebookedsolutions.co.za</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Booking Confirmed!

Hello ${customerName}!

Your booking has been confirmed. Here are the details:

Booking Details:
Booking ID: ${bookingId}
Book: ${bookTitle}
Pickup Date: ${pickupDate}
Pickup Location: ${pickupLocation}
${contactInfo ? `Contact: ${contactInfo}` : ""}

Please arrive at the specified location on time. Bring a valid ID for verification.

If you need to make any changes or have questions, please contact us immediately.

ReBooked Solutions
noreply@rebookedsolutions.co.za
  `;

  return { html, text };
}

function renderOrderCommittedBuyerTemplate(data: TemplateData): {
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
          <h1><span class="emoji">🎉</span> Order Confirmed!</h1>
        </div>
        <div class="content">
          <h2>Great news, ${buyer_name}!</h2>
          <p><strong>${seller_name}</strong> has confirmed your order and is preparing your book(s) for delivery.</p>

          <div class="info-box">
            <h3><span class="emoji">📚</span> Order Details</h3>
            <p><strong>Order ID:</strong> ${order_id}</p>
            <p><strong>Book(s):</strong> ${book_titles}</p>
            <p><strong>Seller:</strong> ${seller_name}</p>
            <p><strong>Estimated Delivery:</strong> ${estimated_delivery}</p>
          </div>

          <p>We'll keep you updated throughout the delivery process!</p>

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
  `;

  return { html, text };
}

function renderOrderCommittedSellerTemplate(data: TemplateData): {
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
          <h1><span class="emoji">✅</span> Order Commitment Confirmed!</h1>
        </div>
        <div class="content">
          <h2>Thank you, ${seller_name}!</h2>
          <p>You've successfully committed to sell your book(s). The buyer has been notified and pickup has been scheduled.</p>

          <div class="info-box">
            <h3><span class="emoji">📋</span> Order Details</h3>
            <p><strong>Order ID:</strong> ${order_id}</p>
            <p><strong>Book(s):</strong> ${book_titles}</p>
            <p><strong>Buyer:</strong> ${buyer_name}</p>
          </div>

          <div class="steps">
            <h3><span class="emoji">📦</span> Next Steps</h3>
            <p>${pickup_instructions}</p>
          </div>

          <p>Thank you for selling with ReBooked Solutions! <span class="emoji">📚</span></p>
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
  `;

  return { html, text };
}

function renderSellerNewOrderTemplate(data: TemplateData): {
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
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2d6e55; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 14px; }
        .info-box { background: white; border: 2px solid #2d6e55; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .btn { background: #2d6e55; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .emoji { font-size: 18px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1><span class="emoji">📚</span> New Order - Action Required!</h1>
        </div>
        <div class="content">
          <h2>Hi ${sellerName}!</h2>
          <p>Great news! You have a new order from <strong>${buyerName}</strong>.</p>

          <div class="info-box">
            <h3><span class="emoji">📋</span> Order Details</h3>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Buyer:</strong> ${buyerName}</p>
            <p><strong>Total Amount:</strong> R${totalAmount}</p>
          </div>

          <div class="warning">
            <h3><span class="emoji">⏰</span> Action Required Within 48 Hours</h3>
            <p><strong>Expires:</strong> ${new Date(expiresAt).toLocaleString()}</p>
            <p>You must commit to this order within 48 hours or it will be automatically cancelled.</p>
          </div>

          <p>Once you commit, we'll arrange pickup and you'll be paid after delivery!</p>

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

ReBooked Solutions Team
  `;

  return { html, text };
}

function renderBuyerOrderPendingTemplate(data: TemplateData): {
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
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2d6e55; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 14px; }
        .info-box { background: white; border: 2px solid #2d6e55; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .btn { background: #2d6e55; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
        .emoji { font-size: 18px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1><span class="emoji">🎉</span> Order Confirmed!</h1>
        </div>
        <div class="content">
          <h2>Thank you, ${buyerName}!</h2>
          <p>Your order has been confirmed and <strong>${sellerName}</strong> has been notified.</p>

          <div class="info-box">
            <h3><span class="emoji">📋</span> Order Details</h3>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Seller:</strong> ${sellerName}</p>
            <p><strong>Total Amount:</strong> R${totalAmount}</p>
          </div>

          <h3><span class="emoji">📦</span> What happens next?</h3>
          <ul>
            <li>The seller has 48 hours to commit to your order</li>
            <li>Once committed, we'll arrange pickup and delivery</li>
            <li>You'll receive tracking information via email</li>
            <li>Your book(s) will be delivered within 2-3 business days</li>
          </ul>

          <p>We'll notify you as soon as the seller confirms your order!</p>

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

ReBooked Solutions Team
  `;

  return { html, text };
}
