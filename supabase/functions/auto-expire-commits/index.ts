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
            html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Auto-Expire Report - ReBooked Solutions</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f3fef7;
      padding: 20px;
      color: #1f4e3d;
      margin: 0;
    }
    .container {
      max-width: 600px;
      margin: auto;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: #dc2626;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 10px 10px 0 0;
      margin: -30px -30px 20px -30px;
    }
    .stats-box {
      background: #fef2f2;
      border: 1px solid #dc2626;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .order-item {
      background: #f9fafb;
      border-left: 3px solid #dc2626;
      padding: 10px;
      margin: 5px 0;
    }
    .footer {
      background: #f3fef7;
      color: #1f4e3d;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      line-height: 1.5;
      margin: 30px -30px -30px -30px;
      border-radius: 0 0 10px 10px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Auto-Expire Report</h1>
    </div>

    <h2>Orders Automatically Expired</h2>
    <p>Report generated on: ${new Date().toLocaleString()}</p>

    <div class="stats-box">
      <h3>📊 Summary</h3>
      <p><strong>Orders Processed:</strong> ${processedOrders.length}</p>
      <p><strong>Errors:</strong> ${errors.length}</p>
      <p><strong>Total Refund Amount:</strong> R${processedOrders.reduce((sum, order) => sum + order.amount, 0).toFixed(2)}</p>
    </div>

    ${
      processedOrders.length > 0
        ? `
    <h3>📋 Processed Orders (showing first 10)</h3>
    ${processedOrders
      .slice(0, 10)
      .map(
        (order) => `
    <div class="order-item">
      <p><strong>Order ID:</strong> ${order.order_id}</p>
      <p><strong>Buyer:</strong> ${order.buyer_email}</p>
      <p><strong>Seller:</strong> ${order.seller_email}</p>
      <p><strong>Amount:</strong> R${order.amount.toFixed(2)}</p>
    </div>
    `,
      )
      .join("")}
    ${processedOrders.length > 10 ? `<p><em>... and ${processedOrders.length - 10} more orders</em></p>` : ""}
    `
        : ""
    }

    ${
      errors.length > 0
        ? `
    <div class="stats-box">
      <h3>❌ Errors Encountered</h3>
      <p>${errors.length} errors occurred during processing. Check logs for details.</p>
    </div>
    `
        : ""
    }

    <div class="footer">
      <p><strong>This is an automated system report from ReBooked Solutions.</strong></p>
      <p><em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
  </div>
</body>
</html>`,
            text: `Auto-Expire Report

Orders Automatically Expired
Report generated on: ${new Date().toLocaleString()}

Summary:
Orders Processed: ${processedOrders.length}
Errors: ${errors.length}
Total Refund Amount: R${processedOrders.reduce((sum, order) => sum + order.amount, 0).toFixed(2)}

${
  processedOrders.length > 0
    ? `
Processed Orders (first 10):
${processedOrders
  .slice(0, 10)
  .map(
    (order) => `
Order ID: ${order.order_id}
Buyer: ${order.buyer_email}
Seller: ${order.seller_email}
Amount: R${order.amount.toFixed(2)}
---`,
  )
  .join("\n")}
${processedOrders.length > 10 ? `... and ${processedOrders.length - 10} more orders` : ""}
`
    : ""
}

${
  errors.length > 0
    ? `
Errors: ${errors.length} errors occurred during processing. Check logs for details.
`
    : ""
}

This is an automated system report from ReBooked Solutions.
"Pre-Loved Pages, New Adventures"`,
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
