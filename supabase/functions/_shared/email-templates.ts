import { EmailTemplateName, EMAIL_TEMPLATES } from "./email-types.ts";
import {
  renderSellerPickupNotificationTemplate,
  renderBuyerOrderConfirmedTemplate,
  renderCommitConfirmationBasicTemplate,
} from "./email-templates-commit.ts";

export interface TemplateData {
  [key: string]: any;
}

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
