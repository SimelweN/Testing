import {
  handleCORS,
  createSupabaseClient,
  validateFields,
  logEvent,
  parseRequestBody,
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
    const { reference } = body;

    validateFields(body, ["reference"]);

    logEvent("payment_verification_started", { reference });

    // Verify payment with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      },
    );

    const paystackResult = await paystackResponse.json();

    if (!paystackResult.status) {
      throw new Error(
        `Paystack verification failed: ${paystackResult.message}`,
      );
    }

    const transaction = paystackResult.data;
    const supabase = createSupabaseClient();

    // Update transaction status
    const { error: updateError } = await supabase
      .from("payment_transactions")
      .update({
        status: transaction.status,
        paystack_response: transaction,
        verified_at: new Date().toISOString(),
      })
      .eq("reference", reference);

    if (updateError) {
      logEvent("transaction_update_failed", { reference, error: updateError });
    }

    // If payment is successful, create orders
    if (transaction.status === "success") {
      const metadata = transaction.metadata;

      // Call create-order function to process the successful payment
      try {
        const orderResponse = await fetch(
          `${req.headers.host}/api/create-order`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: metadata.user_id,
              items: metadata.items,
              total_amount: transaction.amount / 100, // Convert from kobo
              shipping_address: metadata.shipping_address,
              payment_reference: reference,
              payment_data: transaction,
            }),
          },
        );

        const orderResult = await orderResponse.json();

        if (!orderResult.success) {
          logEvent("order_creation_failed", {
            reference,
            error: orderResult.error,
          });
        } else {
          logEvent("payment_verified_orders_created", {
            reference,
            orders_count: orderResult.orders?.length || 0,
          });
        }

        return res.status(200).json({
          success: true,
          data: {
            transaction,
            orders: orderResult.orders || [],
            verified: true,
            status: "success",
          },
        });
      } catch (orderError) {
        logEvent("order_creation_error", {
          reference,
          error: orderError.message,
        });

        // Still return success for payment verification
        return res.status(200).json({
          success: true,
          data: {
            transaction,
            orders: [],
            verified: true,
            status: "success",
            order_creation_error: orderError.message,
          },
        });
      }
    }

    // Payment not successful
    logEvent("payment_verification_failed", {
      reference,
      status: transaction.status,
    });

    return res.status(400).json({
      success: false,
      data: {
        transaction,
        verified: true,
        status: transaction.status,
      },
      error: "Payment was not successful",
    });
  } catch (error) {
    logEvent("payment_verification_error", { error: error.message });

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to verify payment",
    });
  }
}
