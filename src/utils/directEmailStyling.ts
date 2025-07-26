// CENTRALIZED EMAIL STYLING - USE STANDARDIZED STYLES
import { EMAIL_STYLES, EMAIL_FOOTER } from './emailStyles';

const getCorrectEmailStyles = () => EMAIL_STYLES;
const getCorrectFooter = () => EMAIL_FOOTER;

export function createOrderConfirmationEmail(data: {
  orderNumber: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: string;
  estimatedDelivery?: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmation - ReBooked Solutions</title>
  ${getCorrectEmailStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
      <p>Thank you for your purchase, ${data.customerName}!</p>
    </div>
    
    <h2>Order #${data.orderNumber}</h2>
    <p>Your order has been confirmed and is being processed.</p>
    
    <h3>Order Details:</h3>
    ${data.items
      .map(
        (item) => `
      <div style="border-bottom: 1px solid #ddd; padding: 10px 0;">
        <strong>${item.name}</strong><br>
        Quantity: ${item.quantity} × R${item.price}<br>
        Subtotal: R${(item.quantity * item.price).toFixed(2)}
      </div>
    `,
      )
      .join("")}
    
    <div class="total">
      <p>Total: R${data.total}</p>
    </div>
    
    ${data.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>` : ""}
    
    <p>We'll send you another email when your order ships with tracking information.</p>
    
    ${getCorrectFooter()}
  </div>
</body>
</html>`;

  const text = `
Order Confirmed!

Thank you for your purchase, ${data.customerName}!

Order #${data.orderNumber}

Your order has been confirmed and is being processed.

Order Details:
${data.items.map((item) => `${item.name} - Quantity: ${item.quantity} × R${item.price} = R${(item.quantity * item.price).toFixed(2)}`).join("\n")}

Total: R${data.total}

${data.estimatedDelivery ? `Estimated Delivery: ${data.estimatedDelivery}` : ""}

We'll send you another email when your order ships with tracking information.

This is an automated message from ReBooked Solutions. Please do not reply to this email.
For assistance, contact: support@rebookedsolutions.co.za
Visit us at: https://rebookedsolutions.co.za
T&Cs apply.
"Pre-Loved Pages, New Adventures"
  `;

  return { html, text };
}

export function createShippingNotificationEmail(data: {
  customerName: string;
  orderNumber: string;
  trackingNumber: string;
  carrier: string;
  estimatedDelivery?: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Order Has Shipped - ReBooked Solutions</title>
  ${getCorrectEmailStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 Your Order Has Shipped!</h1>
    </div>
    
    <h2>Hello ${data.customerName}!</h2>
    <p>Great news! Your order #${data.orderNumber} has been shipped and is on its way to you.</p>
    
    <div class="info-box">
      <h3>📱 Tracking Information</h3>
      <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
      <p><strong>Carrier:</strong> ${data.carrier}</p>
      ${data.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>` : ""}
    </div>
    
    <p>You can track your package using the tracking number above on the ${data.carrier} website.</p>
    
    <p>Thank you for choosing ReBooked Solutions!</p>
    
    ${getCorrectFooter()}
  </div>
</body>
</html>`;

  const text = `
Your Order Has Shipped!

Hello ${data.customerName}!

Great news! Your order #${data.orderNumber} has been shipped and is on its way to you.

Tracking Information:
Tracking Number: ${data.trackingNumber}
Carrier: ${data.carrier}
${data.estimatedDelivery ? `Estimated Delivery: ${data.estimatedDelivery}` : ""}

You can track your package using the tracking number above on the ${data.carrier} website.

Thank you for choosing ReBooked Solutions!

This is an automated message from ReBooked Solutions. Please do not reply to this email.
For assistance, contact: support@rebookedsolutions.co.za
Visit us at: https://rebookedsolutions.co.za
T&Cs apply.
"Pre-Loved Pages, New Adventures"
  `;

  return { html, text };
}

export function createWelcomeEmail(data: {
  userName: string;
  loginUrl?: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to ReBooked Solutions</title>
  ${getCorrectEmailStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to ReBooked Solutions!</h1>
    </div>
    
    <h2>Hello ${data.userName}!</h2>
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
    ${data.loginUrl ? `<a href="${data.loginUrl}" class="btn">Login to Your Account</a>` : ""}
    
    <p>If you have any questions, feel free to contact our support team.</p>
    
    ${getCorrectFooter()}
  </div>
</body>
</html>`;

  const text = `
Welcome to ReBooked Solutions!

Hello ${data.userName}!

Welcome to ReBooked Solutions - your marketplace for buying and selling textbooks.

Here's what you can do:
- Browse thousands of affordable textbooks
- Sell your used textbooks to other students
- Connect with students from universities across South Africa
- Track your orders and manage your account

${data.loginUrl ? `Login to your account: ${data.loginUrl}` : ""}

If you have any questions, feel free to contact our support team.

This is an automated message from ReBooked Solutions. Please do not reply to this email.
For assistance, contact: support@rebookedsolutions.co.za
Visit us at: https://rebookedsolutions.co.za
T&Cs apply.
"Pre-Loved Pages, New Adventures"
  `;

  return { html, text };
}

export function createPasswordResetEmail(data: {
  userName?: string;
  resetUrl: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Password Reset - ReBooked Solutions</title>
  ${getCorrectEmailStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Password Reset Request</h1>
    </div>
    
    <h2>Hello ${data.userName || "User"}!</h2>
    <p>We received a request to reset your password for your ReBooked Solutions account.</p>
    
    <div class="info-box">
      <h3>Reset Your Password</h3>
      <p>Click the button below to reset your password. This link will expire in 24 hours.</p>
    </div>
    
    <a href="${data.resetUrl}" class="btn">Reset Password</a>
    
    <p>If you didn't request this password reset, please ignore this email.</p>
    
    ${getCorrectFooter()}
  </div>
</body>
</html>`;

  const text = `
Password Reset Request

Hello ${data.userName || "User"}!

We received a request to reset your password for your ReBooked Solutions account.

Click here to reset your password: ${data.resetUrl}

This link will expire in 24 hours.

If you didn't request this password reset, please ignore this email.

This is an automated message from ReBooked Solutions. Please do not reply to this email.
For assistance, contact: support@rebookedsolutions.co.za
Visit us at: https://rebookedsolutions.co.za
T&Cs apply.
"Pre-Loved Pages, New Adventures"
  `;

  return { html, text };
}
