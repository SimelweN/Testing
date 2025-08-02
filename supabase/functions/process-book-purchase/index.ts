import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    console.log('🚀 Processing book purchase request...');
    
    // Parse request body
    let requestBody;
    try {
      const rawBody = await req.text();
      console.log('📥 Raw request body:', rawBody);
      requestBody = JSON.parse(rawBody);
    } catch (error) {
      console.error('❌ Error parsing request body:', error);
      return jsonResponse({
        success: false,
        error: "INVALID_JSON",
        details: {
          error_message: "Request body must be valid JSON",
          parsing_error: error.message
        },
      }, { status: 400 });
    }

    const {
      book_id,
      buyer_id,
      seller_id,
      amount,
      payment_reference,
      buyer_email,
      shipping_address
    } = requestBody;

    console.log('📊 Request parameters:', {
      book_id,
      buyer_id,
      seller_id,
      amount,
      payment_reference,
      buyer_email: buyer_email ? 'provided' : 'not provided',
      shipping_address: shipping_address ? 'provided' : 'not provided'
    });

    // Validate required fields
    const missingFields = [];
    if (!book_id) missingFields.push("book_id");
    if (!buyer_id) missingFields.push("buyer_id");
    if (!seller_id) missingFields.push("seller_id");
    if (!amount) missingFields.push("amount");
    if (!payment_reference) missingFields.push("payment_reference");

    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
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
      console.error('❌ Invalid amount:', amount, typeof amount);
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

    console.log('✅ All validations passed, proceeding with database operations...');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get book details and verify availability
    console.log('📚 Fetching book details...');
    const { data: books, error: bookError } = await supabase
      .from("books")
      .select("id,title,author,price,seller_id,sold,condition,category,image_url,created_at,updated_at")
      .eq("id", book_id)
      .eq("seller_id", seller_id)
      .eq("sold", false);

    const book = books && books.length > 0 ? books[0] : null;

    if (bookError || !book) {
      console.error('❌ Book not available:', bookError?.message);
      return jsonResponse({
        success: false,
        error: "BOOK_NOT_AVAILABLE",
        details: {
          book_id,
          seller_id,
          error_message: bookError?.message || "Book not found or already sold",
          database_error: bookError
        },
      }, { status: 404 });
    }

    console.log('✅ Book found:', book.title, 'by', book.author);

    // Validate amount matches book price
    if (Math.abs(amount - parseFloat(book.price)) > 0.01) {
      console.error('❌ Amount mismatch:', { expected: book.price, provided: amount });
      return jsonResponse({
        success: false,
        error: "AMOUNT_MISMATCH",
        details: {
          expected_amount: parseFloat(book.price),
          provided_amount: amount,
          message: "Amount does not match book price"
        },
      }, { status: 400 });
    }

    // Get buyer and seller profiles
    console.log('👥 Fetching user profiles...');
    const [{ data: buyer, error: buyerError }, { data: seller, error: sellerError }] = await Promise.all([
      supabase.from("profiles").select("id, name, email, phone_number, pickup_address, subaccount_code").eq("id", buyer_id).maybeSingle(),
      supabase.from("profiles").select("id, name, email, phone_number, pickup_address, subaccount_code").eq("id", seller_id).maybeSingle()
    ]);

    if (buyerError || !buyer) {
      console.error('❌ Buyer profile not found:', buyerError?.message);
      return jsonResponse({
        success: false,
        error: "BUYER_NOT_FOUND",
        details: {
          buyer_id,
          error_message: buyerError?.message || "Buyer profile not found"
        },
      }, { status: 404 });
    }

    if (sellerError || !seller) {
      console.error('❌ Seller profile not found:', sellerError?.message);
      return jsonResponse({
        success: false,
        error: "SELLER_NOT_FOUND",
        details: {
          seller_id,
          error_message: sellerError?.message || "Seller profile not found"
        },
      }, { status: 404 });
    }

    console.log('✅ Profiles found - Buyer:', buyer.name || buyer.email, 'Seller:', seller.name || seller.email);

    // Prevent self-purchase
    if (buyer_id === seller_id) {
      console.error('❌ Self-purchase attempt');
      return jsonResponse({
        success: false,
        error: "SELF_PURCHASE_NOT_ALLOWED",
        details: {
          message: "Cannot purchase your own book"
        },
      }, { status: 400 });
    }

    // Mark book as sold (with optimistic locking)
    console.log('📝 Marking book as sold...');
    const { error: bookUpdateError } = await supabase
      .from("books")
      .update({
        sold: true,
        updated_at: new Date().toISOString()
      })
      .eq("id", book_id)
      .eq("sold", false); // Ensure it's still available

    if (bookUpdateError) {
      console.error('❌ Failed to mark book as sold:', bookUpdateError.message);
      return jsonResponse({
        success: false,
        error: "BOOK_UPDATE_FAILED",
        details: {
          error_message: bookUpdateError.message,
          book_id,
          message: "Book may have been sold by another buyer"
        },
      }, { status: 409 });
    }

    // Create order
    console.log('📋 Creating order...');
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
      console.error('�� Order creation failed:', orderError.message);
      
      // Rollback book sale if order creation fails
      console.log('🔄 Rolling back book sale...');
      await supabase
        .from("books")
        .update({ sold: false, updated_at: new Date().toISOString() })
        .eq("id", book_id);

      return jsonResponse({
        success: false,
        error: "ORDER_CREATION_FAILED",
        details: {
          error_message: orderError.message,
          rollback_performed: true
        },
      }, { status: 500 });
    }

    console.log('✅ Order created successfully:', order.id);

    // Create notifications
    console.log('📬 Creating notifications...');
    const notificationPromises = [
      supabase.from("notifications").insert({
        user_id: buyer_id,
        type: "success",
        title: "🛒 Purchase Confirmed!",
        message: `Your purchase of "${book.title}" has been confirmed. Total: R${amount.toFixed(2)}. Order ID: ${order.id}`
      }),
      supabase.from("notifications").insert({
        user_id: seller_id,
        type: "info",
        title: "📦 New Sale!",
        message: `You have a new order for "${book.title}" worth R${amount.toFixed(2)}. Please commit within 48 hours. Order ID: ${order.id}`
      })
    ];

    await Promise.all(notificationPromises);
    console.log('✅ Notifications created');

    // Log activity
    console.log('📊 Logging activity...');
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

    console.log('🎉 Book purchase completed successfully!');

    return jsonResponse({
      success: true,
      message: "Book purchase processed successfully",
      order: {
        id: order.id,
        book_id,
        book_title: book.title,
        book_author: book.author,
        amount,
        status: order.status,
        commit_deadline: commitDeadline.toISOString(),
        payment_reference: finalPaymentRef,
        seller_name: seller.name || seller.email,
        buyer_name: buyer.name || buyer.email
      }
    });

  } catch (error) {
    console.error('❌ Error in process-book-purchase:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error constructor:', error?.constructor?.name);
    console.error('❌ Error message:', error?.message);
    console.error('❌ Error stack:', error?.stack);

    // Extract a meaningful error message
    let errorMessage = "Unknown internal server error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      errorMessage = error.message || error.details || error.hint || String(error);
    }

    return jsonResponse({
      success: false,
      error: "INTERNAL_SERVER_ERROR",
      details: {
        error_message: errorMessage,
        error_type: typeof error,
        error_constructor: error?.constructor?.name,
        timestamp: new Date().toISOString(),
        debug_info: {
          full_error: String(error),
          request_processing_failed: true
        }
      },
    }, { status: 500 });
  }
});
