import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
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
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    console.log("🧪 Testing mail_queue table functionality...");
    
    const results = {
      tableExists: false,
      canInsert: false,
      canSelect: false,
      recentOrders: 0,
      emailsInQueue: 0,
      testResults: []
    };

    // Test 1: Check if table exists by trying to select from it
    try {
      const { data: testSelect, error: selectError } = await supabase
        .from('mail_queue')
        .select('id, status, created_at')
        .limit(1);

      if (selectError) {
        results.testResults.push({
          test: "Table existence check",
          success: false,
          error: selectError.message
        });
      } else {
        results.tableExists = true;
        results.canSelect = true;
        results.testResults.push({
          test: "Table existence check",
          success: true,
          message: "Table exists and is accessible"
        });
      }
    } catch (error) {
      results.testResults.push({
        test: "Table existence check",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }

    // Test 2: Try to insert a test email
    if (results.tableExists) {
      try {
        const testEmail = {
          user_id: "00000000-0000-0000-0000-000000000000", // Test UUID
          email: "test@example.com",
          subject: "Test Email - Mail Queue Diagnostic",
          body: "<p>This is a test email to verify mail_queue functionality.</p>",
          status: "pending",
          created_at: new Date().toISOString()
        };

        const { error: insertError } = await supabase
          .from('mail_queue')
          .insert(testEmail);

        if (insertError) {
          results.testResults.push({
            test: "Insert test email",
            success: false,
            error: insertError.message
          });
        } else {
          results.canInsert = true;
          results.testResults.push({
            test: "Insert test email",
            success: true,
            message: "Successfully inserted test email"
          });

          // Clean up test email
          await supabase
            .from('mail_queue')
            .delete()
            .eq('email', 'test@example.com')
            .eq('subject', 'Test Email - Mail Queue Diagnostic');
        }
      } catch (error) {
        results.testResults.push({
          test: "Insert test email",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    // Test 3: Count recent orders
    try {
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, created_at, buyer_id')
        .order('created_at', { ascending: false })
        .limit(10);

      if (ordersError) {
        results.testResults.push({
          test: "Count recent orders",
          success: false,
          error: ordersError.message
        });
      } else {
        results.recentOrders = orders?.length || 0;
        results.testResults.push({
          test: "Count recent orders",
          success: true,
          message: `Found ${results.recentOrders} recent orders`
        });
      }
    } catch (error) {
      results.testResults.push({
        test: "Count recent orders",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }

    // Test 4: Count emails in queue
    if (results.tableExists) {
      try {
        const { data: emails, error: emailsError } = await supabase
          .from('mail_queue')
          .select('id, subject, status, created_at')
          .order('created_at', { ascending: false })
          .limit(10);

        if (emailsError) {
          results.testResults.push({
            test: "Count queued emails",
            success: false,
            error: emailsError.message
          });
        } else {
          results.emailsInQueue = emails?.length || 0;
          results.testResults.push({
            test: "Count queued emails",
            success: true,
            message: `Found ${results.emailsInQueue} emails in queue`,
            emails: emails?.map(e => ({
              subject: e.subject,
              status: e.status,
              created_at: e.created_at
            }))
          });
        }
      } catch (error) {
        results.testResults.push({
          test: "Count queued emails",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    // Test 5: Check order-email correlation
    const recentOrderDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    if (results.tableExists) {
      try {
        const { data: orderEmails, error: orderEmailsError } = await supabase
          .from('mail_queue')
          .select('id, subject, status, created_at')
          .gte('created_at', recentOrderDate)
          .or('subject.ilike.%order%,subject.ilike.%purchase%,subject.ilike.%confirmed%');

        if (orderEmailsError) {
          results.testResults.push({
            test: "Check order-related emails",
            success: false,
            error: orderEmailsError.message
          });
        } else {
          results.testResults.push({
            test: "Check order-related emails",
            success: true,
            message: `Found ${orderEmails?.length || 0} order-related emails in last 24h`,
            orderEmails: orderEmails
          });
        }
      } catch (error) {
        results.testResults.push({
          test: "Check order-related emails",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Mail queue diagnostic completed",
        results,
        summary: {
          mail_queue_working: results.tableExists && results.canInsert && results.canSelect,
          problem_identified: results.recentOrders > 0 && results.emailsInQueue === 0,
          recommendations: results.recentOrders > 0 && results.emailsInQueue === 0 
            ? [
                "Orders are being created but emails are not being queued",
                "Check create-order function error logs",
                "Verify mail_queue insert operations have proper error handling",
                "Test order creation flow manually"
              ]
            : results.tableExists 
              ? ["Mail queue system appears to be working correctly"]
              : ["Mail queue table needs to be created"]
        }
      }, null, 2),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("❌ Mail queue test failed:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: "Mail queue diagnostic failed",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
