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

      const result = await response.json();

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
    return this.makeRequest("send-email", request);
  }

  async sendTemplateEmail(
    to: string | string[],
    templateName: EmailTemplateName,
    templateData: Record<string, any>,
    options?: Partial<EmailRequest>,
  ): Promise<EmailResponse> {
    const request: EmailRequest = {
      to,
      subject: options?.subject || this.getDefaultSubject(templateName),
      template: {
        name: templateName,
        data: templateData,
      },
      ...options,
    };

    return this.sendEmail(request);
  }

  private getDefaultSubject(templateName: EmailTemplateName): string {
    switch (templateName) {
      case EMAIL_TEMPLATES.ORDER_CONFIRMATION:
        return "Order Confirmation - ReBooked Solutions";
      case EMAIL_TEMPLATES.WELCOME:
        return "Welcome to ReBooked Solutions!";
      case EMAIL_TEMPLATES.PASSWORD_RESET:
        return "Password Reset Request";
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
