import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const now = new Date();
  const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

  console.log(`[ReBooked Auto-Expire] Starting book order expiry run. Cutoff: ${cutoff}`);

  try {
    // Find expired book orders that sellers haven't committed to
    // Use simple query to avoid relationship issues
    const { data: expiredOrders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "pending_commit")
      .lte("created_at", cutoff);

    if (error) {
      console.error("[ReBooked Auto-Expire] DB fetch error:", error.message);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to fetch expired book orders",
          details: error.message 
        }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (!expiredOrders || expiredOrders.length === 0) {
      console.log("[ReBooked Auto-Expire] No expired book orders found.");
      return new Response(
        JSON.stringify({ 
          success: true,
          expired: 0, 
          processed: 0,
          message: "No expired book orders found - all sellers are responsive!" 
        }), 
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    let successCount = 0;
    let failedCount = 0;
    const processedBooks = [];
    const errorDetails = [];

    console.log(`[ReBooked Auto-Expire] Processing ${expiredOrders.length} expired book orders...`);

    for (const order of expiredOrders) {
      try {
        // Fetch book and profile info separately to avoid relationship issues
        const { data: book } = await supabase
          .from("books")
          .select("title, author, price")
          .eq("id", order.book_id)
          .single();

        const { data: buyer } = await supabase
          .from("profiles")
          .select("id, name, email")
          .eq("id", order.buyer_id)
          .single();

        const { data: seller } = await supabase
          .from("profiles")
          .select("id, name, email")
          .eq("id", order.seller_id)
          .single();

        console.log(`[ReBooked Auto-Expire] Processing order ${order.id} - Book: "${book?.title}" by ${book?.author}`);

        const declineRes = await fetch(
          `${SUPABASE_URL}/functions/v1/decline-commit`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              order_id: order.id,
              seller_id: order.seller_id,
              reason: "Auto-expired: Seller did not commit to book sale within 48 hours",
            }),
          }
        );

        if (!declineRes.ok) {
          const errorText = await declineRes.text();
          console.error(`[ReBooked Auto-Expire] Decline failed for book order ${order.id}:`, errorText);
          failedCount++;
          errorDetails.push({
            order_id: order.id,
            book_title: book?.title || "Unknown",
            error: errorText
          });
          continue;
        }

        // Track successful expiry
        processedBooks.push({
          order_id: order.id,
          book_title: book?.title || "Unknown Book",
          book_author: book?.author || "Unknown Author",
          book_price: book?.price || order.total_amount || 0,
          buyer_email: buyer?.email || "unknown",
          seller_email: seller?.email || "unknown",
          expired_at: now.toISOString()
        });

        successCount++;
        console.log(`[ReBooked Auto-Expire] ✅ Successfully expired book order ${order.id}`);

      } catch (err) {
        console.error(`[ReBooked Auto-Expire] Error processing book order ${order.id}:`, err);
        failedCount++;
        errorDetails.push({
          order_id: order.id,
          book_title: "Unknown",
          error: err.message
        });
      }
    }

    const result = {
      success: true,
      processed: expiredOrders.length,
      expired: successCount,
      failed: failedCount,
      total_books_freed: successCount,
      books_back_to_market: processedBooks.map(book => ({
        title: book.book_title,
        author: book.book_author,
        price: `R${book.book_price.toFixed(2)}`
      })),
      error_details: errorDetails,
      message: `ReBooked Auto-Expire: ${successCount} book orders expired, ${successCount} books back on the market!`
    };

    // Send notification email if books were processed
    if (successCount > 0) {
      try {
        const totalValue = processedBooks.reduce((sum, book) => sum + book.book_price, 0);
        
        await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            to: "admin@rebookedsolutions.co.za",
            subject: `📚 ReBooked Auto-Expire: ${successCount} books back on the market!`,
            html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Auto-Expire Report - ReBooked Solutions</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f3fef7; padding: 20px; margin: 0; }
    .container { max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; }
    .header { background: #44ab83; color: white; padding: 20px; text-align: center; border-radius: 10px; margin: -30px -30px 20px -30px; }
    .book-item { background: #f9fafb; border-left: 3px solid #44ab83; padding: 10px; margin: 5px 0; }
    .footer { background: #f3fef7; padding: 15px; text-align: center; margin: 20px -30px -30px -30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 ReBooked Auto-Expire Report</h1>
      <p>Keeping the book marketplace flowing!</p>
    </div>
    
    <h2>Books Back on the Market</h2>
    <p><strong>📅 Generated:</strong> ${now.toLocaleString()}</p>
    <p><strong>📊 Summary:</strong> ${successCount} books freed up for new buyers</p>
    <p><strong>💰 Total Value:</strong> R${totalValue.toFixed(2)}</p>
    
    <h3>📖 Books Now Available Again:</h3>
    ${processedBooks.slice(0, 10).map(book => `
    <div class="book-item">
      <p><strong>"${book.book_title}"</strong> by ${book.book_author}</p>
      <p>Price: R${book.book_price.toFixed(2)} | Order: ${book.order_id}</p>
    </div>
    `).join('')}
    
    ${processedBooks.length > 10 ? `<p><em>... and ${processedBooks.length - 10} more books</em></p>` : ''}
    
    <div class="footer">
      <p><strong>ReBooked Solutions - Pre-Loved Pages, New Adventures</strong></p>
      <p>Automated system keeping our book marketplace efficient 📚</p>
    </div>
  </div>
</body>
</html>`,
            text: `ReBooked Auto-Expire Report

${successCount} books have been freed up and are back on the market!

Summary:
- Books processed: ${successCount}
- Total value: R${totalValue.toFixed(2)}
- Generated: ${now.toLocaleString()}

Books now available again:
${processedBooks.slice(0, 10).map(book => 
  `"${book.book_title}" by ${book.book_author} - R${book.book_price.toFixed(2)}`
).join('\n')}

ReBooked Solutions - Pre-Loved Pages, New Adventures`
          }),
        });

        // Create database notification for admin users
        try {
          // Try to get admin user ID from environment variable, fallback to looking up by email
          let adminUserId = Deno.env.get("ADMIN_USER_ID");

          if (!adminUserId) {
            // Look up admin user by email
            const { data: adminUser } = await supabase
              .from("profiles")
              .select("id")
              .eq("email", "admin@rebookedsolutions.co.za")
              .single();

            adminUserId = adminUser?.id;
          }

          if (adminUserId) {
            await supabase
              .from('notifications')
              .insert({
                user_id: adminUserId,
                type: 'info',
                title: `📚 Auto-Expire: ${successCount} books back on market`,
                message: `${successCount} books have been freed up and are back on the market! Total value: R${totalValue.toFixed(2)}. Generated: ${now.toLocaleString()}`,
                action_required: false
              });

            console.log(`✅ Created database notification for admin about ${successCount} expired books`);
          } else {
            console.warn("No admin user found for database notification");
          }
        } catch (notificationError) {
          console.error("Failed to create admin database notification:", notificationError);
        }

      } catch (emailError) {
        console.error("[ReBooked Auto-Expire] Failed to send notification email:", emailError);
      }
    }

    console.log("[ReBooked Auto-Expire] Summary:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
        console.error("[ReBooked Auto-Expire] Critical error:", error?.message || error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to process book order expiry",
        details: error instanceof Error ? error.message :
                typeof error === "string" ? error :
                "Auto-expire processing failed"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
