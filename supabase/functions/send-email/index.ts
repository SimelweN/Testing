import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer";
import { corsHeaders } from "../_shared/cors.ts";
import {
  EmailRequest,
  EmailResponse,
  EmailConfig,
  EMAIL_ERRORS,
} from "../_shared/email-types.ts";
import {
  validateEmailRequest,
  sanitizeEmailContent,
  formatEmailAddresses,
  logEmailEvent,
  createRateLimitKey,
} from "../_shared/email-utils.ts";
import { renderTemplate } from "../_shared/email-templates.ts";
import { isDevelopmentMode, createMockResponse } from "../_shared/dev-mode.ts";

// In-memory rate limiting (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 10, // Max emails per window
  windowMs: 60 * 1000, // 1 minute window
};

function checkRateLimit(key: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT.maxRequests) {
    return { allowed: false, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true };
}

function getEmailConfig(): EmailConfig {
  const smtpKey = Deno.env.get("BREVO_SMTP_KEY");
  const smtpUser =
    Deno.env.get("BREVO_SMTP_USER") || "8e237b002@smtp-brevo.com";
  const defaultFrom =
    Deno.env.get("DEFAULT_FROM_EMAIL") ||
    '"ReBooked Solutions" <noreply@rebookedsolutions.co.za>';

  if (!smtpKey) {
    throw new Error(
      "BREVO_SMTP_KEY environment variable is required. Please configure your email service credentials.",
    );
  }

  return {
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpKey,
    },
    defaultFrom,
  };
}

async function createTransporter(config: EmailConfig) {
  // Return mock transporter in development mode
  if (config.mock) {
    return {
      sendMail: async (mailOptions: any) => {
        logEmailEvent("sent", {
          message: "Mock email sent",
          to: mailOptions.to,
        });
        return {
          messageId: "mock-message-id-" + Date.now(),
          accepted: [mailOptions.to],
          rejected: [],
          response: "250 Mock message accepted",
        };
      },
      verify: async () => true,
    };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    pool: true, // Use connection pooling
    maxConnections: 5,
    maxMessages: 10,
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000, // 30 seconds
    socketTimeout: 60000, // 60 seconds
  });

  // Verify the connection
  try {
    await transporter.verify();
    logEmailEvent("sent", { message: "SMTP connection verified" });
  } catch (error) {
    logEmailEvent("failed", {
      error: EMAIL_ERRORS.SMTP_CONNECTION_FAILED,
      details: error.message,
    });
    throw new Error(`${EMAIL_ERRORS.SMTP_CONNECTION_FAILED}: ${error.message}`);
  }

  return transporter;
}

async function processEmailRequest(request: EmailRequest, config: EmailConfig) {
  // Validate the request
  const validation = validateEmailRequest(request);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  let html = request.html;
  let text = request.text;

  // Process template if provided
  if (request.template) {
    try {
      const rendered = renderTemplate(
        request.template.name as any,
        request.template.data,
      );
      html = rendered.html;
      text = rendered.text;
    } catch (error) {
      throw new Error(`${EMAIL_ERRORS.TEMPLATE_NOT_FOUND}: ${error.message}`);
    }
  }

  // Sanitize content
  if (html) {
    html = sanitizeEmailContent(html);
  }

  // Prepare email options
  const mailOptions = {
    from: request.from || config.defaultFrom,
    to: formatEmailAddresses(request.to),
    subject: request.subject,
    html,
    text,
    replyTo: request.replyTo,
    attachments: request.attachments?.map((att) => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType,
      encoding: att.encoding || "base64",
    })),
  };

  return mailOptions;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Method not allowed. Use POST.",
      }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    // Parse request body
    let emailRequest: EmailRequest;
    try {
      emailRequest = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Rate limiting
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimitKey = createRateLimitKey(
      clientIP,
      Array.isArray(emailRequest.to) ? emailRequest.to[0] : emailRequest.to,
    );
    const rateCheck = checkRateLimit(rateLimitKey);

    if (!rateCheck.allowed) {
      logEmailEvent("rate_limited", {
        ip: clientIP,
        to: emailRequest.to,
        resetTime: rateCheck.resetTime,
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: EMAIL_ERRORS.RATE_LIMIT_EXCEEDED,
          details: { resetTime: rateCheck.resetTime },
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(
              Math.ceil((rateCheck.resetTime! - Date.now()) / 1000),
            ),
          },
        },
      );
    }

    // Get email configuration
    const config = getEmailConfig();

    // Create transporter
    const transporter = await createTransporter(config);

    // Process the email request
    const mailOptions = await processEmailRequest(emailRequest, config);

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    // Log successful send
    logEmailEvent("sent", {
      messageId: info.messageId,
      to: emailRequest.to,
      subject: emailRequest.subject,
      template: emailRequest.template?.name,
      response: info.response,
    });

    const response: EmailResponse = {
      success: true,
      messageId: info.messageId,
      details: {
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log the error
    logEmailEvent("failed", {
      error: error.message,
      stack: error.stack,
    });

    const response: EmailResponse = {
      success: false,
      error: error.message || EMAIL_ERRORS.EMAIL_SEND_FAILED,
    };

    // Determine appropriate status code
    let statusCode = 500;
    if (
      error.message.includes(EMAIL_ERRORS.MISSING_REQUIRED_FIELDS) ||
      error.message.includes(EMAIL_ERRORS.INVALID_EMAIL_FORMAT) ||
      error.message.includes(EMAIL_ERRORS.TEMPLATE_NOT_FOUND)
    ) {
      statusCode = 400;
    } else if (error.message.includes(EMAIL_ERRORS.SMTP_CONNECTION_FAILED)) {
      statusCode = 502;
    }

    return new Response(JSON.stringify(response), {
      status: statusCode,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
