// Version: 2024-01-17-FINAL - ALL 10 TEMPLATES COMPLETELY REWRITTEN FROM SCRATCH WITH NEW STYLING
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer";
import { corsHeaders } from "../_shared/cors.ts";
import {
  EmailRequest,
  EmailResponse,
  EmailConfig,
  EMAIL_ERRORS,
} from "../_shared/email-types.ts";
import { parseRequestBody } from "../_shared/safe-body-parser.ts";
import {
  validateEmailRequest,
  sanitizeEmailContent,
  formatEmailAddresses,
  logEmailEvent,
  createRateLimitKey,
} from "../_shared/email-utils.ts";
// Template system REMOVED - direct HTML only

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
    throw new Error("BREVO_SMTP_KEY environment variable is required");
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

  // Template system REMOVED - Only direct HTML is supported now
  // All emails must provide html and text directly
  if (request.template) {
    console.log(
      `⚠️  Template system deprecated. Use direct html/text instead.`,
    );
    throw new Error(
      "Template system is deprecated. Please provide html and text directly.",
    );
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
        error: "METHOD_NOT_ALLOWED",
        details: {
          provided_method: req.method,
          required_method: "POST",
          message: "Email endpoint only accepts POST requests",
        },
        fix_instructions: "Send email requests using POST method only",
      }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    // Parse request body
    const bodyResult = await parseRequestBody<EmailRequest>(req, corsHeaders);
    if (!bodyResult.success) {
      return bodyResult.errorResponse!;
    }
    const emailRequest = bodyResult.data;

    // Handle test requests
    if (emailRequest.test === true) {
      try {
        const config = getEmailConfig();
        return new Response(
          JSON.stringify({
            success: true,
            message: "Connection test successful",
            config: {
              host: config.host,
              port: config.port,
              hasAuth: !!config.auth.user && !!config.auth.pass,
              defaultFrom: config.defaultFrom,
            },
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "EMAIL_CONFIGURATION_ERROR",
            details: {
              config_error: error.message,
              message: "Email service configuration is invalid",
              missing_env_vars: !Deno.env.get("BREVO_SMTP_KEY")
                ? ["BREVO_SMTP_KEY"]
                : [],
            },
            fix_instructions:
              "Configure required environment variables: BREVO_SMTP_KEY",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
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
          error: "RATE_LIMIT_EXCEEDED",
          details: {
            reset_time: rateCheck.resetTime,
            max_requests: RATE_LIMIT.maxRequests,
            window_ms: RATE_LIMIT.windowMs,
            client_ip: clientIP,
            message: "Too many email requests from this client",
          },
          fix_instructions: `Wait ${Math.ceil((rateCheck.resetTime! - Date.now()) / 1000)} seconds before sending another email`,
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

    // Determine error details and status code
    let errorCode = "EMAIL_SEND_FAILED";
    let statusCode = 500;
    let fixInstructions = "Check email configuration and try again";

    if (
      error.message.includes("MISSING_REQUIRED_FIELDS") ||
      error.message.includes("INVALID_EMAIL_FORMAT") ||
      error.message.includes("TEMPLATE_NOT_FOUND")
    ) {
      errorCode = "VALIDATION_FAILED";
      statusCode = 400;
      fixInstructions = "Check email request format and required fields";
    } else if (error.message.includes("SMTP_CONNECTION_FAILED")) {
      errorCode = "SMTP_CONNECTION_FAILED";
      statusCode = 502;
      fixInstructions = "Check SMTP configuration and network connectivity";
    } else if (error.message.includes("BREVO_SMTP_KEY")) {
      errorCode = "ENVIRONMENT_CONFIG_ERROR";
      statusCode = 500;
      fixInstructions = "Configure BREVO_SMTP_KEY environment variable";
    }

    const response: EmailResponse = {
      success: false,
      error: errorCode,
      details: {
        error_message: error.message,
        error_type: error.constructor.name,
        timestamp: new Date().toISOString(),
      },
      fix_instructions: fixInstructions,
    };

    return new Response(JSON.stringify(response), {
      status: statusCode,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
