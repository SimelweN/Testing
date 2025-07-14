import { EmailRequest, EMAIL_ERRORS } from "./email-types.ts";

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateEmailRequest(request: EmailRequest): {
  isValid: boolean;
  error?: string;
} {
  // Check required fields
  if (!request.to || !request.subject) {
    return { isValid: false, error: EMAIL_ERRORS.MISSING_REQUIRED_FIELDS };
  }

  // Check if we have either content or template
  if (!request.html && !request.text && !request.template) {
    return {
      isValid: false,
      error: "Either html, text, or template must be provided",
    };
  }

  // Validate email addresses
  const emails = Array.isArray(request.to) ? request.to : [request.to];
  for (const email of emails) {
    if (!validateEmail(email)) {
      return {
        isValid: false,
        error: `${EMAIL_ERRORS.INVALID_EMAIL_FORMAT}: ${email}`,
      };
    }
  }

  // Validate from email if provided
  if (request.from && !validateEmail(request.from)) {
    return {
      isValid: false,
      error: `${EMAIL_ERRORS.INVALID_EMAIL_FORMAT}: from address`,
    };
  }

  // Validate replyTo email if provided
  if (request.replyTo && !validateEmail(request.replyTo)) {
    return {
      isValid: false,
      error: `${EMAIL_ERRORS.INVALID_EMAIL_FORMAT}: replyTo address`,
    };
  }

  return { isValid: true };
}

export function sanitizeEmailContent(content: string): string {
  // Basic HTML sanitization - in production, consider using a proper HTML sanitizer
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}

export function formatEmailAddresses(addresses: string | string[]): string {
  if (Array.isArray(addresses)) {
    return addresses.join(", ");
  }
  return addresses;
}

export function createRateLimitKey(ip: string, email: string): string {
  return `email_rate_limit:${ip}:${email}`;
}

export function logEmailEvent(
  type: "sent" | "failed" | "rate_limited",
  details: any,
): void {
  const timestamp = new Date().toISOString();
  console.log(
    JSON.stringify({
      timestamp,
      type,
      details: {
        ...details,
        // Remove sensitive data from logs
        auth: undefined,
        password: undefined,
      },
    }),
  );
}
