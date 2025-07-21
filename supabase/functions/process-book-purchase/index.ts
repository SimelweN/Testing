import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { enhancedParseRequestBody } from "../_shared/enhanced-body-parser.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (data: any, options: { status?: number; headers?: Record<string, string> } = {}) => {
  return new Response(JSON.stringify(data), {
    status: options.status || 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...options.headers
    }
  });
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    let requestBody;
    const bodyResult = await enhancedParseRequestBody(req, corsHeaders);
    if (!bodyResult.success) {
      return bodyResult.errorResponse!;
    }
    const requestBody = bodyResult.data;

    const {
      book_id,
      buyer_id,
      seller_id,
      amount,
      payment_reference,
      buyer_email,
      shipping_address
    } = requestBody;

    // Validate required fields
    const missingFields = [];
    if (!book_id) missingFields.push("book_id");
    if (!buyer_id) missingFields.push("buyer_id");
    if (!seller_id) missingFields.push("seller_id");
    if (!amount) missingFields.push("amount");
    if (!payment_reference) missingFields.push("payment_reference");

    if (missingFields.length > 0) {
      return jsonResponse({
        success: false,
        error: "MISSING_REQUIRED_FIELDS",
        details: {
          missing_fields: missingFields,
          provided_fields: Object.keys(requestBody),
          message: "Required fields are missing for book purchase"
        },
      }, { status: 400 });
    }

    // Validate amount format
    if (typeof amount !== "number" || amount <= 0) {
      return jsonResponse({
        success: false,
        error: "INVALID_AMOUNT_FORMAT",
        details: {
          amount_type: typeof amount,
          amount_value: amount,
          message: "Amount must be a positive number"
        },
      }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get book details
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("*")
      .eq("id", book_id)
      .eq("seller_id", seller_id)
      .eq("sold", false)
      .single();

    if (bookError || !book) {
      return jsonResponse({
        success: false,
        error: "BOOK_NOT_AVAILABLE",
        details: {
          book_id,
          seller_id,
          error_message: bookError?.message || "Book not found or already sold"
        },
      }, { status: 404 });
    }

    // Get buyer and seller profiles
    const [{ data: buyer }, { data: seller }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", buyer_id).single(),
      supabase.from("profiles").select("*").eq("id", seller_id).single()
    ]);

    if (!buyer || !seller) {
      return jsonResponse({
        success: false,
        error: "USER_PROFILES_NOT_FOUND",
        details: {
          buyer_found: !!buyer,
          seller_found: !!seller,
          message: "Required user profiles not found"
        },
      }, { status: 404 });
    }

    // Mark book as sold
    const { error: bookUpdateError } = await supabase
      .from("books")
      .update({
        sold: true,
        sold_at: new Date().toISOString(),
        buyer_id,
        updated_at: new Date().toISOString()
      })
      .eq("id", book_id)
      .eq("sold", false);

    if (bookUpdateError) {
      return jsonResponse({
        success: false,
        error: "BOOK_UPDATE_FAILED",
        details: {
          error_message: bookUpdateError.message,
          book_id
        },
      }, { status: 500 });
    }

    // Create order
    const commitDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
    const finalPaymentRef = payment_reference || `single_book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        buyer_id,
        buyer_email: buyer_email || buyer.email,
        seller_id,
        items: [{
          book_id,
          title: book.title,
          author: book.author,
          price: amount,
          condition: book.condition,
          seller_id
        }],
        amount: Math.round(amount * 100), // Convert to cents
        total_amount: amount,
        status: "pending_commit",
        payment_status: "paid",
        payment_reference: finalPaymentRef,
        shipping_address: shipping_address || {},
        commit_deadline: commitDeadline.toISOString(),
        paid_at: new Date().toISOString(),
        buyer_name: buyer.name,
        seller_name: seller.name,
        seller_email: seller.email,
        expires_at: commitDeadline.toISOString(),
        created_at: new Date().toISOString(),
        metadata: {
          created_from: "single_book_purchase",
          item_count: 1,
          book_id
        }
      })
      .select()
      .single();

    if (orderError) {
      // Rollback book sale if order creation fails
      await supabase
        .from("books")
        .update({ sold: false, buyer_id: null, sold_at: null })
        .eq("id", book_id);

      return jsonResponse({
        success: false,
        error: "ORDER_CREATION_FAILED",
        details: {
          error_message: orderError.message
        },
      }, { status: 500 });
    }

    // Create notifications
    await Promise.all([
      supabase.from("order_notifications").insert({
        order_id: order.id,
        user_id: buyer_id,
        type: "order_confirmed",
        title: "Purchase Confirmed!",
        message: `Your purchase of "${book.title}" has been confirmed. Total: R${amount.toFixed(2)}`
      }),
      supabase.from("order_notifications").insert({
        order_id: order.id,
        user_id: seller_id,
        type: "new_order",
        title: "New Sale!",
        message: `You have a new order for "${book.title}" worth R${amount.toFixed(2)}. Please commit within 48 hours.`
      })
    ]);

    // Log activity
    await supabase.from("order_activity_log").insert({
      order_id: order.id,
      user_id: buyer_id,
      action: "single_book_purchase",
      new_status: "pending_commit",
      metadata: {
        book_id,
        amount,
        payment_reference: finalPaymentRef
      }
    });

    // Queue notification emails
    const buyerEmailHtml = `
      <div style="font-family: Arial, sans-serif;">
        <h2>Purchase Confirmed!</h2>
        <p>Hi ${buyer.name},</p>
        <p>Your purchase has been confirmed!</p>
        <p><strong>Book:</strong> "${book.title}" by ${book.author}</p>
        <p><strong>Price:</strong> R${amount.toFixed(2)}</p>
        <p><strong>Seller:</strong> ${seller.name}</p>
        <p>The seller has 48 hours to commit to the sale. We'll notify you once they confirm!</p>
        <p>Thank you for choosing ReBooked Solutions!</p>
      </div>
    `;

    const sellerEmailHtml = `
      <div style="font-family: Arial, sans-serif;">
        <h2>New Sale - Action Required!</h2>
        <p>Hi ${seller.name},</p>
        <p>Great news! You have a new sale!</p>
        <p><strong>Book:</strong> "${book.title}" by ${book.author}</p>
        <p><strong>Price:</strong> R${amount.toFixed(2)}</p>
        <p><strong>Buyer:</strong> ${buyer.name}</p>
        <p><strong>Deadline:</strong> ${commitDeadline.toLocaleString()}</p>
        <p><strong>⏰ Please commit to this sale within 48 hours or it will be automatically cancelled.</strong></p>
        <p>Log in to your account to commit to the sale!</p>
      </div>
    `;

    await Promise.all([
      supabase.from("mail_queue").insert({
        user_id: buyer_id,
        email: buyer_email || buyer.email,
        subject: "📚 Purchase Confirmed - ReBooked",
        body: buyerEmailHtml,
        status: "pending",
        created_at: new Date().toISOString()
      }),
      supabase.from("mail_queue").insert({
        user_id: seller_id,
        email: seller.email,
        subject: "💰 New Sale - Action Required (48 hours)",
        body: sellerEmailHtml,
        status: "pending",
        created_at: new Date().toISOString()
      })
    ]);

    return jsonResponse({
      success: true,
      message: "Book purchase processed successfully",
      order: {
        id: order.id,
        book_id,
        book_title: book.title,
        amount,
        status: order.status,
        commit_deadline: commitDeadline.toISOString(),
        payment_reference: finalPaymentRef
      }
    });

  } catch (error) {
    console.error('Error in process-book-purchase:', error);
    return jsonResponse({
      success: false,
      error: "INTERNAL_SERVER_ERROR",
      details: {
        error_message: error.message,
        timestamp: new Date().toISOString()
      },
    }, { status: 500 });
  }
});
