import { supabase } from "../lib/supabase";

export interface EmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: EmailTemplate;
  templateData?: Record<string, any>;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  encoding?: string;
}

export interface EmailTemplate {
  name: string;
  data: Record<string, any>;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
}

export const EMAIL_TEMPLATES = {
  ORDER_CONFIRMATION: "order-confirmation",
  WELCOME: "welcome",
  PASSWORD_RESET: "password-reset",
  EMAIL_VERIFICATION: "email-verification",
  SHIPPING_NOTIFICATION: "shipping-notification",
  CONTACT_FORM: "contact-form",
  BOOKING_CONFIRMATION: "booking-confirmation",
  SELLER_PICKUP_NOTIFICATION: "seller-pickup-notification",
  BUYER_ORDER_CONFIRMED: "buyer-order-confirmed",
  COMMIT_CONFIRMATION_BASIC: "commit-confirmation-basic",
  ORDER_COMMITTED_BUYER: "order-committed-buyer",
  ORDER_COMMITTED_SELLER: "order-committed-seller",
  SELLER_NEW_ORDER: "seller-new-order",
  BUYER_ORDER_PENDING: "buyer-order-pending",
} as const;

export type EmailTemplateName =
  (typeof EMAIL_TEMPLATES)[keyof typeof EMAIL_TEMPLATES];

class EmailService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${supabase.supabaseUrl}/functions/v1`;
  }

  private async makeRequest(
    endpoint: string,
    data: any,
  ): Promise<EmailResponse> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: session?.access_token
            ? `Bearer ${session.access_token}`
            : "",
        },
        body: JSON.stringify(data),
      });

      let result: any;
      try {
        result = await response.json();
      } catch (jsonError) {
        // If JSON parsing fails, create a basic error response
        result = {
          success: false,
          error: `Invalid JSON response: ${response.status} ${response.statusText}`,
          details: {
            status: response.status,
            statusText: response.statusText,
            jsonError: jsonError instanceof Error ? jsonError.message : 'JSON parse failed'
          }
        };
      }

      if (!response.ok) {
        throw new Error(
          result.error || `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      return result;
    } catch (error) {
      console.error("Email service error:", error);
      throw error;
    }
  }

  async sendEmail(request: EmailRequest): Promise<EmailResponse> {
    // Retry mechanism for handling stream conflicts
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        if (attempt > 1) {
          // Add increasing delay for retries
          await new Promise(resolve => setTimeout(resolve, attempt * 500));
          console.log(`🔄 Email retry attempt ${attempt}/3`);
        }

        return await this.makeRequest("send-email", request);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`⚠️ Email attempt ${attempt} failed:`, lastError.message);

        // Don't retry for authentication errors
        if (lastError.message.includes('Authorization') || lastError.message.includes('401')) {
          throw lastError;
        }

        // If it's the last attempt, throw the error
        if (attempt === 3) {
          throw lastError;
        }
      }
    }

    throw lastError || new Error('Email sending failed after retries');
  }

  async sendTemplateEmail(
    to: string | string[],
    templateName: EmailTemplateName,
    templateData: Record<string, any>,
    options?: Partial<EmailRequest>,
  ): Promise<EmailResponse> {
    // Since templates are deprecated, convert to direct HTML email
    console.warn(`⚠️ Template system deprecated: ${templateName}. Converting to direct HTML email.`);

    const { html, text } = this.generateEmailFromTemplate(templateName, templateData);

    const request: EmailRequest = {
      to,
      subject: options?.subject || this.getDefaultSubject(templateName),
      html,
      text,
      ...options,
    };

    // Remove template data since we're using direct HTML
    delete request.template;

    return this.sendEmail(request);
  }

  private generateEmailFromTemplate(templateName: EmailTemplateName, data: Record<string, any>): { html: string; text: string } {
    // Generate HTML and text content based on template name
    switch (templateName) {
      case EMAIL_TEMPLATES.WELCOME:
        return this.generateWelcomeEmailContent(data);
      case EMAIL_TEMPLATES.ORDER_CONFIRMATION:
        return this.generateOrderConfirmationContent(data);
      case EMAIL_TEMPLATES.SELLER_NEW_ORDER:
        return this.generateSellerNewOrderContent(data);
      case EMAIL_TEMPLATES.ORDER_COMMITTED_BUYER:
        return this.generateOrderCommittedBuyerContent(data);
      case EMAIL_TEMPLATES.ORDER_COMMITTED_SELLER:
        return this.generateOrderCommittedSellerContent(data);
      default:
        return this.generateGenericEmailContent(templateName, data);
    }
  }

  private generateWelcomeEmailContent(data: Record<string, any>): { html: string; text: string } {
    const { userName, loginUrl } = data;

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Welcome to ReBooked Solutions!</title></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ReBooked Solutions!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
          <h2 style="color: #333; margin-top: 0;">Hello ${userName}!</h2>
          <p>🎉 Welcome to South Africa's premier student textbook marketplace!</p>
          <p><strong>What you can do:</strong></p>
          <ul>
            <li>📚 Browse thousands of textbooks</li>
            <li>💰 List your own books for sale</li>
            <li>🚚 Hassle-free delivery</li>
            <li>💳 Secure payments</li>
          </ul>
          ${loginUrl ? `<div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Get Started
            </a>
          </div>` : ''}
          <p style="font-size: 14px; color: #666;">
            <strong>ReBooked Solutions</strong><br>
            <a href="mailto:support@rebookedsolutions.co.za">support@rebookedsolutions.co.za</a>
          </p>
        </div>
      </body>
      </html>
    `;

    const text = `Welcome to ReBooked Solutions!

Hello ${userName}!

🎉 Welcome to South Africa's premier student textbook marketplace!

What you can do:
- 📚 Browse thousands of textbooks
- 💰 List your own books for sale
- 🚚 Hassle-free delivery
- 💳 Secure payments

${loginUrl ? `Get started: ${loginUrl}` : ''}

Best regards,
ReBooked Solutions Team
support@rebookedsolutions.co.za`;

    return { html, text };
  }

  private generateSellerNewOrderContent(data: Record<string, any>): { html: string; text: string } {
    const { sellerName, buyerName, orderId, items, totalAmount, expiresAt } = data;

    const itemsList = items?.map((item: any) =>
      `<li>${item.name} - Qty: ${item.quantity} - R${item.price.toFixed(2)}</li>`
    ).join('') || '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>New Order - Action Required</title></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📚 New Order - Action Required!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
          <h2 style="color: #333; margin-top: 0;">Hello ${sellerName}!</h2>
          <p><strong>You have a new order from ${buyerName}!</strong></p>
          <p><strong>Order Details:</strong></p>
          <ul>${itemsList}</ul>
          <p><strong>Total: ${totalAmount}</strong></p>
          <p><strong>⏰ Important:</strong> You have until ${expiresAt} to commit to this order (48 hours).</p>
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>What happens next:</strong></p>
            <ol>
              <li>Review the order details</li>
              <li>Commit to the sale within 48 hours</li>
              <li>We'll arrange courier pickup</li>
              <li>Get paid once delivered</li>
            </ol>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://rebookedsolutions.co.za/orders/${orderId}" style="background: #00b894; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              View & Commit to Order
            </a>
          </div>
          <p style="font-size: 14px; color: #666;">
            <strong>ReBooked Solutions</strong><br>
            Order ID: ${orderId}
          </p>
        </div>
      </body>
      </html>
    `;

    const text = `New Order - Action Required!

Hello ${sellerName}!

You have a new order from ${buyerName}!

Order Details:
${items?.map((item: any) => `- ${item.name} - Qty: ${item.quantity} - R${item.price.toFixed(2)}`).join('\n') || ''}

Total: ${totalAmount}

⏰ Important: You have until ${expiresAt} to commit to this order (48 hours).

What happens next:
1. Review the order details
2. Commit to the sale within 48 hours
3. We'll arrange courier pickup
4. Get paid once delivered

View & Commit: https://rebookedsolutions.co.za/orders/${orderId}

ReBooked Solutions
Order ID: ${orderId}`;

    return { html, text };
  }

  private generateOrderCommittedBuyerContent(data: Record<string, any>): { html: string; text: string } {
    const { buyer_name, order_id, seller_name, book_titles, estimated_delivery } = data;

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Order Confirmed - Preparing for Delivery</title></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #00b894 0%, #00a085 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✅ Order Confirmed!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
          <h2 style="color: #333; margin-top: 0;">Great news, ${buyer_name}!</h2>
          <p><strong>${seller_name}</strong> has confirmed your order and is preparing your book(s) for delivery.</p>
          <p><strong>Order Details:</strong></p>
          <p>📚 Book(s): ${book_titles}</p>
          <p>🚚 Estimated Delivery: ${estimated_delivery}</p>
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>What happens next:</strong></p>
            <ol>
              <li>Seller prepares your book(s)</li>
              <li>Courier picks up from seller</li>
              <li>You'll receive tracking details</li>
              <li>Delivery to your address</li>
            </ol>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://rebookedsolutions.co.za/orders/${order_id}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Track Your Order
            </a>
          </div>
          <p style="font-size: 14px; color: #666;">
            <strong>ReBooked Solutions</strong><br>
            Order ID: ${order_id}
          </p>
        </div>
      </body>
      </html>
    `;

    const text = `Order Confirmed!

Great news, ${buyer_name}!

${seller_name} has confirmed your order and is preparing your book(s) for delivery.

Order Details:
📚 Book(s): ${book_titles}
🚚 Estimated Delivery: ${estimated_delivery}

What happens next:
1. Seller prepares your book(s)
2. Courier picks up from seller
3. You'll receive tracking details
4. Delivery to your address

Track your order: https://rebookedsolutions.co.za/orders/${order_id}

ReBooked Solutions
Order ID: ${order_id}`;

    return { html, text };
  }

  private generateOrderCommittedSellerContent(data: Record<string, any>): { html: string; text: string } {
    const { seller_name, order_id, buyer_name, book_titles, pickup_instructions } = data;

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Order Commitment Confirmed - Prepare for Pickup</title></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #fdcb6e 0%, #e17055 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📦 Prepare for Pickup!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
          <h2 style="color: #333; margin-top: 0;">Hello ${seller_name}!</h2>
          <p>Thank you for committing to this order! The courier will be arranged for pickup.</p>
          <p><strong>Order Details:</strong></p>
          <p>👤 Buyer: ${buyer_name}</p>
          <p>📚 Book(s): ${book_titles}</p>
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Pickup Instructions:</strong></p>
            <p>${pickup_instructions}</p>
          </div>
          <p><strong>What to do now:</strong></p>
          <ol>
            <li>Package your book(s) securely</li>
            <li>Wait for courier pickup notification</li>
            <li>Hand over package to courier</li>
            <li>Get paid once delivered!</li>
          </ol>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://rebookedsolutions.co.za/orders/${order_id}" style="background: #e17055; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              View Order Details
            </a>
          </div>
          <p style="font-size: 14px; color: #666;">
            <strong>ReBooked Solutions</strong><br>
            Order ID: ${order_id}
          </p>
        </div>
      </body>
      </html>
    `;

    const text = `Prepare for Pickup!

Hello ${seller_name}!

Thank you for committing to this order! The courier will be arranged for pickup.

Order Details:
👤 Buyer: ${buyer_name}
📚 Book(s): ${book_titles}

Pickup Instructions:
${pickup_instructions}

What to do now:
1. Package your book(s) securely
2. Wait for courier pickup notification
3. Hand over package to courier
4. Get paid once delivered!

View order: https://rebookedsolutions.co.za/orders/${order_id}

ReBooked Solutions
Order ID: ${order_id}`;

    return { html, text };
  }

  private generateOrderConfirmationContent(data: Record<string, any>): { html: string; text: string } {
    const { orderNumber, customerName, items, total, estimatedDelivery } = data;

    const itemsList = items?.map((item: any) =>
      `<li>${item.name} - Qty: ${item.quantity} - R${item.price.toFixed(2)}</li>`
    ).join('') || '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Order Confirmation</title></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmation</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
          <h2 style="color: #333; margin-top: 0;">Thank you, ${customerName}!</h2>
          <p>Your order <strong>#${orderNumber}</strong> has been confirmed.</p>
          <p><strong>Items ordered:</strong></p>
          <ul>${itemsList}</ul>
          <p><strong>Total: R${total}</strong></p>
          ${estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>` : ''}
          <p style="font-size: 14px; color: #666;">
            <strong>ReBooked Solutions</strong><br>
            Order #${orderNumber}
          </p>
        </div>
      </body>
      </html>
    `;

    const text = `Order Confirmation

Thank you, ${customerName}!

Your order #${orderNumber} has been confirmed.

Items ordered:
${items?.map((item: any) => `- ${item.name} - Qty: ${item.quantity} - R${item.price.toFixed(2)}`).join('\n') || ''}

Total: R${total}
${estimatedDelivery ? `Estimated Delivery: ${estimatedDelivery}` : ''}

ReBooked Solutions
Order #${orderNumber}`;

    return { html, text };
  }

  private generateGenericEmailContent(templateName: string, data: Record<string, any>): { html: string; text: string } {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Notification from ReBooked Solutions</title></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #667eea; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">ReBooked Solutions</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
          <h2 style="color: #333; margin-top: 0;">Notification</h2>
          <p>You have received a notification from ReBooked Solutions.</p>
          <p><strong>Type:</strong> ${templateName}</p>
          <pre style="background: #f0f0f0; padding: 15px; border-radius: 5px; overflow: auto;">
            ${JSON.stringify(data, null, 2)}
          </pre>
          <p style="font-size: 14px; color: #666;">
            <strong>ReBooked Solutions</strong><br>
            <a href="mailto:support@rebookedsolutions.co.za">support@rebookedsolutions.co.za</a>
          </p>
        </div>
      </body>
      </html>
    `;

    const text = `Notification from ReBooked Solutions

Type: ${templateName}

Data:
${JSON.stringify(data, null, 2)}

ReBooked Solutions
support@rebookedsolutions.co.za`;

    return { html, text };
  }

  private getDefaultSubject(templateName: EmailTemplateName): string {
    switch (templateName) {
      case EMAIL_TEMPLATES.ORDER_CONFIRMATION:
        return "Order Confirmation - ReBooked Solutions";
      case EMAIL_TEMPLATES.WELCOME:
        return "Welcome to ReBooked Solutions!";
      case EMAIL_TEMPLATES.PASSWORD_RESET:
        return "Password Reset Request";
      case EMAIL_TEMPLATES.EMAIL_VERIFICATION:
        return "Verify Your Email Address - ReBooked Solutions";
      case EMAIL_TEMPLATES.SHIPPING_NOTIFICATION:
        return "Your Order Has Shipped!";
      case EMAIL_TEMPLATES.CONTACT_FORM:
        return "New Contact Form Submission";
      case EMAIL_TEMPLATES.BOOKING_CONFIRMATION:
        return "Booking Confirmation";
      case EMAIL_TEMPLATES.SELLER_PICKUP_NOTIFICATION:
        return "Courier Pickup Scheduled - ReBooked Solutions";
      case EMAIL_TEMPLATES.BUYER_ORDER_CONFIRMED:
        return "Your Order is Confirmed - ReBooked Solutions";
      case EMAIL_TEMPLATES.COMMIT_CONFIRMATION_BASIC:
        return "Order Commitment Confirmed - ReBooked Solutions";
      case EMAIL_TEMPLATES.ORDER_COMMITTED_BUYER:
        return "Order Confirmed - Preparing for Delivery";
      case EMAIL_TEMPLATES.ORDER_COMMITTED_SELLER:
        return "Order Commitment Confirmed - Prepare for Pickup";
      case EMAIL_TEMPLATES.SELLER_NEW_ORDER:
        return "New Order - Action Required";
      case EMAIL_TEMPLATES.BUYER_ORDER_PENDING:
        return "Order Confirmed - Awaiting Seller Response";
      default:
        return "Notification from ReBooked Solutions";
    }
  }

  // Convenience methods for common email types
  async sendOrderConfirmation(
    to: string,
    orderData: {
      orderNumber: string;
      customerName: string;
      items: Array<{ name: string; quantity: number; price: number }>;
      total: string;
      estimatedDelivery?: string;
    },
  ): Promise<EmailResponse> {
    return this.sendTemplateEmail(
      to,
      EMAIL_TEMPLATES.ORDER_CONFIRMATION,
      orderData,
    );
  }

  async sendWelcomeEmail(
    to: string,
    userData: {
      userName: string;
      loginUrl?: string;
    },
  ): Promise<EmailResponse> {
    return this.sendTemplateEmail(to, EMAIL_TEMPLATES.WELCOME, userData);
  }

  async sendPasswordResetEmail(
    to: string,
    resetData: {
      userName: string;
      resetUrl: string;
      expiryTime?: string;
    },
  ): Promise<EmailResponse> {
    return this.sendTemplateEmail(
      to,
      EMAIL_TEMPLATES.PASSWORD_RESET,
      resetData,
    );
  }

  async sendEmailVerificationEmail(
    to: string,
    verificationData: {
      userName: string;
      verificationUrl: string;
      expiryTime?: string;
    },
  ): Promise<EmailResponse> {
    // Try template first, fallback to simple HTML if template system unavailable
    try {
      return await this.sendTemplateEmail(
        to,
        EMAIL_TEMPLATES.EMAIL_VERIFICATION,
        verificationData,
      );
    } catch (templateError) {
      console.warn(
        "Template system unavailable, using simple HTML fallback:",
        templateError,
      );

      // Fallback to simple HTML email
      const {
        userName,
        verificationUrl,
        expiryTime = "24 hours",
      } = verificationData;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Email - ReBooked Solutions</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email Address</h1>
          </div>

          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
            <h2 style="color: #333; margin-top: 0;">Hello ${userName}!</h2>

            <p>Welcome to ReBooked Solutions! To complete your registration and start buying and selling textbooks, please verify your email address.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}"
                 style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Verify My Email Address
              </a>
            </div>

            <p><strong>This verification link will expire in ${expiryTime}.</strong></p>

            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="background: #f0f0f0; padding: 10px; border-radius: 5px; word-break: break-all;">
              ${verificationUrl}
            </p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

            <p style="font-size: 14px; color: #666;">
              If you didn't create an account with ReBooked Solutions, please ignore this email.
            </p>

            <p style="font-size: 14px; color: #666;">
              <strong>ReBooked Solutions</strong><br>
              South Africa's Premier Textbook Marketplace<br>
              <a href="mailto:support@rebookedsolutions.co.za">support@rebookedsolutions.co.za</a>
            </p>
          </div>
        </body>
        </html>
      `;

      const textContent = `
        Verify Your Email Address - ReBooked Solutions

        Hello ${userName}!

        Welcome to ReBooked Solutions! To complete your registration and start buying and selling textbooks, please verify your email address by clicking the link below:

        ${verificationUrl}

        This verification link will expire in ${expiryTime}.

        If you didn't create an account with ReBooked Solutions, please ignore this email.

        Best regards,
        ReBooked Solutions Team
        support@rebookedsolutions.co.za
      `;

      return await this.sendEmail({
        to,
        subject: "Verify Your Email Address - ReBooked Solutions",
        html: htmlContent,
        text: textContent,
      });
    }
  }

  async sendShippingNotification(
    to: string,
    shippingData: {
      customerName: string;
      orderNumber: string;
      trackingNumber: string;
      carrier: string;
      estimatedDelivery?: string;
    },
  ): Promise<EmailResponse> {
    return this.sendTemplateEmail(
      to,
      EMAIL_TEMPLATES.SHIPPING_NOTIFICATION,
      shippingData,
    );
  }

  async sendContactFormNotification(
    to: string,
    contactData: {
      name: string;
      email: string;
      subject: string;
      message: string;
      timestamp?: string;
    },
  ): Promise<EmailResponse> {
    return this.sendTemplateEmail(
      to,
      EMAIL_TEMPLATES.CONTACT_FORM,
      contactData,
    );
  }

  async sendBookingConfirmation(
    to: string,
    bookingData: {
      customerName: string;
      bookingId: string;
      bookTitle: string;
      pickupDate: string;
      pickupLocation: string;
      contactInfo?: string;
    },
  ): Promise<EmailResponse> {
    return this.sendTemplateEmail(
      to,
      EMAIL_TEMPLATES.BOOKING_CONFIRMATION,
      bookingData,
    );
  }

  async sendSellerPickupNotification(
    to: string,
    pickupData: {
      sellerName: string;
      bookTitle: string;
      orderId: string;
      pickupDate: string;
      pickupTimeWindow: string;
      courierProvider: string;
      trackingNumber: string;
      shippingLabelUrl?: string;
      pickupAddress?: {
        streetAddress?: string;
        city?: string;
        province?: string;
      };
    },
  ): Promise<EmailResponse> {
    return this.sendTemplateEmail(
      to,
      EMAIL_TEMPLATES.SELLER_PICKUP_NOTIFICATION,
      pickupData,
    );
  }

  async sendBuyerOrderConfirmed(
    to: string,
    orderData: {
      buyerName: string;
      bookTitle: string;
      orderId: string;
      sellerName: string;
      expectedDelivery: string;
    },
  ): Promise<EmailResponse> {
    return this.sendTemplateEmail(
      to,
      EMAIL_TEMPLATES.BUYER_ORDER_CONFIRMED,
      orderData,
    );
  }

  async sendCommitConfirmationBasic(
    to: string,
    commitData: {
      sellerName: string;
      bookTitle: string;
      orderId: string;
      buyerEmail: string;
    },
  ): Promise<EmailResponse> {
    return this.sendTemplateEmail(
      to,
      EMAIL_TEMPLATES.COMMIT_CONFIRMATION_BASIC,
      commitData,
    );
  }

  async sendOrderCommittedBuyer(
    to: string,
    orderData: {
      buyer_name: string;
      order_id: string;
      seller_name: string;
      book_titles: string;
      estimated_delivery: string;
    },
  ): Promise<EmailResponse> {
    return this.sendTemplateEmail(
      to,
      EMAIL_TEMPLATES.ORDER_COMMITTED_BUYER,
      orderData,
    );
  }

  async sendOrderCommittedSeller(
    to: string,
    orderData: {
      seller_name: string;
      order_id: string;
      buyer_name: string;
      book_titles: string;
      pickup_instructions: string;
    },
  ): Promise<EmailResponse> {
    return this.sendTemplateEmail(
      to,
      EMAIL_TEMPLATES.ORDER_COMMITTED_SELLER,
      orderData,
    );
  }

  async sendSellerNewOrder(
    to: string,
    orderData: {
      sellerName: string;
      buyerName: string;
      orderId: string;
      items: Array<{ name: string; quantity: number; price: number }>;
      totalAmount: string;
      expiresAt: string;
      commitUrl?: string;
    },
  ): Promise<EmailResponse> {
    return this.sendTemplateEmail(
      to,
      EMAIL_TEMPLATES.SELLER_NEW_ORDER,
      orderData,
    );
  }

  async sendBuyerOrderPending(
    to: string,
    orderData: {
      buyerName: string;
      sellerName: string;
      orderId: string;
      items: Array<{ name: string; quantity: number; price: number }>;
      totalAmount: string;
      statusUrl?: string;
    },
  ): Promise<EmailResponse> {
    return this.sendTemplateEmail(
      to,
      EMAIL_TEMPLATES.BUYER_ORDER_PENDING,
      orderData,
    );
  }

  // Utility method to validate email addresses
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Utility method to validate multiple email addresses
  static validateEmails(emails: string[]): {
    valid: string[];
    invalid: string[];
  } {
    const valid: string[] = [];
    const invalid: string[] = [];

    emails.forEach((email) => {
      if (this.validateEmail(email)) {
        valid.push(email);
      } else {
        invalid.push(email);
      }
    });

    return { valid, invalid };
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export class for testing or custom instances
export { EmailService };

// Hook for React components
export function useEmailService() {
  return emailService;
}
