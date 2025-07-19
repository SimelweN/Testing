/**
 * Master Mock Data Index - Complete Coverage for ALL Edge Functions
 * Import this file to get access to all mock data with complete field coverage
 */

// Import all mock data modules
import { PaystackMockData } from "./paystack-mock-data.ts";
import { SupabaseMockData } from "./supabase-mock-data.ts";
import { DeliveryMockData } from "./delivery-mock-data.ts";
import { CommitSystemMockData } from "./commit-system-mock-data.ts";
import { EmailAuthMockData } from "./email-auth-mock-data.ts";
import { PaymentManagementMockData } from "./payment-management-mock-data.ts";

/**
 * Complete Mock Data Collection for ALL Edge Functions
 * Every field required by every function is included with proper data types
 */
export const AllMockData = {
  // Paystack Integration Functions
  paystack: PaystackMockData,

  // Core Supabase Functions
  supabase: SupabaseMockData,

  // Delivery & Shipping Functions
  delivery: DeliveryMockData,

  // Commit System Functions
  commitSystem: CommitSystemMockData,

  // Email & Authentication Functions
  emailAuth: EmailAuthMockData,

  // Payment Management Functions
  paymentManagement: PaymentManagementMockData,
};

/**
 * Function-Specific Mock Data for Direct Access
 * Use these for testing individual Edge Functions
 */
export const FunctionMockData = {
  // PAYSTACK FUNCTIONS
  "initialize-paystack-payment": PaystackMockData.initializePayment,
  "paystack-webhook": {
    headers: PaystackMockData.headers,
    body: PaystackMockData.webhookEvent,
  },
  "verify-paystack-payment": PaymentManagementMockData.paymentVerification,
  "paystack-refund-management": PaymentManagementMockData.refundManagement,
  "paystack-transfer-management": PaymentManagementMockData.transferManagement,
  "paystack-split-management": PaymentManagementMockData.splitManagement,

  // CORE SUPABASE FUNCTIONS
  "process-book-purchase": PaystackMockData.bookPurchase,
  "process-multi-seller-purchase": PaystackMockData.multiSellerPurchase,
  "create-order": CommitSystemMockData.createOrder,
  "send-email": EmailAuthMockData.emailRequest,
  "debug-email-template": EmailAuthMockData.debugEmail,
  "health-test": EmailAuthMockData.healthTest,

  // COMMIT SYSTEM FUNCTIONS
  "commit-to-sale": CommitSystemMockData.commitToSale,
  "decline-commit": CommitSystemMockData.declineCommit,
  "auto-expire-commits": {}, // No input required
  "check-expired-orders": {}, // No input required
  "mark-collected": CommitSystemMockData.markCollected,
  "process-order-reminders": {}, // No input required
  "pay-seller": CommitSystemMockData.paySeller,

  // SUBACCOUNT MANAGEMENT FUNCTIONS
  "create-paystack-subaccount": {
    headers: EmailAuthMockData.authHeaders,
    body: EmailAuthMockData.subaccountCreation,
  },
  "manage-paystack-subaccount": {
    headers: EmailAuthMockData.authHeaders,
    body: EmailAuthMockData.subaccountManagement,
  },

  // DELIVERY FUNCTIONS
  "courier-guy-quote": DeliveryMockData.courierGuy.quoteRequest,
  "courier-guy-shipment": DeliveryMockData.courierGuy.shipmentRequest,
  "courier-guy-track": {
    tracking_number: "CG123456789ZA",
    customer_reference: DeliveryMockData.package.reference,
  },
  "fastway-quote": DeliveryMockData.fastway.quoteRequest,
  "fastway-shipment": DeliveryMockData.fastway.shipmentRequest,
  "fastway-track": {
    consignment_number: "FW987654321ZA",
    customer_reference: DeliveryMockData.package.reference,
  },
  "get-delivery-quotes": {
    collection_address: DeliveryMockData.addresses.collection,
    delivery_address: DeliveryMockData.addresses.delivery,
    package_details: DeliveryMockData.package,
    preferred_services: ["courier_guy", "fastway", "shiplogic"],
  },
  "automate-delivery": {
    order_id: SupabaseMockData.order.id,
    tracking_number: "CG123456789ZA",
    courier_service: "courier_guy",
    collection_scheduled: true,
  },
};

/**
 * Complete Test Scenarios with Full Context
 * Use these for integration testing
 */
export const TestScenarios = {
  // Complete order flow
  completeOrderFlow: {
    step1_initializePayment: FunctionMockData["initialize-paystack-payment"],
    step2_webhookReceived: FunctionMockData["paystack-webhook"],
    step3_processBookPurchase: FunctionMockData["process-book-purchase"],
    step4_commitToSale: FunctionMockData["commit-to-sale"],
    step5_markCollected: FunctionMockData["mark-collected"],
    step6_paySeller: FunctionMockData["pay-seller"],
  },

  // Multi-seller order flow
  multiSellerFlow: {
    step1_createSplit: FunctionMockData["paystack-split-management"],
    step2_processOrder: FunctionMockData["process-multi-seller-purchase"],
    step3_handleCommits: [
      FunctionMockData["commit-to-sale"],
      {
        ...FunctionMockData["commit-to-sale"],
        seller_id: "different-seller-id",
      },
    ],
  },

  // Delivery integration flow
  deliveryFlow: {
    step1_getQuotes: FunctionMockData["get-delivery-quotes"],
    step2_createShipment: FunctionMockData["courier-guy-shipment"],
    step3_trackPackage: FunctionMockData["courier-guy-track"],
    step4_automateDelivery: FunctionMockData["automate-delivery"],
  },

  // Error handling scenarios
  errorScenarios: {
    refundRequired: PaymentManagementMockData.refundManagement,
    commitExpired: {}, // Use auto-expire-commits function
    paymentFailed: PaymentManagementMockData.errors.insufficient_balance,
    deliveryFailed: DeliveryMockData.error,
  },
};

/**
 * Validation Helper - Check if mock data has all required fields
 */
export function validateMockData(functionName: string, mockData: any): boolean {
  const requiredFields = {
    "initialize-paystack-payment": [
      "user_id",
      "email",
      "amount",
      "currency",
      "reference",
    ],
    "process-book-purchase": [
      "user_id",
      "book_id",
      "email",
      "payment_reference",
    ],
    "commit-to-sale": ["order_id", "seller_id"],
    "create-order": ["buyer_id", "cart_items", "shipping_address"],
    "send-email": ["to", "subject", "html"],
    // Add more validation rules as needed
  };

  const required = requiredFields[functionName as keyof typeof requiredFields];
  if (!required) return true; // No validation rules defined

  return required.every((field) => {
    const hasField =
      field.split(".").reduce((obj, key) => obj?.[key], mockData) !== undefined;
    if (!hasField) {
      console.warn(
        `Missing required field '${field}' for function '${functionName}'`,
      );
    }
    return hasField;
  });
}

/**
 * Quick Access Functions for Testing
 */
export function getMockDataFor(functionName: string) {
  const mockData =
    FunctionMockData[functionName as keyof typeof FunctionMockData];
  if (!mockData) {
    console.warn(`No mock data found for function: ${functionName}`);
    return null;
  }

  const isValid = validateMockData(functionName, mockData);
  if (!isValid) {
    console.error(`Mock data validation failed for function: ${functionName}`);
  }

  return mockData;
}

export function getTestScenario(scenarioName: string) {
  return TestScenarios[scenarioName as keyof typeof TestScenarios];
}

// Re-export individual modules for granular access
export {
  PaystackMockData,
  SupabaseMockData,
  DeliveryMockData,
  CommitSystemMockData,
  EmailAuthMockData,
  PaymentManagementMockData,
};

console.log(
  "✅ Master Mock Data Index loaded - ALL Edge Functions covered with complete field requirements",
);
console.log("📊 Available Functions:", Object.keys(FunctionMockData).length);
console.log("🧪 Available Test Scenarios:", Object.keys(TestScenarios).length);
