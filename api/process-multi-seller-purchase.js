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
    const { user_id, cart_items, shipping_address, email } = body;

    validateFields(body, ["user_id", "cart_items", "email"]);

    if (!Array.isArray(cart_items) || cart_items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "cart_items must be a non-empty array",
      });
    }

    logEvent("multi_seller_purchase_started", {
      user_id,
      items_count: cart_items.length,
    });

    const supabase = createSupabaseClient();

    // Get all book details and validate availability
    const bookIds = cart_items.map((item) => item.book_id);
    const { data: books, error: booksError } = await supabase
      .from("books")
      .select(
        `
        *,
        seller:profiles!books_seller_id_fkey(id, name, email, subaccount_code)
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

      return res.status(400).json({
        success: false,
        error: "Some books are no longer available",
        unavailable_books: unavailable,
      });
    }

    // Check if buyer is trying to buy their own books
    const ownBooks = books.filter((book) => book.seller_id === user_id);
    if (ownBooks.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Cannot purchase your own books",
        own_books: ownBooks.map((b) => ({ id: b.id, title: b.title })),
      });
    }

    // Prepare items for payment processing
    const items = books.map((book) => {
      const cartItem = cart_items.find((item) => item.book_id === book.id);
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
    const sellerGroups = items.reduce((acc, item) => {
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
      `${req.headers.host}/api/initialize-paystack-payment`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    const sellerBreakdown = Object.values(sellerGroups).map((group) => {
      const seller = books.find((b) => b.seller_id === group.seller_id)?.seller;
      return {
        seller_id: group.seller_id,
        seller_name: seller?.name,
        items_count: group.items.length,
        total_amount: group.total,
        items: group.items.map((item) => ({
          book_id: item.book_id,
          title: item.title,
          price: item.price,
        })),
      };
    });

    logEvent("multi_seller_purchase_payment_initialized", {
      user_id,
      total_amount: totalAmount,
      seller_count: sellerCount,
      reference: paymentResult.data.reference,
    });

    return res.status(200).json({
      success: true,
      payment: paymentResult.data,
      cart_summary: {
        total_items: items.length,
        total_amount: totalAmount,
        seller_count: sellerCount,
        sellers: sellerBreakdown,
      },
      message: "Payment initialized for multi-seller cart purchase",
    });
  } catch (error) {
    logEvent("multi_seller_purchase_error", { error: error.message });

    let statusCode = 500;
    if (error.message.includes("Missing required fields")) {
      statusCode = 400;
    } else if (
      error.message.includes("not found") ||
      error.message.includes("no longer available")
    ) {
      statusCode = 400;
    }

    return res.status(statusCode).json({
      success: false,
      error: error.message || "Failed to process multi-seller purchase",
    });
  }
}
