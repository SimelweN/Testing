import {
  handleCORS,
  createSupabaseClient,
  validateFields,
  logEvent,
  parseRequestBody,
  errorResponse,
  successResponse,
} from "./_lib/utils.js";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

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
    const {
      user_id,
      items,
      total_amount,
      shipping_address,
      email,
      metadata = {},
    } = body;

    validateFields(body, ["user_id", "items", "total_amount", "email"]);

    logEvent("payment_initialization_started", {
      user_id,
      total_amount,
      items_count: items.length,
    });

    const supabase = createSupabaseClient();

    // Get seller information for split payments
    const sellerIds = [...new Set(items.map((item) => item.seller_id))];
    const { data: sellers, error: sellersError } = await supabase
      .from("profiles")
      .select("id, subaccount_code, name")
      .in("id", sellerIds);

    if (sellersError) {
      throw new Error(`Failed to fetch sellers: ${sellersError.message}`);
    }

    // Calculate split payments
    const splitPayments = sellers
      ?.map((seller) => {
        const sellerItems = items.filter(
          (item) => item.seller_id === seller.id,
        );
        const sellerTotal = sellerItems.reduce(
          (sum, item) => sum + item.price,
          0,
        );

        return {
          subaccount: seller.subaccount_code,
          share: sellerTotal * 100, // Convert to kobo
        };
      })
      .filter((split) => split.subaccount);

    // Initialize Paystack payment
    const paystackData = {
      email,
      amount: total_amount * 100, // Convert to kobo
      currency: "ZAR",
      callback_url: `${req.headers.origin}/payment/callback`,
      metadata: {
        user_id,
        items,
        shipping_address,
        ...metadata,
      },
      subaccount: splitPayments[0]?.subaccount, // Primary seller for single seller
    };

    // If multiple sellers, use split payment
    if (splitPayments.length > 1) {
      paystackData.split = {
        type: "percentage",
        currency: "ZAR",
        subaccounts: splitPayments,
        bearer_type: "account",
        bearer_subaccount: splitPayments[0].subaccount,
      };
    }

    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paystackData),
      },
    );

    const paystackResult = await paystackResponse.json();

    if (!paystackResult.status) {
      throw new Error(`Paystack error: ${paystackResult.message}`);
    }

    // Store transaction reference in database
    const { error: insertError } = await supabase
      .from("payment_transactions")
      .insert({
        reference: paystackResult.data.reference,
        user_id,
        amount: total_amount,
        status: "pending",
        items,
        shipping_address,
        paystack_data: paystackResult.data,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      logEvent("transaction_storage_failed", {
        reference: paystackResult.data.reference,
        error: insertError,
      });
    }

    logEvent("payment_initialized", {
      reference: paystackResult.data.reference,
      amount: total_amount,
      sellers_count: splitPayments.length,
    });

    return res.status(200).json({
      success: true,
      data: {
        authorization_url: paystackResult.data.authorization_url,
        reference: paystackResult.data.reference,
        access_code: paystackResult.data.access_code,
      },
    });
  } catch (error) {
    logEvent("payment_initialization_error", { error: error.message });

    let statusCode = 500;
    if (error.message.includes("Missing required fields")) {
      statusCode = 400;
    }

    return res.status(statusCode).json({
      success: false,
      error: error.message || "Failed to initialize payment",
    });
  }
}
