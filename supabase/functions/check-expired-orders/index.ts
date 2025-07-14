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
    const now = new Date().toISOString();

    // Check for different types of expired orders
    const checks = await Promise.all([
      checkPendingCommitExpiry(supabase, now),
      checkCollectionTimeouts(supabase, now),
      checkDeliveryTimeouts(supabase, now),
      checkReservationExpiry(supabase, now),
    ]);

    const [
      commitExpiry,
      collectionTimeouts,
      deliveryTimeouts,
      reservationExpiry,
    ] = checks;

    const totalProcessed =
      commitExpiry.processed +
      collectionTimeouts.processed +
      deliveryTimeouts.processed +
      reservationExpiry.processed;

    const totalErrors =
      commitExpiry.errors +
      collectionTimeouts.errors +
      deliveryTimeouts.errors +
      reservationExpiry.errors;

    // Send admin summary if any issues were found
    if (totalProcessed > 0 || totalErrors > 0) {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({
            to: "admin@rebookedsolutions.co.za",
            subject: `Order Expiry Check Report - ${totalProcessed} processed, ${totalErrors} errors`,
            template: {
              name: "admin-expiry-check-report",
              data: {
                totalProcessed,
                totalErrors,
                commitExpiry,
                collectionTimeouts,
                deliveryTimeouts,
                reservationExpiry,
                checkTime: now,
              },
            },
          }),
        });
      } catch (emailError) {
        console.error("Failed to send admin summary:", emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total_processed: totalProcessed,
          total_errors: totalErrors,
          check_time: now,
        },
        details: {
          commit_expiry: commitExpiry,
          collection_timeouts: collectionTimeouts,
          delivery_timeouts: deliveryTimeouts,
          reservation_expiry: reservationExpiry,
        },
        message: `Processed ${totalProcessed} expired items with ${totalErrors} errors`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Check expired orders error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to check expired orders",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function checkPendingCommitExpiry(supabase: any, now: string) {
  try {
    // Orders pending commit for more than 48 hours
    const fortyEightHoursAgo = new Date(
      Date.now() - 48 * 60 * 60 * 1000,
    ).toISOString();

    const { data: expiredOrders, error } = await supabase
      .from("orders")
      .select("id, seller_id, created_at")
      .eq("status", "pending_commit")
      .lt("created_at", fortyEightHoursAgo);

    if (error) throw error;

    let processed = 0;
    let errors = 0;

    for (const order of expiredOrders || []) {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/auto-expire-commits`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_KEY")}`,
            },
          },
        );

        if (response.ok) {
          processed++;
        } else {
          errors++;
        }
      } catch {
        errors++;
      }
    }

    return {
      type: "commit_expiry",
      processed,
      errors,
      found: expiredOrders?.length || 0,
    };
  } catch (error) {
    console.error("Commit expiry check failed:", error);
    return { type: "commit_expiry", processed: 0, errors: 1, found: 0 };
  }
}

async function checkCollectionTimeouts(supabase: any, now: string) {
  try {
    // Orders scheduled for collection but not collected after 7 days
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data: timedOutOrders, error } = await supabase
      .from("orders")
      .select("id, seller_id, courier_pickup_date")
      .eq("status", "courier_scheduled")
      .lt("courier_pickup_date", sevenDaysAgo);

    if (error) throw error;

    let processed = 0;
    for (const order of timedOutOrders || []) {
      try {
        // Update to collection_timeout status
        await supabase
          .from("orders")
          .update({
            status: "collection_timeout",
            updated_at: now,
          })
          .eq("id", order.id);

        processed++;
      } catch {
        // Error will be counted in summary
      }
    }

    return {
      type: "collection_timeouts",
      processed,
      errors: 0,
      found: timedOutOrders?.length || 0,
    };
  } catch (error) {
    console.error("Collection timeout check failed:", error);
    return { type: "collection_timeouts", processed: 0, errors: 1, found: 0 };
  }
}

async function checkDeliveryTimeouts(supabase: any, now: string) {
  try {
    // Orders collected but not delivered after 14 days
    const fourteenDaysAgo = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data: timedOutDeliveries, error } = await supabase
      .from("orders")
      .select("id, buyer_id, collected_at")
      .eq("status", "collected")
      .lt("collected_at", fourteenDaysAgo);

    if (error) throw error;

    let processed = 0;
    for (const order of timedOutDeliveries || []) {
      try {
        // Auto-mark as delivered after timeout
        await supabase
          .from("orders")
          .update({
            status: "delivered",
            delivered_at: now,
            delivery_notes: "Auto-marked as delivered after timeout",
            updated_at: now,
          })
          .eq("id", order.id);

        processed++;
      } catch {
        // Error will be counted in summary
      }
    }

    return {
      type: "delivery_timeouts",
      processed,
      errors: 0,
      found: timedOutDeliveries?.length || 0,
    };
  } catch (error) {
    console.error("Delivery timeout check failed:", error);
    return { type: "delivery_timeouts", processed: 0, errors: 1, found: 0 };
  }
}

async function checkReservationExpiry(supabase: any, now: string) {
  try {
    // Books reserved but reservation expired
    const { data: expiredReservations, error } = await supabase
      .from("books")
      .select("id, reserved_by, reserved_until")
      .not("reserved_until", "is", null)
      .lt("reserved_until", now);

    if (error) throw error;

    let processed = 0;
    for (const book of expiredReservations || []) {
      try {
        // Clear expired reservations
        await supabase
          .from("books")
          .update({
            reserved_until: null,
            reserved_by: null,
          })
          .eq("id", book.id);

        processed++;
      } catch {
        // Error will be counted in summary
      }
    }

    return {
      type: "reservation_expiry",
      processed,
      errors: 0,
      found: expiredReservations?.length || 0,
    };
  } catch (error) {
    console.error("Reservation expiry check failed:", error);
    return { type: "reservation_expiry", processed: 0, errors: 1, found: 0 };
  }
}
