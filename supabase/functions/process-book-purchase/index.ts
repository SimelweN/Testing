import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { parseRequestBody } from "../_shared/safe-body-parser.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Read request body ONCE at the start (ChatGPT's advice)
  let requestBody;
  try {
    console.log("🔍 bodyUsed before read:", req.bodyUsed);
    requestBody = await req.json();
    console.log("✅ Body read successfully");
  } catch (error) {
    console.error("❌ Body read failed:", error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: "BODY_READ_ERROR",
        details: { error: error.message, bodyUsed: req.bodyUsed },
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const {
      user_id,
      book_id,
      email,
      shipping_address,
      payment_reference,
      total_amount,
      delivery_details,
    } = requestBody;

    console.log("�� Processing book purchase confirmation:", {
      user_id,
      book_id,
      payment_reference,
      total_amount,
    });

    // Enhanced validation with specific error messages
    const validationErrors = [];
    if (!user_id) validationErrors.push("user_id is required");
    if (!book_id) validationErrors.push("book_id is required");
    if (!email) validationErrors.push("email is required");
    if (!payment_reference)
      validationErrors.push("payment_reference is required");

    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "VALIDATION_FAILED",
          details: {
            missing_fields: validationErrors,
                        provided_fields: Object.keys({
              user_id,
              book_id,
              email,
              shipping_address,
              payment_reference,
              total_amount,
              delivery_details,
            }),
            message: `Missing required fields: ${validationErrors.join(", ")}`,
          },
          fix_instructions:
            "Provide all required fields: user_id (string), book_id (string), email (string), payment_reference (string). Optional: shipping_address, total_amount, delivery_details",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_EMAIL_FORMAT",
          details: {
            provided_email: email,
            message: "Email format is invalid",
          },
          fix_instructions:
            "Provide a valid email address in format: user@domain.com",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ENVIRONMENT_CONFIG_ERROR",
          details: {
            missing_env_vars: [
              !SUPABASE_URL ? "SUPABASE_URL" : null,
              !SUPABASE_SERVICE_KEY ? "SUPABASE_SERVICE_ROLE_KEY" : null,
            ].filter(Boolean),
            message: "Required environment variables are not configured",
          },
          fix_instructions:
            "Configure missing environment variables in your deployment settings",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get book details with seller information
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("*")
      .eq("id", book_id)
      .single();

    if (bookError) {
      if (bookError.code === "PGRST116") {
        return new Response(
          JSON.stringify({
            success: false,
            error: "BOOK_NOT_FOUND",
            details: {
              book_id,
              database_error: bookError.message,
              message: "Book not found",
            },
            fix_instructions:
              "Verify the book_id exists in the books table. The book may have been deleted or the ID is incorrect.",
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: "DATABASE_QUERY_FAILED",
          details: {
            error_code: bookError.code,
            error_message: bookError.message,
            query_details: "SELECT from books table with book_id filter",
          },
          fix_instructions:
            "Check database connection and table structure. Ensure 'books' table exists and is accessible.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!book) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "BOOK_NOT_FOUND",
          details: {
            book_id,
            message: "Book not found",
          },
          fix_instructions:
            "Verify the book_id is correct and the book exists in the database",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check if book is already sold
    if (book.sold) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "BOOK_ALREADY_SOLD",
          details: {
            book_id,
            book_title: book.title,
            sold_status: book.sold,
            sold_at: book.sold_at,
            message: "Book has already been sold",
          },
          fix_instructions:
            "This book is no longer available for purchase. Choose a different book or refresh the listings.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check if buyer is trying to buy their own book
    if (book.seller_id === user_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "SELF_PURCHASE_ATTEMPT",
          details: {
            book_id,
            user_id,
            seller_id: book.seller_id,
            message: "Cannot purchase your own book",
          },
          fix_instructions:
            "Users cannot purchase books they are selling. Use a different user account or choose a different book.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get buyer information
    const { data: buyer, error: buyerError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user_id)
      .single();

    if (buyerError || !buyer) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "BUYER_NOT_FOUND",
          details: {
            user_id,
            database_error: buyerError?.message,
            message: "Buyer profile not found",
          },
          fix_instructions:
            "Verify the user_id exists in the profiles table. The user may need to complete registration first.",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get seller information
    const { data: seller, error: sellerError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", book.seller_id)
      .single();

    if (sellerError || !seller) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "SELLER_NOT_FOUND",
          details: {
            seller_id: book.seller_id,
            book_id,
            database_error: sellerError?.message,
            message: "Seller profile not found",
          },
          fix_instructions:
            "The seller's profile is missing. This may indicate data integrity issues. Contact support.",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Generate unique order ID
    const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create order
    const orderData = {
      id: orderId,
      buyer_id: user_id,
      seller_id: book.seller_id,
      status: "pending_commit",
      total_amount: total_amount || book.price,
      items: [
        {
          book_id: book.id,
          title: book.title,
          author: book.author,
          price: book.price,
          condition: book.condition,
          seller_id: book.seller_id,
        },
      ],
      shipping_address,
      payment_reference,
      buyer_name: buyer.name,
      buyer_email: buyer.email,
      seller_name: seller.name,
      seller_email: seller.email,
      delivery_details: delivery_details || {},
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
      created_at: new Date().toISOString(),
    };

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error("Failed to create order:", {
        error: orderError,
        orderData,
        book_id,
        user_id,
      });

      // Specific order creation error handling
      if (orderError.code === "23505") {
        // Unique constraint violation
        return new Response(
          JSON.stringify({
            success: false,
            error: "DUPLICATE_ORDER_ATTEMPT",
            details: {
              error_code: orderError.code,
              error_message: orderError.message,
              order_id: orderId,
              message: "Order with this ID already exists",
            },
            fix_instructions:
              "This is likely a retry attempt. Check if the order was already created successfully.",
          }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      if (orderError.code === "23503") {
        // Foreign key constraint violation
        return new Response(
          JSON.stringify({
            success: false,
            error: "DATABASE_CONSTRAINT_VIOLATION",
            details: {
              error_code: orderError.code,
              error_message: orderError.message,
              possible_causes: [
                "buyer_id does not exist in profiles table",
                "seller_id does not exist in profiles table",
                "Referenced foreign key constraints are not met",
              ],
            },
            fix_instructions:
              "Ensure both buyer and seller profiles exist and are properly linked. Check database foreign key constraints.",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: "ORDER_CREATION_FAILED",
          details: {
            error_code: orderError.code,
            error_message: orderError.message,
            order_data: orderData,
            message: `Failed to create order: ${orderError.message}`,
          },
          fix_instructions:
            "Check database permissions and table structure. Ensure 'orders' table exists with proper columns and constraints.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Mark book as sold
    const { error: bookUpdateError } = await supabase
      .from("books")
      .update({
        sold: true,
        sold_at: new Date().toISOString(),
        buyer_id: user_id,
        reserved_until: null,
        reserved_by: null,
      })
      .eq("id", book_id);

    if (bookUpdateError) {
      console.warn("Failed to mark book as sold:", {
        error: bookUpdateError,
        book_id,
        user_id,
      });
      // Don't fail the order creation for this, but log it
    }

    // Send notification emails
    const emailPromises = [];
    const emailResults = {
      seller_email_sent: false,
      buyer_email_sent: false,
      errors: [],
    };

    try {
      // Email to seller
      const sellerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Order - Action Required</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f3fef7; padding: 20px; color: #1f4e3d; }
    .container { max-width: 500px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
    .header { background: #3ab26f; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -30px -30px 20px -30px; }
    .footer { background: #f3fef7; color: #1f4e3d; padding: 20px; text-align: center; font-size: 12px; line-height: 1.5; margin: 30px -30px -30px -30px; border-radius: 0 0 10px 10px; border-top: 1px solid #e5e7eb; }
    .info-box { background: #f3fef7; border: 1px solid #3ab26f; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .warning { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border: 1px solid #ffeaa7; }
    .btn { display: inline-block; padding: 12px 20px; background-color: #3ab26f; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
    .link { color: #3ab26f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 New Order - Action Required!</h1>
    </div>

    <h2>Hi ${seller.name}!</h2>
    <p>Great news! You have a new order from <strong>${buyer.name}</strong>.</p>

    <div class="info-box">
      <h3>📋 Order Details</h3>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Book:</strong> ${book.title}</p>
      <p><strong>Author:</strong> ${book.author}</p>
      <p><strong>Buyer:</strong> ${buyer.name} (${email})</p>
      <p><strong>Total Amount:</strong> R${orderData.total_amount.toFixed(2)}</p>
    </div>

    <div class="warning">
      <h3>⏰ Action Required Within 48 Hours</h3>
      <p><strong>Expires:</strong> ${new Date(orderData.expires_at).toLocaleString()}</p>
      <p>You must commit to this order within 48 hours or it will be automatically cancelled and refunded.</p>
    </div>

    <p>Once you commit, we'll arrange pickup and you'll be paid after delivery!</p>

    <a href="https://rebookedsolutions.co.za/activity" class="btn">Commit to Order</a>

    <div class="footer">
      <p><strong>This is an automated message from ReBooked Solutions.</strong><br>
      Please do not reply to this email.</p>
      <p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>
      Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p>
      <p>T&Cs apply. <em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
  </div>
</body>
</html>`;

      emailPromises.push(
        fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({
            to: seller.email,
            subject: "📚 New Order - Action Required (48 hours)",
            html: sellerHtml,
            text: `New Order - Action Required!\n\nHi ${seller.name}!\n\nGreat news! You have a new order from ${buyer.name}.\n\nOrder Details:\n- Order ID: ${orderId}\n- Book: ${book.title}\n- Author: ${book.author}\n- Buyer: ${buyer.name} (${email})\n- Total Amount: R${orderData.total_amount.toFixed(2)}\n\n⏰ Action Required Within 48 Hours\nExpires: ${new Date(orderData.expires_at).toLocaleString()}\n\nYou must commit to this order within 48 hours or it will be automatically cancelled.\n\nCommit to order: https://rebookedsolutions.co.za/activity\n\nReBooked Solutions`,
          }),
        })
          .then(() => {
            emailResults.seller_email_sent = true;
          })
          .catch((error) => {
            emailResults.errors.push({
              recipient: "seller",
              error: error.message,
            });
          }),
      );

      // Email to buyer
      const buyerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmed - Thank You!</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f3fef7; padding: 20px; color: #1f4e3d; }
    .container { max-width: 500px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
    .header { background: #3ab26f; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -30px -30px 20px -30px; }
    .footer { background: #f3fef7; color: #1f4e3d; padding: 20px; text-align: center; font-size: 12px; line-height: 1.5; margin: 30px -30px -30px -30px; border-radius: 0 0 10px 10px; border-top: 1px solid #e5e7eb; }
    .info-box { background: #f3fef7; border: 1px solid #3ab26f; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .steps { background: #f3fef7; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .btn { display: inline-block; padding: 12px 20px; background-color: #3ab26f; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
    .link { color: #3ab26f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
    </div>

    <h2>Thank you, ${buyer.name}!</h2>
    <p>Your order has been confirmed and <strong>${seller.name}</strong> has been notified.</p>

    <div class="info-box">
      <h3>📋 Order Details</h3>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Book:</strong> ${book.title}</p>
      <p><strong>Author:</strong> ${book.author}</p>
      <p><strong>Seller:</strong> ${seller.name}</p>
      <p><strong>Total Amount:</strong> R${orderData.total_amount.toFixed(2)}</p>
      <p><strong>Payment Reference:</strong> ${payment_reference}</p>
    </div>

    <div class="steps">
      <h3>📦 What happens next?</h3>
      <ul>
        <li>The seller has 48 hours to commit to your order</li>
        <li>Once committed, we'll arrange pickup and delivery</li>
        <li>You'll receive tracking information via email</li>
        <li>Your book will be delivered within 2-3 business days</li>
      </ul>
    </div>

    <p>We'll notify you as soon as the seller confirms your order!</p>

    <a href="https://rebookedsolutions.co.za/activity" class="btn">Track Your Order</a>

    <div class="footer">
      <p><strong>This is an automated message from ReBooked Solutions.</strong><br>
      Please do not reply to this email.</p>
      <p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>
      Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p>
      <p>T&Cs apply. <em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
  </div>
</body>
</html>`;

      emailPromises.push(
        fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({
            to: buyer.email,
            subject: "🎉 Order Confirmed - Thank You!",
            html: buyerHtml,
            text: `Order Confirmed!\n\nThank you, ${buyer.name}!\n\nYour order has been confirmed and ${seller.name} has been notified.\n\nOrder Details:\n- Order ID: ${orderId}\n- Book: ${book.title}\n- Author: ${book.author}\n- Seller: ${seller.name}\n- Total Amount: R${orderData.total_amount.toFixed(2)}\n- Payment Reference: ${payment_reference}\n\nWhat happens next?\n- The seller has 48 hours to commit to your order\n- Once committed, we'll arrange pickup and delivery\n- You'll receive tracking information via email\n- Your book will be delivered within 2-3 business days\n\nTrack your order: https://rebookedsolutions.co.za/activity\n\nReBooked Solutions`,
          }),
        })
          .then(() => {
            emailResults.buyer_email_sent = true;
          })
          .catch((error) => {
            emailResults.errors.push({
              recipient: "buyer",
              error: error.message,
            });
          }),
      );

      // Wait for emails
      await Promise.allSettled(emailPromises);
    } catch (emailError) {
      console.error("Failed to send notification emails:", emailError);
      emailResults.errors.push({ general: emailError.message });
    }

    console.log("✅ Book purchase processed successfully:", {
      order_id: orderId,
      book_title: book.title,
      buyer: buyer.name,
      seller: seller.name,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order created successfully",
        details: {
          order_id: orderId,
          book: {
            id: book.id,
            title: book.title,
            author: book.author,
            price: book.price,
          },
          buyer: {
            id: buyer.id,
            name: buyer.name,
            email: buyer.email,
          },
          seller: {
            id: seller.id,
            name: seller.name,
            email: seller.email,
          },
          order: {
            id: orderId,
            status: "pending_commit",
            total_amount: orderData.total_amount,
            expires_at: orderData.expires_at,
            created_at: orderData.created_at,
          },
          notifications: emailResults,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("💥 Process book purchase error:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: "UNEXPECTED_ERROR",
        details: {
          error_message: error.message,
          error_stack: error.stack,
          error_type: error.constructor.name,
          timestamp: new Date().toISOString(),
        },
        fix_instructions:
          "This is an unexpected server error. Check the server logs for more details and contact support if the issue persists.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
