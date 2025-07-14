import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Find orders that have expired (48 hours old and still pending commit)
    const fortyEightHoursAgo = new Date(
      Date.now() - 48 * 60 * 60 * 1000,
    ).toISOString();

    const { data: expiredOrders, error: expiredError } = await supabase
      .from("orders")
      .select(
        `
        *,
        seller:profiles!orders_seller_id_fkey(id, name, email),
        buyer:profiles!orders_buyer_id_fkey(id, name, email)
      `,
      )
      .eq("status", "pending_commit")
      .lt("created_at", fortyEightHoursAgo);

    if (expiredError) {
      throw new Error(
        `Failed to fetch expired orders: ${expiredError.message}`,
      );
    }

    if (!expiredOrders || expiredOrders.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No expired orders found",
          processed: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const processedOrders = [];
    const errors = [];

    // Process each expired order
    for (const order of expiredOrders) {
      try {
        // Call decline-commit function to handle the expiration
        const declineResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/decline-commit`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
            body: JSON.stringify({
              order_id: order.id,
              seller_id: order.seller_id,
              reason: "Order expired - seller did not commit within 48 hours",
            }),
          },
        );

        const declineResult = await declineResponse.json();

        if (declineResult.success) {
          processedOrders.push({
            order_id: order.id,
            buyer_email: order.buyer.email,
            seller_email: order.seller.email,
            amount: order.total_amount,
            expired_at: new Date().toISOString(),
          });

          // Log the automatic expiration
          console.log(
            `Auto-expired order ${order.id} for seller ${order.seller_id}`,
          );
        } else {
          errors.push({
            order_id: order.id,
            error: declineResult.error,
          });
        }
      } catch (orderError) {
        console.error(
          `Failed to process expired order ${order.id}:`,
          orderError,
        );
        errors.push({
          order_id: order.id,
          error: orderError.message,
        });
      }
    }

    // Send summary report if there were processed orders
    if (processedOrders.length > 0) {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({
            to: "admin@rebookedsolutions.co.za", // Admin notification
            subject: `Auto-Expire Report: ${processedOrders.length} orders expired`,
            template: {
              name: "admin-auto-expire-report",
              data: {
                processedCount: processedOrders.length,
                errorCount: errors.length,
                processedOrders: processedOrders.slice(0, 10), // Limit for email size
                totalRefundAmount: processedOrders.reduce(
                  (sum, order) => sum + order.amount,
                  0,
                ),
                reportDate: new Date().toISOString(),
              },
            },
          }),
        });
      } catch (emailError) {
        console.error("Failed to send admin report:", emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedOrders.length,
        errors: errors.length,
        processedOrders: processedOrders,
        errorDetails: errors,
        message: `Processed ${processedOrders.length} expired orders, ${errors.length} errors`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Auto-expire commits error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to process expired orders",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
