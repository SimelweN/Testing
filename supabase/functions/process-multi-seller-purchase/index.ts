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
    const { user_id, cart_items, shipping_address, email } = await req.json();

    if (
      !user_id ||
      !cart_items ||
      !Array.isArray(cart_items) ||
      cart_items.length === 0 ||
      !email
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: user_id, cart_items (array), email",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get all book details and validate availability
    const bookIds = cart_items.map((item: any) => item.book_id);
    const { data: books, error: booksError } = await supabase
      .from("books")
      .select(
        `
        *,
                seller:profiles!books_seller_id_fkey(id, name, email, paystack_subaccount_code)
      `,
      )
      .in("id", bookIds)
      .eq("sold", false);

    if (booksError) {
      throw new Error(`Failed to fetch books: ${booksError.message}`);
    }

    if (!books || books.length !== cart_items.length) {
      const availableIds = books?.map((b) => b.id) || [];
      const unavailable = bookIds.filter((id) => !availableIds.includes(id));

      return new Response(
        JSON.stringify({
          success: false,
          error: "Some books are no longer available",
          unavailable_books: unavailable,
        }),
        {
          status: 400,
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
          error: "Cannot purchase your own books",
          own_books: ownBooks.map((b) => ({ id: b.id, title: b.title })),
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Prepare items for payment processing
    const items = books.map((book) => {
      const cartItem = cart_items.find((item: any) => item.book_id === book.id);
      return {
        book_id: book.id,
        seller_id: book.seller_id,
        title: book.title,
        price: book.price,
        image_url: book.image_url,
        quantity: cartItem?.quantity || 1,
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
          items: [],
          total: 0,
        };
      }
      acc[sellerId].items.push(item);
      acc[sellerId].total += item.price * item.quantity;
      return acc;
    }, {});

    const sellerCount = Object.keys(sellerGroups).length;

    // Initialize payment with Paystack (supports multi-seller split)
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
      throw new Error(`Payment initialization failed: ${paymentResult.error}`);
    }

    // Temporarily reserve all books (prevents multiple purchases)
    const reservationExpiry = new Date(
      Date.now() + 15 * 60 * 1000,
    ).toISOString(); // 15 minutes
    await supabase
      .from("books")
      .update({
        reserved_until: reservationExpiry,
        reserved_by: user_id,
      })
      .in("id", bookIds);

    // Prepare response with seller breakdown
    const sellerBreakdown = Object.values(sellerGroups).map((group: any) => {
      const seller = books.find((b) => b.seller_id === group.seller_id)?.seller;
      return {
        seller_id: group.seller_id,
        seller_name: seller?.name,
        items_count: group.items.length,
        total_amount: group.total,
        items: group.items.map((item: any) => ({
          book_id: item.book_id,
          title: item.title,
          price: item.price,
        })),
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        payment: paymentResult.data,
        cart_summary: {
          total_items: items.length,
          total_amount: totalAmount,
          seller_count: sellerCount,
          sellers: sellerBreakdown,
        },
        message: "Payment initialized for multi-seller cart purchase",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Process multi-seller purchase error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to process multi-seller purchase",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
