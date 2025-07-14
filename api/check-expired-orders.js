import { handleCORS, createSupabaseClient, logEvent } from "./_lib/utils.js";

export default async function handler(req, res) {
  handleCORS(req, res);
  if (req.method === "OPTIONS") return;

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed. Use POST.",
    });
  }

  try {
    logEvent("expired_orders_check_started", {});

    const supabase = createSupabaseClient();
    const now = new Date().toISOString();

    // Check for different types of expired orders
    const checks = await Promise.all([
      checkPendingCommitExpiry(supabase, now, req),
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
        await fetch(`${req.headers.host}/api/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        logEvent("admin_summary_failed", { error: emailError.message });
      }
    }

    logEvent("expired_orders_check_completed", {
      processed: totalProcessed,
      errors: totalErrors,
    });

    return res.status(200).json({
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
    });
  } catch (error) {
    logEvent("expired_orders_check_error", { error: error.message });

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to check expired orders",
    });
  }
}

async function checkPendingCommitExpiry(supabase, now, req) {
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

    if (expiredOrders && expiredOrders.length > 0) {
      try {
        const response = await fetch(
          `${req.headers.host}/api/auto-expire-commits`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          },
        );

        const result = await response.json();

        if (result.success) {
          processed = result.processed || 0;
          errors = result.errors || 0;
        } else {
          errors = expiredOrders.length;
        }
      } catch {
        errors = expiredOrders.length;
      }
    }

    return {
      type: "commit_expiry",
      processed,
      errors,
      found: expiredOrders?.length || 0,
    };
  } catch (error) {
    logEvent("commit_expiry_check_failed", { error: error.message });
    return { type: "commit_expiry", processed: 0, errors: 1, found: 0 };
  }
}

async function checkCollectionTimeouts(supabase, now) {
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
        logEvent("collection_timeout_processed", { order_id: order.id });
      } catch (error) {
        logEvent("collection_timeout_error", {
          order_id: order.id,
          error: error.message,
        });
      }
    }

    return {
      type: "collection_timeouts",
      processed,
      errors: 0,
      found: timedOutOrders?.length || 0,
    };
  } catch (error) {
    logEvent("collection_timeout_check_failed", { error: error.message });
    return { type: "collection_timeouts", processed: 0, errors: 1, found: 0 };
  }
}

async function checkDeliveryTimeouts(supabase, now) {
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
        logEvent("delivery_timeout_processed", { order_id: order.id });
      } catch (error) {
        logEvent("delivery_timeout_error", {
          order_id: order.id,
          error: error.message,
        });
      }
    }

    return {
      type: "delivery_timeouts",
      processed,
      errors: 0,
      found: timedOutDeliveries?.length || 0,
    };
  } catch (error) {
    logEvent("delivery_timeout_check_failed", { error: error.message });
    return { type: "delivery_timeouts", processed: 0, errors: 1, found: 0 };
  }
}

async function checkReservationExpiry(supabase, now) {
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
        logEvent("reservation_expired", { book_id: book.id });
      } catch (error) {
        logEvent("reservation_expiry_error", {
          book_id: book.id,
          error: error.message,
        });
      }
    }

    return {
      type: "reservation_expiry",
      processed,
      errors: 0,
      found: expiredReservations?.length || 0,
    };
  } catch (error) {
    logEvent("reservation_expiry_check_failed", { error: error.message });
    return { type: "reservation_expiry", processed: 0, errors: 1, found: 0 };
  }
}
