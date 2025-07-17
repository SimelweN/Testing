import { supabase } from "../lib/supabase";

export async function testShippingNotificationEmail(email: string) {
  console.log(
    "Testing shipping notification email with ReBooked Solutions styling...",
  );

  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: email,
        subject: "Your Order Has Shipped - ReBooked Solutions",
        template: {
          name: "shipping-notification",
          data: {
            customerName: "Test Customer",
            orderNumber: "SHIP_123456",
            trackingNumber: "TRK789012",
            carrier: "Courier Guy",
            estimatedDelivery: "2024-01-20",
          },
        },
      },
    });

    if (error) {
      console.error("Shipping notification test failed:", error);
      throw error;
    }

    console.log("Shipping notification email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Test shipping notification error:", error);
    return { success: false, error };
  }
}
