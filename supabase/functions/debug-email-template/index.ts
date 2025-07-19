import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Validate request method
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "METHOD_NOT_ALLOWED",
        details: {
          provided_method: req.method,
          required_method: "POST",
          message: "Debug email template endpoint only accepts POST requests",
        },
        fix_instructions: "Send requests using POST method only",
      }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    // Check environment configuration
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const missingEnvVars = [];
    if (!supabaseUrl) missingEnvVars.push("SUPABASE_URL");
    if (!supabaseServiceKey) missingEnvVars.push("SUPABASE_SERVICE_ROLE_KEY");

    if (missingEnvVars.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ENVIRONMENT_CONFIG_ERROR",
          details: {
            missing_env_vars: missingEnvVars,
            message: "Required environment variables are not configured",
          },
          fix_instructions:
            "Configure missing environment variables in deployment settings",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_JSON_PAYLOAD",
          details: {
            parse_error: parseError.message,
            message: "Request body must be valid JSON",
          },
          fix_instructions: "Ensure request body contains valid JSON format",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { templateName, template, data, to, subject, html, text } =
      requestBody;

    // Handle direct email sending (new format)
    if (to && subject && (html || text)) {
      try {
        const emailResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/send-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
            body: JSON.stringify({
              to,
              subject,
              html,
              text,
            }),
          },
        );

        const emailResult = await emailResponse.json();

        return new Response(
          JSON.stringify({
            success: emailResult.success || emailResponse.ok,
            email_sent: emailResult.success || emailResponse.ok,
            message_id: emailResult.messageId,
            details: emailResult,
            timestamp: new Date().toISOString(),
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        return new Response(
          JSON.stringify({
            success: false,
            error: "EMAIL_SEND_FAILED",
            details: {
              email_error: emailError.message,
              email_data: { to, subject, has_html: !!html, has_text: !!text },
              message: "Failed to send test email via send-email function",
            },
            fix_instructions:
              "Check email configuration and recipient address validity",
            timestamp: new Date().toISOString(),
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Handle template rendering (legacy format)
    const finalTemplateName = templateName || template;

    if (!finalTemplateName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "MISSING_TEMPLATE_NAME",
          details: {
            provided_fields: Object.keys(requestBody || {}),
            required_fields: ["templateName", "template"],
            message: "Template name is required for template debugging",
          },
          fix_instructions:
            "Provide either 'templateName' or 'template' field in request body",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Mock template rendering for now
    const mockRendered = {
      html: `<h1>Template: ${finalTemplateName}</h1><p>Data: ${JSON.stringify(data || {})}</p>`,
      text: `Template: ${finalTemplateName}\nData: ${JSON.stringify(data || {})}`,
    };

    return new Response(
      JSON.stringify({
        success: true,
        templateName: finalTemplateName,
        rendered: mockRendered,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Debug email template error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "UNEXPECTED_TEMPLATE_DEBUG_ERROR",
        details: {
          error_message: error.message,
          error_stack: error.stack,
          error_type: error.constructor.name,
          timestamp: new Date().toISOString(),
        },
        fix_instructions:
          "This is an unexpected server error. Check server logs for details.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
