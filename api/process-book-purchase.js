import {
  handleCORS,
  createSupabaseClient,
  validateFields,
  logEvent,
  parseRequestBody,
} from "./_lib/utils.js";

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
    const body = await parseRequestBody(req);
    const { user_id, book_id, shipping_address, email } = body;

    validateFields(body, ["user_id", "book_id", "email"]);

    logEvent("book_purchase_started", { user_id, book_id });

    const supabase = createSupabaseClient();

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
      return res.status(404).json({
        success: false,
        error: "Book not found or already sold",
      });
    }

    // Check if buyer is trying to buy their own book
    if (book.seller_id === user_id) {
      return res.status(400).json({
        success: false,
        error: "Cannot purchase your own book",
      });
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
      `${req.headers.host}/api/initialize-paystack-payment`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

    logEvent("book_purchase_payment_initialized", {
      user_id,
      book_id,
      amount: book.price,
      reference: paymentResult.data.reference,
    });

    return res.status(200).json({
      success: true,
      payment: paymentResult.data,
      book: {
        id: book.id,
        title: book.title,
        price: book.price,
        seller_name: book.seller.name,
      },
      message: "Payment initialized for single book purchase",
    });
  } catch (error) {
    logEvent("book_purchase_error", { error: error.message });

    let statusCode = 500;
    if (error.message.includes("Missing required fields")) {
      statusCode = 400;
    } else if (error.message.includes("not found")) {
      statusCode = 404;
    }

    return res.status(statusCode).json({
      success: false,
      error: error.message || "Failed to process book purchase",
    });
  }
}
