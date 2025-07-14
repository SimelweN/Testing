import nodemailer from "nodemailer";
import {
  handleCORS,
  validateFields,
  validateEmail,
  checkRateLimit,
  logEvent,
  parseRequestBody,
  errorResponse,
  successResponse,
} from "./_lib/utils.js";
import { renderTemplate } from "./_lib/email-templates.js";

export default async function handler(req, res) {
  // Handle CORS
  handleCORS(req, res);
  if (req.method === "OPTIONS") return;

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed. Use POST.",
    });
  }

  try {
    const body = await parseRequestBody(req);
    const { to, subject, html, text, template, from, replyTo, attachments } =
      body;

    // Validate required fields
    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: to, subject",
      });
    }

    // Check if we have content or template
    if (!html && !text && !template) {
      return res.status(400).json({
        success: false,
        error: "Either html, text, or template must be provided",
      });
    }

    // Validate email addresses
    const emails = Array.isArray(to) ? to : [to];
    for (const email of emails) {
      if (!validateEmail(email)) {
        return res.status(400).json({
          success: false,
          error: `Invalid email format: ${email}`,
        });
      }
    }

    // Rate limiting
    const clientIP =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      "unknown";
    const rateLimitKey = `email_${clientIP}_${emails[0]}`;
    const rateCheck = checkRateLimit(rateLimitKey, 10, 60000); // 10 emails per minute

    if (!rateCheck.allowed) {
      logEvent("rate_limited", { ip: clientIP, to: emails });
      return res.status(429).json({
        success: false,
        error: "Rate limit exceeded",
        details: { resetTime: rateCheck.resetTime },
      });
    }

    // Get email configuration
    const smtpKey = process.env.BREVO_SMTP_KEY;
    const smtpUser = process.env.BREVO_SMTP_USER || "8e237b002@smtp-brevo.com";
    const defaultFrom =
      process.env.DEFAULT_FROM_EMAIL ||
      '"ReBooked Solutions" <noreply@rebookedsolutions.co.za>';

    if (!smtpKey) {
      throw new Error("BREVO_SMTP_KEY environment variable is required");
    }

    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpKey,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 10,
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
    });

    // Verify connection
    try {
      await transporter.verify();
      logEvent("smtp_verified", { message: "SMTP connection verified" });
    } catch (error) {
      logEvent("smtp_failed", { error: error.message });
      throw new Error(`SMTP connection failed: ${error.message}`);
    }

    let finalHtml = html;
    let finalText = text;

    // Process template if provided
    if (template) {
      try {
        const rendered = renderTemplate(template.name, template.data);
        finalHtml = rendered.html;
        finalText = rendered.text;
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: `Template error: ${error.message}`,
        });
      }
    }

    // Sanitize HTML content
    if (finalHtml) {
      finalHtml = finalHtml
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "");
    }

    // Prepare mail options
    const mailOptions = {
      from: from || defaultFrom,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html: finalHtml,
      text: finalText,
      replyTo,
      attachments: attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
        encoding: att.encoding || "base64",
      })),
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // Log success
    logEvent("email_sent", {
      messageId: info.messageId,
      to: emails,
      subject,
      template: template?.name,
      response: info.response,
    });

    // Close transporter
    transporter.close();

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      details: {
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
      },
    });
  } catch (error) {
    logEvent("email_failed", {
      error: error.message,
      stack: error.stack,
    });

    let statusCode = 500;
    if (
      error.message.includes("Missing required fields") ||
      error.message.includes("Invalid email format") ||
      error.message.includes("Template error")
    ) {
      statusCode = 400;
    } else if (error.message.includes("SMTP connection failed")) {
      statusCode = 502;
    }

    return res.status(statusCode).json({
      success: false,
      error: error.message || "Email sending failed",
    });
  }
}
