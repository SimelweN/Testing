import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("🕐 Mail queue cron job triggered at:", new Date().toISOString());

    // Call the mail queue processor
    const processorResponse = await fetch(`${SUPABASE_URL}/functions/v1/process-mail-queue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({}),
    });

    const processorResult = await processorResponse.json();

    if (processorResponse.ok) {
      console.log("✅ Mail queue processed successfully:", processorResult);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Mail queue cron job completed",
          processor_result: processorResult,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      console.error("❌ Mail queue processor failed:", processorResult);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: "PROCESSOR_FAILED",
          details: processorResult,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("❌ Mail queue cron job error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "CRON_JOB_FAILED",
        details: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
