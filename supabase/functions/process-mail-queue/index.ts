import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? '';

interface QueuedEmail {
  id: string;
  user_id: string;
  email: string;
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
  sent_at?: string;
  error_message?: string;
  retry_count?: number;
}

const MAX_RETRIES = 3;
const BATCH_SIZE = 50; // Process emails in batches

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    console.log("🔄 Starting mail queue processing...");

    // Get pending emails from queue
    const { data: pendingEmails, error: fetchError } = await supabase
      .from("mail_queue")
      .select("*")
      .eq("status", "pending")
      .lt("retry_count", MAX_RETRIES)
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      console.error("❌ Error fetching emails from queue:", fetchError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "FETCH_FAILED",
          details: fetchError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log("✅ No pending emails to process");
      return new Response(
        JSON.stringify({
          success: true,
          message: "No pending emails to process",
          processed: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`📬 Found ${pendingEmails.length} pending emails to process`);

    let successCount = 0;
    let failureCount = 0;
    const results = [];

    // Process each email
    for (const email of pendingEmails) {
      try {
        console.log(`📧 Processing email ${email.id} to ${email.email}`);

        // Call the send-email function
        const emailResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({
            to: email.email,
            subject: email.subject,
            html: email.body,
            text: stripHtml(email.body), // Convert HTML to plain text
          }),
        });

        const emailResult = await emailResponse.json();

        if (emailResponse.ok && emailResult.success) {
          // Email sent successfully
          await supabase
            .from("mail_queue")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
              error_message: null,
            })
            .eq("id", email.id);

          successCount++;
          results.push({
            id: email.id,
            status: "sent",
            message_id: emailResult.messageId,
          });

          console.log(`✅ Email ${email.id} sent successfully`);
        } else {
          // Email failed
          const retryCount = (email.retry_count || 0) + 1;
          const errorMessage = emailResult.error || "Unknown error";

          if (retryCount >= MAX_RETRIES) {
            // Max retries reached, mark as failed
            await supabase
              .from("mail_queue")
              .update({
                status: "failed",
                error_message: `Max retries reached: ${errorMessage}`,
                retry_count: retryCount,
              })
              .eq("id", email.id);

            console.log(`❌ Email ${email.id} failed permanently after ${retryCount} attempts`);
          } else {
            // Increment retry count but keep as pending
            await supabase
              .from("mail_queue")
              .update({
                error_message: errorMessage,
                retry_count: retryCount,
              })
              .eq("id", email.id);

            console.log(`⚠️ Email ${email.id} failed, will retry (attempt ${retryCount}/${MAX_RETRIES})`);
          }

          failureCount++;
          results.push({
            id: email.id,
            status: retryCount >= MAX_RETRIES ? "failed" : "retry",
            error: errorMessage,
            retry_count: retryCount,
          });
        }
      } catch (processingError) {
        console.error(`❌ Error processing email ${email.id}:`, processingError);

        // Update retry count and error message
        const retryCount = (email.retry_count || 0) + 1;
        const status = retryCount >= MAX_RETRIES ? "failed" : "pending";

        await supabase
          .from("mail_queue")
          .update({
            status,
            error_message: processingError.message,
            retry_count: retryCount,
          })
          .eq("id", email.id);

        failureCount++;
        results.push({
          id: email.id,
          status,
          error: processingError.message,
          retry_count: retryCount,
        });
      }
    }

    console.log(`📊 Processing complete: ${successCount} sent, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Mail queue processing completed",
        processed: pendingEmails.length,
        successful: successCount,
        failed: failureCount,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Critical error in mail queue processor:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "PROCESSOR_ERROR",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function stripHtml(html: string): string {
  // Simple HTML to text conversion
  return html
    .replace(/<style[^>]*>.*?<\/style>/gis, "")
    .replace(/<script[^>]*>.*?<\/script>/gis, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
