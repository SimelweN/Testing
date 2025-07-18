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
    const {
      user_id,
      book_id,
      email,
      shipping_address,
      payment_reference,
      total_amount,
      delivery_details,
    } = await req.json();

    if (!user_id || !book_id || !email || !payment_reference) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Missing required fields: user_id, book_id, email, payment_reference",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get book details
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select(
        `
        *,
                        seller:profiles!books_seller_id_fkey(id, name, email, subaccount_code)
      `,
      )
      .eq("id", book_id)
      .eq("sold", false)
      .single();

    if (bookError || !book) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Book not found or already sold",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check if buyer is trying to buy their own book
    if (book.seller_id === user_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Cannot purchase your own book",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Prepare item for payment processing
    const items = [
      {
        book_id: book.id,
        seller_id: book.seller_id,
        title: book.title,
        price: book.price,
        image_url: book.image_url,
      },
    ];

    // Initialize payment with Paystack
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
          total_amount: book.price,
          shipping_address,
          email,
          metadata: {
            purchase_type: "single_book",
            book_id,
          },
        }),
      },
    );

    const paymentResult = await paymentResponse.json();

    if (!paymentResult.success) {
      throw new Error(`Payment initialization failed: ${paymentResult.error}`);
    }

    // Temporarily reserve the book (prevents multiple purchases)
    await supabase
      .from("books")
      .update({
        reserved_until: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        reserved_by: user_id,
      })
      .eq("id", book_id);

    return new Response(
      JSON.stringify({
        success: true,
        payment: paymentResult.data,
        book: {
          id: book.id,
          title: book.title,
          price: book.price,
          seller_name: book.seller.name,
        },
        message: "Payment initialized for single book purchase",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Process book purchase error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to process book purchase",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
