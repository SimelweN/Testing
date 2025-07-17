import { supabase } from "../lib/supabase";

export async function testAllCompletelyRewrittenTemplates(email: string) {
  console.log("🚀 TESTING ALL COMPLETELY REWRITTEN TEMPLATES...");

  const tests = [
    {
      name: "1. ORDER CONFIRMATION",
      template: "order-confirmation",
      data: {
        orderNumber: "FINAL_TEST_123456",
        customerName: "Test Customer",
        items: [
          { name: "Physics Textbook", quantity: 1, price: 250 },
          { name: "Math Workbook", quantity: 2, price: 150 },
        ],
        total: "550.00",
        estimatedDelivery: "2-3 business days",
      },
    },
    {
      name: "2. WELCOME",
      template: "welcome",
      data: {
        userName: "Test User",
        loginUrl: "https://app.rebookedsolutions.co.za/login",
      },
    },
    {
      name: "3. SHIPPING NOTIFICATION",
      template: "shipping-notification",
      data: {
        customerName: "Test Customer",
        orderNumber: "SHIP_123456",
        trackingNumber: "TRK789012",
        carrier: "Courier Guy",
        estimatedDelivery: "2024-01-20",
      },
    },
    {
      name: "4. SELLER NEW ORDER",
      template: "seller-new-order",
      data: {
        sellerName: "Test Seller",
        buyerName: "Test Buyer",
        orderId: "SELLER_123456",
        items: [{ name: "Chemistry Textbook", quantity: 1, price: 300 }],
        totalAmount: "300.00",
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        commitUrl: "https://app.rebookedsolutions.co.za/activity",
      },
    },
    {
      name: "5. BUYER ORDER PENDING",
      template: "buyer-order-pending",
      data: {
        buyerName: "Test Buyer",
        sellerName: "Test Seller",
        orderId: "BUYER_123456",
        items: [{ name: "Biology Textbook", quantity: 1, price: 400 }],
        totalAmount: "400.00",
        statusUrl: "https://app.rebookedsolutions.co.za/orders/BUYER_123456",
      },
    },
    {
      name: "6. ORDER COMMITTED BUYER",
      template: "order-committed-buyer",
      data: {
        buyer_name: "Test Buyer",
        order_id: "COMMIT_123456",
        seller_name: "Test Seller",
        book_titles: "Physics & Math Textbooks",
        estimated_delivery: "2-3 business days",
      },
    },
    {
      name: "7. ORDER COMMITTED SELLER",
      template: "order-committed-seller",
      data: {
        seller_name: "Test Seller",
        order_id: "COMMIT_123456",
        buyer_name: "Test Buyer",
        book_titles: "Physics & Math Textbooks",
        pickup_instructions:
          "A courier will contact you within 24 hours to arrange pickup",
      },
    },
    {
      name: "8. SELLER PICKUP NOTIFICATION",
      template: "seller-pickup-notification",
      data: {
        sellerName: "Test Seller",
        bookTitle: "Advanced Physics",
        orderId: "PICKUP_123456",
        pickupDate: "2024-01-20",
        pickupTimeWindow: "9:00 AM - 5:00 PM",
        courierProvider: "courier-guy",
        trackingNumber: "CG123456789",
        shippingLabelUrl: "https://example.com/label.pdf",
        pickupAddress: {
          streetAddress: "123 Main Street",
          city: "Cape Town",
          province: "Western Cape",
        },
      },
    },
    {
      name: "9. BUYER ORDER CONFIRMED",
      template: "buyer-order-confirmed",
      data: {
        buyerName: "Test Buyer",
        bookTitle: "Advanced Physics",
        orderId: "CONFIRMED_123456",
        sellerName: "Test Seller",
        expectedDelivery: "2-3 business days",
      },
    },
    {
      name: "10. COMMIT CONFIRMATION BASIC",
      template: "commit-confirmation-basic",
      data: {
        sellerName: "Test Seller",
        bookTitle: "Advanced Physics",
        orderId: "BASIC_123456",
        buyerEmail: "buyer@example.com",
      },
    },
  ];

  const results = [];

  for (const test of tests) {
    try {
      console.log(`🎯 Testing ${test.name}...`);

      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: email,
          subject: `🎨 NEW STYLE ${test.name} - Final Test`,
          template: {
            name: test.template,
            data: test.data,
          },
        },
      });

      if (error) {
        console.error(`❌ ${test.name} failed:`, error);
        results.push({ test: test.name, success: false, error });
      } else {
        console.log(`✅ ${test.name} sent successfully!`);
        results.push({ test: test.name, success: true, data });
      }

      // Wait 1 second between emails
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ ${test.name} error:`, error);
      results.push({ test: test.name, success: false, error });
    }
  }

  console.log("🎉 ALL TEMPLATE TESTS COMPLETED:", results);
  return results;
}
