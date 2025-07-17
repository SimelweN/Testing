import { supabase } from "../lib/supabase";

export async function testAllNewEmailTemplates(email: string) {
  console.log("Testing ALL updated email templates...");

  const tests = [
    {
      name: "Welcome Template",
      template: "welcome",
      data: {
        userName: "Test User",
        loginUrl: "https://app.rebookedsolutions.co.za/login",
      },
    },
    {
      name: "Order Confirmation Template",
      template: "order-confirmation",
      data: {
        orderNumber: "NEW_TEST_123456",
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
      name: "Password Reset Template",
      template: "password-reset",
      data: {
        userName: "Test User",
        resetUrl: "https://app.rebookedsolutions.co.za/reset?token=test123",
        expiryTime: "1 hour",
      },
    },
    {
      name: "Shipping Notification Template",
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
      name: "Seller New Order Template",
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
      name: "Buyer Order Pending Template",
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
  ];

  const results = [];

  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);

      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: email,
          subject: `✅ NEW TEMPLATES - ${test.name} Test`,
          template: {
            name: test.template,
            data: test.data,
          },
        },
      });

      if (error) {
        console.error(`${test.name} failed:`, error);
        results.push({ test: test.name, success: false, error });
      } else {
        console.log(`${test.name} sent successfully:`, data);
        results.push({ test: test.name, success: true, data });
      }

      // Wait 1 second between emails to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`${test.name} error:`, error);
      results.push({ test: test.name, success: false, error });
    }
  }

  console.log("All template tests completed:", results);
  return results;
}

export async function testSpecificTemplate(
  email: string,
  templateName: string,
  templateData: any,
) {
  console.log(`Testing specific template: ${templateName}`);

  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: email,
        subject: `🎯 UPDATED TEMPLATE TEST - ${templateName}`,
        template: {
          name: templateName,
          data: templateData,
        },
      },
    });

    if (error) {
      console.error(`Template ${templateName} failed:`, error);
      return { success: false, error };
    }

    console.log(`Template ${templateName} sent successfully:`, data);
    return { success: true, data };
  } catch (error) {
    console.error(`Template ${templateName} error:`, error);
    return { success: false, error };
  }
}
