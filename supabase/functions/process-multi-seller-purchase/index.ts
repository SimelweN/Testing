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

    try {
    // Safety check for body consumption
    console.log("Body used before consumption:", req.bodyUsed);

    let requestData;
    try {
      requestData = await req.json();
    } catch (bodyError) {
      console.error("Body consumption error:", bodyError.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: "BODY_CONSUMPTION_ERROR",
          details: {
            error_message: bodyError.message,
            body_used: req.bodyUsed,
            timestamp: new Date().toISOString()
          },
          fix_instructions: "Request body may have been consumed already. Check for duplicate body reads."
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { user_id, cart_items, shipping_address, email } = requestData;

    // Enhanced validation with specific error messages
    const validationErrors = [];
    if (!user_id) validationErrors.push("user_id is required");
    if (!cart_items) validationErrors.push("cart_items is required");
    if (!email) validationErrors.push("email is required");

    if (cart_items && !Array.isArray(cart_items)) {
      validationErrors.push("cart_items must be an array");
    }

    if (cart_items && Array.isArray(cart_items) && cart_items.length === 0) {
      validationErrors.push("cart_items cannot be empty");
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.push("email format is invalid");
    }

    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "VALIDATION_FAILED",
          details: {
            validation_errors: validationErrors,
                        provided_fields: Object.keys({ user_id, cart_items, shipping_address, email }),
            message: `Validation failed: ${validationErrors.join(", ")}`,
            required_format: {
              user_id: "String, authenticated user ID",
              cart_items: "Array of objects with book_id and optional quantity",
              email: "Valid email address for buyer",
              shipping_address: "Object with address details (optional)",
            },
          },
          fix_instructions:
            "Provide all required fields with correct formats. cart_items should be an array like: [{'book_id': 'book123', 'quantity': 1}]",
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

    // Validate cart items structure
    const invalidItems = cart_items.filter((item: any) => !item.book_id);
    if (invalidItems.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_CART_ITEMS",
          details: {
            invalid_items: invalidItems,
            missing_field: "book_id",
            message: "All cart items must have a book_id field",
            cart_items_count: cart_items.length,
          },
          fix_instructions:
            "Ensure every item in cart_items has a 'book_id' field. Example: [{'book_id': 'book123', 'quantity': 1}]",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get all book details and validate availability
    const bookIds = cart_items.map((item: any) => item.book_id);
    const { data: books, error: booksError } = await supabase
      .from("books")
      .select("*")
      .in("id", bookIds)
      .eq("sold", false);

    if (booksError) {
      if (booksError.code === "PGRST116") {
        return new Response(
          JSON.stringify({
            success: false,
            error: "NO_BOOKS_FOUND",
            details: {
              book_ids: bookIds,
              database_error: booksError.message,
              message: "None of the requested books were found",
            },
            fix_instructions:
              "Verify the book IDs exist in the database and are not already sold",
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
            error_code: booksError.code,
            error_message: booksError.message,
            query_details:
              "SELECT from books table with book IDs and sold=false filter",
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

    if (!books || books.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "NO_AVAILABLE_BOOKS",
          details: {
            requested_book_ids: bookIds,
            found_books: 0,
            message: "None of the requested books are available for purchase",
            possible_reasons: [
              "Books have been sold to other buyers",
              "Books have been removed by sellers",
              "Book IDs are incorrect",
            ],
          },
          fix_instructions:
            "Refresh the book listings to see current availability. Remove unavailable books from cart.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (books.length !== cart_items.length) {
      const availableIds = books.map((b) => b.id);
      const unavailableIds = bookIds.filter((id) => !availableIds.includes(id));

      return new Response(
        JSON.stringify({
          success: false,
          error: "SOME_BOOKS_UNAVAILABLE",
          details: {
            requested_books: cart_items.length,
            available_books: books.length,
            unavailable_book_ids: unavailableIds,
            available_books: books.map((b) => ({
              id: b.id,
              title: b.title,
              price: b.price,
            })),
            message: "Some books in your cart are no longer available",
          },
          fix_instructions:
            "Remove the unavailable books from your cart and try again. The available books are listed above.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get seller information for all books
    const sellerIds = [...new Set(books.map((b) => b.seller_id))];
    const { data: sellers, error: sellersError } = await supabase
      .from("profiles")
      .select("id, name, email, subaccount_code")
      .in("id", sellerIds);

    if (sellersError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "SELLERS_QUERY_FAILED",
          details: {
            error_code: sellersError.code,
            error_message: sellersError.message,
            seller_ids: sellerIds,
          },
          fix_instructions:
            "Check database connection and profiles table structure",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check if buyer is trying to buy their own books
    const ownBooks = books.filter((book) => book.seller_id === user_id);
    if (ownBooks.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "SELF_PURCHASE_ATTEMPT",
          details: {
            user_id,
            own_books: ownBooks.map((b) => ({
              id: b.id,
              title: b.title,
              price: b.price,
            })),
            message: "Cannot purchase your own books",
            books_count: ownBooks.length,
          },
          fix_instructions:
            "Remove your own books from the cart. You cannot purchase books you are selling.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check for already reserved books
    const reservedBooks = books.filter(
      (book) =>
        book.reserved_until &&
        new Date(book.reserved_until) > new Date() &&
        book.reserved_by !== user_id,
    );

    if (reservedBooks.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "BOOKS_CURRENTLY_RESERVED",
          details: {
            reserved_books: reservedBooks.map((b) => ({
              id: b.id,
              title: b.title,
              reserved_until: b.reserved_until,
              reserved_by: b.reserved_by,
            })),
            message: "Some books are currently reserved by other buyers",
            reserved_count: reservedBooks.length,
          },
          fix_instructions:
            "Wait for the reservation to expire or remove these books from your cart. Reservations typically last 15 minutes.",
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Prepare items for payment processing
    const items = books.map((book) => {
      const cartItem = cart_items.find((item: any) => item.book_id === book.id);
      const seller = sellers?.find((s) => s.id === book.seller_id);
      return {
        book_id: book.id,
        seller_id: book.seller_id,
        title: book.title,
        author: book.author,
        price: book.price,
        image_url: book.image_url,
        quantity: cartItem?.quantity || 1,
        seller_name: seller?.name,
        seller_subaccount: seller?.subaccount_code,
      };
    });

    // Calculate total amount
    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Group by seller for split payment calculation
    const sellerGroups = items.reduce((acc: any, item) => {
      const sellerId = item.seller_id;
      if (!acc[sellerId]) {
        acc[sellerId] = {
          seller_id: sellerId,
          seller_name: item.seller_name,
          items: [],
          total: 0,
        };
      }
      acc[sellerId].items.push(item);
      acc[sellerId].total += item.price * item.quantity;
      return acc;
    }, {});

    const sellerCount = Object.keys(sellerGroups).length;

    // Check if sellers have payment setup (subaccounts)
    const sellersWithoutPayment = items.filter(
      (item) => !item.seller_subaccount,
    );
    if (sellersWithoutPayment.length > 0) {
      const affectedSellers = [
        ...new Set(
          sellersWithoutPayment.map((item) => ({
            seller_id: item.seller_id,
            seller_name: item.seller_name,
            books: sellersWithoutPayment
              .filter((si) => si.seller_id === item.seller_id)
              .map((si) => ({ id: si.book_id, title: si.title })),
          })),
        ),
      ];

      return new Response(
        JSON.stringify({
          success: false,
          error: "SELLERS_PAYMENT_NOT_CONFIGURED",
          details: {
            sellers_without_payment: affectedSellers,
            affected_books_count: sellersWithoutPayment.length,
            message: "Some sellers haven't configured their payment details",
          },
          fix_instructions:
            "These sellers need to complete their banking setup before their books can be purchased. Contact the sellers or choose different books.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Initialize payment with Paystack (supports multi-seller split)
    try {
      const paymentResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/initialize-paystack-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({
            user_id,
            items,
            total_amount: totalAmount,
            shipping_address,
            email,
            metadata: {
              purchase_type: "multi_seller_cart",
              seller_count: sellerCount,
              seller_groups: sellerGroups,
            },
          }),
        },
      );

      const paymentResult = await paymentResponse.json();

      if (!paymentResult.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "PAYMENT_INITIALIZATION_FAILED",
            details: {
              payment_error: paymentResult.error,
              payment_details: paymentResult.details,
              total_amount: totalAmount,
              seller_count: sellerCount,
            },
            fix_instructions:
              paymentResult.fix_instructions ||
              "Check payment service configuration and try again",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Temporarily reserve all books (prevents multiple purchases)
      const reservationExpiry = new Date(
        Date.now() + 15 * 60 * 1000,
      ).toISOString(); // 15 minutes

      const { error: reservationError } = await supabase
        .from("books")
        .update({
          reserved_until: reservationExpiry,
          reserved_by: user_id,
        })
        .in("id", bookIds);

      if (reservationError) {
        console.warn(
          "Failed to reserve books (continuing anyway):",
          reservationError,
        );
      }

      // Prepare response with seller breakdown
      const sellerBreakdown = Object.values(sellerGroups).map((group: any) => ({
        seller_id: group.seller_id,
        seller_name: group.seller_name,
        items_count: group.items.length,
        total_amount: group.total,
        items: group.items.map((item: any) => ({
          book_id: item.book_id,
          title: item.title,
          author: item.author,
          price: item.price,
          quantity: item.quantity,
        })),
      }));

      return new Response(
        JSON.stringify({
          success: true,
          payment: paymentResult.data,
          cart_summary: {
            total_items: items.length,
            total_amount: totalAmount,
            seller_count: sellerCount,
            sellers: sellerBreakdown,
            reservation_expires: reservationExpiry,
          },
          message: "Payment initialized for multi-seller cart purchase",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (paymentError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYMENT_SERVICE_ERROR",
          details: {
            error_message: paymentError.message,
            payment_service: "initialize-paystack-payment",
            total_amount: totalAmount,
          },
          fix_instructions:
            "Payment service is unavailable. Please try again later or contact support.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  } catch (error) {
    console.error("Process multi-seller purchase error:", error);
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
