import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { templateName, template, data, to, subject, html, text } =
      await req.json();

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
            error: emailError.message,
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
          error: "templateName or template is required",
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
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
