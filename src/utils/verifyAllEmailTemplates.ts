import { supabase } from "@/integrations/supabase/client";

export async function verifyAllEmailTemplates(testEmail: string) {
  console.log("🔍 Testing ALL email templates to verify styling...");

  const results: Array<{ template: string; success: boolean; error?: string }> =
    [];

  const templates = [
    {
      name: "welcome",
      data: {
        userName: "Test User",
        loginUrl: "https://rebookedsolutions.co.za/login",
      },
    },
    {
      name: "password-reset",
      data: {
        userName: "Test User",
        resetUrl:
          "https://rebookedsolutions.co.za/reset-password?token=test123",
      },
    },
    {
      name: "order-confirmation",
      data: {
        orderNumber: "ORD_TEST123",
        customerName: "Test Customer",
        items: [
          { name: "Physics Textbook", quantity: 1, price: 250 },
          { name: "Math Workbook", quantity: 1, price: 180 },
        ],
        total: "430.00",
        estimatedDelivery: "2-3 business days",
      },
    },
    {
      name: "shipping-notification",
      data: {
        customerName: "Test Customer",
        orderNumber: "SHIP_123456",
        trackingNumber: "TRK789012",
        carrier: "Courier Guy",
        estimatedDelivery: "2024-01-20",
      },
    },
    {
      name: "seller-new-order",
      data: {
        sellerName: "Test Seller",
        buyerName: "Test Buyer",
        orderId: "ORD_TEST123",
        items: [{ name: "Physics Textbook", price: 250 }],
        totalAmount: "250.00",
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        commitUrl: "https://rebookedsolutions.co.za/activity",
      },
    },
    {
      name: "buyer-order-pending",
      data: {
        buyerName: "Test Buyer",
        sellerName: "Test Seller",
        orderId: "ORD_TEST123",
        items: [{ name: "Physics Textbook", price: 250 }],
        totalAmount: "250.00",
        statusUrl: "https://rebookedsolutions.co.za/orders/test123",
      },
    },
    {
      name: "seller-pickup-notification",
      data: {
        sellerName: "Test Seller",
        bookTitle: "Physics Textbook",
        orderId: "ORD_TEST123",
        pickupDate: "2024-01-20",
        pickupTimeWindow: "9:00 AM - 5:00 PM",
        courierProvider: "courier-guy",
        trackingNumber: "CG123456789",
        shippingLabelUrl: "https://example.com/label.pdf",
        pickupAddress: {
          streetAddress: "123 Test Street",
          city: "Cape Town",
          province: "Western Cape",
        },
      },
    },
    {
      name: "buyer-order-confirmed",
      data: {
        buyerName: "Test Buyer",
        bookTitle: "Physics Textbook",
        orderId: "ORD_TEST123",
        sellerName: "Test Seller",
        expectedDelivery: "2-3 business days",
      },
    },
    {
      name: "commit-confirmation-basic",
      data: {
        sellerName: "Test Seller",
        bookTitle: "Physics Textbook",
        orderId: "ORD_TEST123",
        buyerEmail: "buyer@example.com",
      },
    },
  ];

  for (const template of templates) {
    try {
      console.log(`📧 Testing template: ${template.name}`);

      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: testEmail,
          subject: `🧪 TEST: ${template.name.toUpperCase()} Template - ReBooked Solutions`,
          template: {
            name: template.name,
            data: template.data,
          },
        },
      });

      if (error) {
        console.error(`❌ Template ${template.name} failed:`, error);
        results.push({
          template: template.name,
          success: false,
          error: error.message,
        });
      } else {
        console.log(`✅ Template ${template.name} sent successfully`);
        results.push({
          template: template.name,
          success: true,
        });
      }

      // Wait 1 second between emails to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`💥 Template ${template.name} crashed:`, error);
      results.push({
        template: template.name,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Summary
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`\n📊 EMAIL TEMPLATE TEST RESULTS:`);
  console.log(`✅ Successful: ${successful}/${templates.length}`);
  console.log(`❌ Failed: ${failed}/${templates.length}`);

  if (failed > 0) {
    console.log(`\n❌ Failed templates:`);
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.template}: ${r.error}`);
      });
  }

  return {
    success: failed === 0,
    results,
    summary: {
      total: templates.length,
      successful,
      failed,
    },
  };
}
