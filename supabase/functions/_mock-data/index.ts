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
 * ALL FUNCTIONS HAVE COMPLETE MOCK DATA WITH ALL REQUIRED FIELDS
 */
export const FunctionMockData = {
  // PAYSTACK FUNCTIONS
  "initialize-paystack-payment": {
    user_id: "550e8400-e29b-41d4-a716-446655440000",
    items: [
      {
        book_id: "550e8400-e29b-41d4-a716-446655440001",
        title: "Introduction to Computer Science",
        price: 29999, // in kobo
        quantity: 1,
        seller_id: "550e8400-e29b-41d4-a716-446655440002"
      }
    ],
    total_amount: 34999, // in kobo (includes delivery)
    email: "buyer@example.com",
    currency: "ZAR",
    callback_url: "https://rebook.university/payment/callback",
    metadata: {
      user_id: "550e8400-e29b-41d4-a716-446655440000",
      order_type: "book_purchase",
      platform: "rebook"
    }
  },

  "paystack-webhook": {
    event: "charge.success.test",
    data: {
      id: 123456789,
      reference: "test_ref_" + Date.now(),
      amount: 34999,
      currency: "ZAR",
      status: "success",
      customer: {
        email: "buyer@example.com",
        first_name: "John",
        last_name: "Buyer"
      },
      metadata: {
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        order_type: "book_purchase"
      },
      created_at: new Date().toISOString()
    }
  },

  "verify-paystack-payment": {
    reference: "bk_" + Date.now() + "_test_use"
  },

  "paystack-refund-management": {
    action: "initiate",
    transaction_reference: "TXN_" + Date.now(),
    amount: 29999,
    reason: "Order cancelled by seller",
    user_id: "550e8400-e29b-41d4-a716-446655440000"
  },

  // "paystack-transfer-management": removed - no automated transfers

  "paystack-split-management": {
    action: "create",
    name: "Multi-seller Book Order Split",
    type: "percentage",
    currency: "ZAR",
    subaccounts: [
      {
        subaccount: "ACCT_123456789",
        share: 70
      },
      {
        subaccount: "ACCT_987654321",
        share: 30
      }
    ],
    bearer_type: "all",
    bearer_subaccount: "ACCT_123456789"
  },

  // "paystack-transfer-management": removed - no automated transfers

  "manage-paystack-subaccount": {
    action: "update",
    subaccount_code: "ACCT_test_123",
    business_name: "Test Business Updated",
    settlement_bank: "058",
    account_number: "0123456789",
    percentage_charge: 2.5,
    active: true
  },

  // CORE SUPABASE FUNCTIONS
  "process-book-purchase": {
    book_id: "book_test_123",
    buyer_id: "USR_test_buyer_456",
    seller_id: "USR_test_seller_789",
    amount: 34999,
    payment_reference: "test_ref_" + Date.now(),
    buyer_email: "buyer@example.com",
    shipping_address: {
      street: "123 Student Road",
      suburb: "Rondebosch",
      city: "Cape Town",
      province: "Western Cape",
      postal_code: "7700",
      country: "South Africa",
      phone: "+27123456789",
      first_name: "John",
      last_name: "Buyer"
    }
  },

    "process-multi-seller-purchase": {
    user_id: "USR_test_buyer_multi", // REQUIRED: validated by function
    email: "buyer@example.com", // REQUIRED: validated by function with email format check
    cart_items: [ // REQUIRED: must be array and not empty
      {
        book_id: "book_test_multi_1",
        title: "Introduction to Computer Science",
        price: 29999,
        quantity: 1,
        seller_id: "USR_test_seller_1"
      },
      {
        book_id: "book_test_multi_2",
        title: "Mathematics for Engineers",
        price: 24999,
        quantity: 1,
        seller_id: "USR_test_seller_2"
      }
    ],
    shipping_address: {
      street: "123 Student Road",
      suburb: "Rondebosch",
      city: "Cape Town",
      province: "Western Cape",
      postal_code: "7700",
      country: "South Africa",
      phone: "+27123456789",
      first_name: "John",
      last_name: "Buyer"
    },
    payment_reference: "TXN_" + Date.now(),
    total_amount: 64998
  },

  "create-order": {
    buyer_id: "USR_test_buyer_order",
    buyer_email: "buyer@example.com",
    cart_items: [
      {
        book_id: "book_test_order_1",
        title: "Introduction to Computer Science",
        author: "Jane Smith",
        price: 29999,
        seller_id: "USR_test_seller_order",
        condition: "good",
        isbn: "9781234567890"
      }
    ],
    shipping_address: {
      street: "123 Student Road",
      suburb: "Rondebosch",
      city: "Cape Town",
      province: "Western Cape",
      postal_code: "7700",
      country: "South Africa",
      phone: "+27123456789",
      first_name: "John",
      last_name: "Buyer"
    },
    payment_reference: "TXN_" + Date.now(),
    total_amount: 34999
  },

    "send-email": {
    to: "recipient@example.com", // REQUIRED: validated by validateEmailRequest
    subject: "Test Email from Rebook", // REQUIRED: validated by validateEmailRequest
    html: "<h1>Welcome to Rebook!</h1><p>This is a test email.</p>", // REQUIRED: either html, text, or template must be provided
    text: "Welcome to Rebook! This is a test email.", // Optional: backup text version
    from: "noreply@rebook.university", // Optional: validated if provided
    replyTo: "support@rebook.university", // Optional: validated if provided
    template_data: {
      user_name: "John Doe",
      platform_name: "Rebook"
    },
    test: false // Optional: for testing connection
  },

  "debug-email-template": {
    templateName: "welcome_email",
    template: "<h1>Welcome {{user_name}}</h1>",
    data: {
      user_name: "John Doe",
      platform_name: "Rebook"
    }
  },

  "health-test": {
    test_type: "full",
    include_database: true,
    include_email: true,
    include_paystack: true
  },

  // COMMIT SYSTEM FUNCTIONS
  "commit-to-sale": {
    order_id: "ORD_test_456",
    seller_id: "USR_test_seller_123",
    commit_notes: "Ready to ship immediately",
    estimated_ship_date: "2024-12-25T00:00:00.000Z"
  },

  "decline-commit": {
    order_id: "ORD_test_decline",
    seller_id: "USR_test_seller_456",
    reason: "book_not_available",
    notes: "Book was damaged and cannot be sold"
  },

  "auto-expire-commits": {}, // No input required
  "check-expired-orders": {}, // No input required

  "mark-collected": {
    order_id: "ORD_collected_test",
    tracking_number: "TRK_test_123456789",
    collection_date: new Date().toISOString(),
    collected_by: "courier",
    courier_service: "courier_guy"
  },

  "process-order-reminders": {}, // No input required

  // "pay-seller": removed - no automated seller payments

  // SUBACCOUNT MANAGEMENT FUNCTIONS
    "create-paystack-subaccount": {
    business_name: "John's Textbook Store",
    email: "seller@example.com", // REQUIRED: validated by function
    bank_name: "Standard Bank", // REQUIRED: function validates this
    bank_code: "058", // REQUIRED: 3-digit bank code (Standard Bank)
    account_number: "0123456789", // REQUIRED: 8-12 digit account number
    percentage_charge: 2.5,
    user_id: "USR_test_subaccount_seller", // REQUIRED: user ID
    description: "Subaccount for seller payouts",
    primary_contact_email: "seller@example.com",
    primary_contact_name: "John Seller",
    primary_contact_phone: "+27123456789",
    is_update: false, // Optional boolean field
    metadata: {
      user_id: "USR_test_subaccount_seller",
      verification_status: "pending"
    }
  },

    "manage-paystack-subaccount": {
    action: "update",
    subaccount_code: "ACCT_123456789",
    business_name: "John's Updated Textbook Store", // REQUIRED: validated by function
    settlement_bank: "058", // REQUIRED: validated by function
    account_number: "0123456789", // REQUIRED: validated by function
    percentage_charge: 2.0,
    active: true
  },

  // DELIVERY FUNCTIONS - COMPLETE WITH ALL REQUIRED FIELDS
  "courier-guy-quote": {
    fromAddress: {
      streetAddress: "123 Seller Street",
      suburb: "Gardens",
      city: "Cape Town",
      province: "Western Cape",
      postalCode: "8001"
    },
    toAddress: {
      streetAddress: "456 Buyer Avenue",
      suburb: "Rondebosch",
      city: "Cape Town",
      province: "Western Cape",
      postalCode: "7700"
    },
    weight: 1.2,
    dimensions: {
      length: 25,
      width: 20,
      height: 3
    },
    service_type: "overnight",
    collection_date: "2024-12-25"
  },

  "courier-guy-shipment": {
    order_id: "order-550e8400-e29b-41d4-a716-446655440002",
    pickup_address: {
      name: "John Seller",
      street: "123 Seller Street",
      suburb: "Gardens",
      city: "Cape Town",
      province: "Western Cape",
      postal_code: "8001",
      phone: "+27123456789",
      email: "seller@example.com"
    },
    delivery_address: {
      name: "Jane Buyer",
      street: "456 Buyer Avenue",
      suburb: "Rondebosch",
      city: "Cape Town",
      province: "Western Cape",
      postal_code: "7700",
      phone: "+27987654321",
      email: "buyer@example.com"
    },
    package_details: {
      weight: 1.2,
      dimensions: { length: 25, width: 20, height: 3 },
      description: "Computer Science Textbook",
      value: 299.99
    },
    service_type: "overnight",
    collection_date: "2024-12-25"
  },

  "courier-guy-track": {
    tracking_number: "CG123456789ZA",
    customer_reference: "BOOK_SHIP_" + Date.now()
  },

  "fastway-quote": {
    fromAddress: {
      streetAddress: "123 Seller Street",
      suburb: "Gardens",
      city: "Cape Town",
      province: "Western Cape",
      postalCode: "8001"
    },
    toAddress: {
      streetAddress: "456 Buyer Avenue",
      suburb: "Rondebosch",
      city: "Cape Town",
      province: "Western Cape",
      postalCode: "7700"
    },
    weight: 1.2,
    dimensions: {
      length: 25,
      width: 20,
      height: 3
    }
  },

  "fastway-shipment": {
    order_id: "order-550e8400-e29b-41d4-a716-446655440002",
    pickup_address: {
      name: "John Seller",
      street: "123 Seller Street",
      suburb: "Gardens",
      city: "Cape Town",
      province: "Western Cape",
      postal_code: "8001",
      phone: "+27123456789",
      email: "seller@example.com"
    },
    delivery_address: {
      name: "Jane Buyer",
      street: "456 Buyer Avenue",
      suburb: "Rondebosch",
      city: "Cape Town",
      province: "Western Cape",
      postal_code: "7700",
      phone: "+27987654321",
      email: "buyer@example.com"
    },
    weight: 1.2,
    dimensions: { length: 25, width: 20, height: 3 },
    reference: "BOOK_SHIP_" + Date.now()
  },

  "fastway-track": {
    consignment_number: "FW987654321ZA",
    customer_reference: "BOOK_SHIP_" + Date.now()
  },

  "get-delivery-quotes": {
    fromAddress: {
      streetAddress: "123 Seller Street",
      suburb: "Gardens",
      city: "Cape Town",
      province: "Western Cape",
      postalCode: "8001"
    },
    toAddress: {
      streetAddress: "456 Buyer Avenue",
      suburb: "Rondebosch",
      city: "Cape Town",
      province: "Western Cape",
      postalCode: "7700"
    },
    weight: 1.2,
    dimensions: {
      length: 25,
      width: 20,
      height: 3
    },
    services: ["courier_guy", "fastway", "shiplogic"]
  },

  "automate-delivery": {
    order_id: "order-550e8400-e29b-41d4-a716-446655440002",
    seller_address: {
      name: "John Seller",
      street: "123 Seller Street",
      suburb: "Gardens",
      city: "Cape Town",
      province: "Western Cape",
      postal_code: "8001",
      phone: "+27123456789",
      email: "seller@example.com"
    },
    buyer_address: {
      name: "Jane Buyer",
      street: "456 Buyer Avenue",
      suburb: "Rondebosch",
      city: "Cape Town",
      province: "Western Cape",
      postal_code: "7700",
      phone: "+27987654321",
      email: "buyer@example.com"
    },
    weight: 1.2,
    preferred_courier: "courier_guy"
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
    // step6_paySeller: removed - no automated seller payments
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
 * COMPREHENSIVE VALIDATION FOR ALL EDGE FUNCTIONS
 */
export function validateMockData(functionName: string, mockData: any): boolean {
  const requiredFields = {
    // PAYSTACK FUNCTIONS
    "initialize-paystack-payment": ["user_id", "items", "total_amount", "email"],
    "paystack-webhook": ["event", "data"],
    "verify-paystack-payment": ["reference"],
    "paystack-refund-management": ["action", "transaction_reference"],
    // "paystack-transfer-management": removed - no automated transfers
    "paystack-split-management": ["action", "name", "type"],
    "manage-paystack-subaccount": ["action", "subaccount_code"],

    // CORE SUPABASE FUNCTIONS
    "process-book-purchase": ["book_id", "buyer_id", "seller_id", "amount", "buyer_email"],
    "process-multi-seller-purchase": ["user_id", "email", "cart_items"],
    "create-order": ["buyer_id", "buyer_email", "cart_items"],
    "send-email": ["to", "subject", "html"],
    "debug-email-template": ["templateName", "template"],

    // COMMIT SYSTEM FUNCTIONS
    "commit-to-sale": ["order_id", "seller_id"],
    "decline-commit": ["order_id", "seller_id"],
    "mark-collected": ["order_id", "tracking_number"],
    // "pay-seller": removed - no automated seller payments

        // SUBACCOUNT MANAGEMENT
    "create-paystack-subaccount": ["business_name", "email", "bank_name", "bank_code", "account_number", "user_id"],
        "manage-paystack-subaccount": ["action", "subaccount_code", "business_name", "settlement_bank", "account_number"],

    // DELIVERY FUNCTIONS
    "courier-guy-quote": ["fromAddress", "toAddress", "weight"],
    "courier-guy-shipment": ["order_id", "pickup_address", "delivery_address"],
    "courier-guy-track": ["tracking_number"],
    "fastway-quote": ["fromAddress", "toAddress", "weight"],
    "fastway-shipment": ["order_id", "pickup_address", "delivery_address"],
    "fastway-track": ["consignment_number"],
    "get-delivery-quotes": ["fromAddress", "toAddress", "weight"],
    "automate-delivery": ["order_id", "seller_address", "buyer_address"],

    // ADDRESS VALIDATION FOR DELIVERY FUNCTIONS
    "address_validation": ["suburb", "province", "postalCode"],
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
