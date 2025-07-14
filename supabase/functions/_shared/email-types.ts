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

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  defaultFrom: string;
}

export const EMAIL_TEMPLATES = {
  ORDER_CONFIRMATION: "order-confirmation",
  WELCOME: "welcome",
  PASSWORD_RESET: "password-reset",
  SHIPPING_NOTIFICATION: "shipping-notification",
  CONTACT_FORM: "contact-form",
  BOOKING_CONFIRMATION: "booking-confirmation",
} as const;

export type EmailTemplateName =
  (typeof EMAIL_TEMPLATES)[keyof typeof EMAIL_TEMPLATES];

export const EMAIL_ERRORS = {
  MISSING_REQUIRED_FIELDS: "Missing required fields",
  INVALID_EMAIL_FORMAT: "Invalid email format",
  TEMPLATE_NOT_FOUND: "Email template not found",
  SMTP_CONNECTION_FAILED: "SMTP connection failed",
  EMAIL_SEND_FAILED: "Failed to send email",
  RATE_LIMIT_EXCEEDED: "Rate limit exceeded",
} as const;
