import { supabase } from "./src/integrations/supabase/client.js";

async function testRefundTables() {
  console.log("Testing refund_transactions table...");

  try {
    // Test refund_transactions table
    const { data: refundData, error: refundError } = await supabase
      .from("refund_transactions")
      .select("count")
      .limit(1);

    console.log("refund_transactions result:", { refundData, refundError });

    // Test orders table with refund columns
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("payment_reference, refund_status, refunded_at")
      .limit(1);

    console.log("orders refund columns result:", { orderData, orderError });

    // Test payment_transactions table
    const { data: paymentData, error: paymentError } = await supabase
      .from("payment_transactions")
      .select("count")
      .limit(1);

    console.log("payment_transactions result:", { paymentData, paymentError });
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testRefundTables();
