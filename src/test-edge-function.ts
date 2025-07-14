import { supabase } from "@/lib/supabase";

export async function testEdgeFunction() {
  console.log("Testing Edge Function...");

  try {
    const { data, error } = await supabase.functions.invoke(
      "create-paystack-subaccount",
      {
        body: {
          userId: "test-user-123",
          businessName: "Test Business",
          bankCode: "632005",
          accountNumber: "1234567890",
          primaryContactEmail: "test@example.com",
          primaryContactName: "Test User",
          percentageCharge: 10,
        },
      },
    );

    console.log("Edge Function Response:", { data, error });

    if (error) {
      console.error("Error details:", {
        message: error.message,
        context: error.context,
        details: error.details,
      });
    }

    return { data, error };
  } catch (err) {
    console.error("Caught error:", err);
    return { error: err };
  }
}

// Call the test function
testEdgeFunction();
