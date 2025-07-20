// Paystack Demo Testing Utilities
// This file contains utilities for testing Paystack functionality with demo data

export const PAYSTACK_DEMO_CONFIG = {
  // Test keys - replace with your actual test keys
  TEST_PUBLIC_KEY: "pk_test_b74e6f84f44c56d0b8a847f87fbee96a39dc0e9c", // Example test key
  TEST_SECRET_KEY: "sk_test_b74e6f84f44c56d0b8a847f87fbee96a39dc0e9c", // Example test key
  
  // Test environment URLs
  API_BASE: "https://api.paystack.co",
  DEMO_WEBHOOK_URL: "https://your-app.com/functions/v1/paystack-webhook",
  
  // Demo configuration flags
  IS_DEMO_MODE: true,
  MOCK_RESPONSES: true,
};

// Demo test card numbers from Paystack documentation
export const DEMO_CARDS = {
  SUCCESS: {
    number: "4084084084084081",
    expiry: "12/25",
    cvv: "123",
    type: "Success Card",
    description: "Always successful payment"
  },
  DECLINED: {
    number: "4084084084084082", 
    expiry: "12/25",
    cvv: "123",
    type: "Declined Card",
    description: "Always declined payment"
  },
  INSUFFICIENT_FUNDS: {
    number: "4084084084084083",
    expiry: "12/25", 
    cvv: "123",
    type: "Insufficient Funds",
    description: "Insufficient funds error"
  }
};

// Demo customer data for testing
export const DEMO_CUSTOMERS = {
  STUDENT: {
    email: "student@example.com",
    name: "Demo Student",
    phone: "+27123456789"
  },
  SELLER: {
    email: "seller@example.com", 
    name: "Demo Seller",
    phone: "+27987654321"
  }
};

// Demo order data
export const DEMO_ORDERS = {
  SINGLE_BOOK: {
    id: "demo-order-single-123",
    items: [{
      book_id: "demo-book-456",
      title: "Introduction to Computer Science",
      author: "Demo Author",
      isbn: "9781234567890",
      price: 50.00,
      seller_id: "demo-seller-789",
      seller_name: "Demo University Bookstore"
    }],
    total_amount: 50.00,
    shipping_fee: 0,
    metadata: {
      university: "University of Cape Town",
      course_code: "CSC101",
      test_mode: true
    }
  },
  MULTI_SELLER: {
    id: "demo-order-multi-124", 
    items: [
      {
        book_id: "demo-book-457",
        title: "Calculus I",
        price: 35.00,
        seller_id: "demo-seller-790"
      },
      {
        book_id: "demo-book-458", 
        title: "Physics Fundamentals",
        price: 45.00,
        seller_id: "demo-seller-791"
      }
    ],
    total_amount: 80.00,
    shipping_fee: 15.00,
    metadata: {
      multi_seller: true,
      test_mode: true
    }
  }
};

// Demo webhook events following Paystack format
export const DEMO_WEBHOOK_EVENTS = {
  CHARGE_SUCCESS: {
    event: "charge.success",
    data: {
      id: 1234567890,
      domain: "test",
      status: "success",
      reference: "demo_ref_success_123",
      amount: 5000, // R50.00 in kobo
      currency: "ZAR",
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      channel: "card",
      authorization: {
        authorization_code: "AUTH_demo123",
        bin: "408408",
        last4: "4081",
        exp_month: "12",
        exp_year: "2025",
        channel: "card",
        card_type: "visa",
        bank: "Test Bank",
        country_code: "ZA",
        brand: "visa"
      },
      customer: {
        id: 123456,
        first_name: "Demo",
        last_name: "Student", 
        email: "student@example.com",
        phone: "+27123456789"
      },
      metadata: {
        order_id: "demo-order-123",
        user_id: "demo-user-456",
        test_mode: true
      }
    }
  },
  
  CHARGE_FAILED: {
    event: "charge.failed",
    data: {
      id: 1234567891,
      domain: "test",
      status: "failed", 
      reference: "demo_ref_failed_124",
      amount: 5000,
      currency: "ZAR",
      channel: "card",
      gateway_response: "Declined by financial institution",
      customer: {
        email: "student@example.com"
      },
      metadata: {
        order_id: "demo-order-124",
        test_mode: true
      }
    }
  },

  TRANSFER_SUCCESS: {
    event: "transfer.success",
    data: {
      domain: "test",
      amount: 4500, // R45.00 after commission
      currency: "ZAR",
      reference: "demo_transfer_success_125",
      status: "success",
      recipient: {
        domain: "test",
        type: "nuban", 
        name: "Demo Seller",
        description: "Demo University Bookstore",
        details: {
          account_number: "0123456789",
          account_name: "Demo Seller",
          bank_code: "044",
          bank_name: "Access Bank"
        }
      },
      metadata: {
        seller_id: "demo-seller-789",
        order_id: "demo-order-123",
        commission_taken: 500, // R5.00
        test_mode: true
      }
    }
  }
};

// Demo subaccount data
export const DEMO_SUBACCOUNTS = {
  UNIVERSITY_BOOKSTORE: {
    business_name: "Demo University Bookstore",
    settlement_bank: "044", // Access Bank
    account_number: "0123456789",
    percentage_charge: 90, // Seller gets 90%, platform gets 10%
    description: "Official bookstore for Demo University",
    primary_contact_email: "bookstore@demouniversity.ac.za",
    primary_contact_name: "Demo Manager",
    primary_contact_phone: "+27123456789",
    metadata: {
      university: "Demo University",
      verified: true,
      test_mode: true
    }
  },
  
  INDIVIDUAL_SELLER: {
    business_name: "Demo Student Seller", 
    settlement_bank: "632005", // ABSA
    account_number: "9876543210",
    percentage_charge: 90,
    description: "Individual student selling textbooks",
    primary_contact_email: "seller@student.demouniversity.ac.za",
    primary_contact_name: "Demo Student",
    primary_contact_phone: "+27987654321",
    metadata: {
      seller_type: "individual",
      student_verified: true,
      test_mode: true
    }
  }
};

// Mock API responses for testing
export const MOCK_RESPONSES = {
  PAYMENT_INITIALIZATION_SUCCESS: {
    status: true,
    message: "Authorization URL created",
    data: {
      authorization_url: "https://checkout.paystack.com/demo123456",
      access_code: "demo_access_code_123",
      reference: "demo_ref_123456789"
    }
  },
  
  PAYMENT_VERIFICATION_SUCCESS: {
    status: true,
    message: "Verification successful", 
    data: {
      id: 1234567890,
      status: "success",
      reference: "demo_ref_123456789",
      amount: 5000,
      currency: "ZAR",
      paid_at: new Date().toISOString(),
      customer: DEMO_CUSTOMERS.STUDENT,
      metadata: DEMO_ORDERS.SINGLE_BOOK.metadata
    }
  },

  SUBACCOUNT_CREATION_SUCCESS: {
    status: true,
    message: "Subaccount created",
    data: {
      subaccount_code: "ACCT_demo123456789",
      business_name: "Demo University Bookstore",
      description: "Official bookstore for Demo University",
      primary_contact_email: "bookstore@demouniversity.ac.za",
      percentage_charge: 90,
      is_verified: true,
      settlement_bank: "044",
      account_number: "0123456789"
    }
  },

  TRANSFER_SUCCESS: {
    status: true,
    message: "Transfer has been queued",
    data: {
      integration: 123456,
      domain: "test",
      amount: 4500,
      currency: "ZAR", 
      source: "balance",
      reason: "Payment for order demo-order-123",
      recipient: 789012,
      status: "pending",
      transfer_code: "TRF_demo123456789",
      id: 987654321,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
};

// Utility functions for demo testing
export const generateDemoReference = (prefix: string = "demo") => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateDemoWebhookSignature = (payload: string, secret: string = "demo_secret") => {
  // In real implementation, this would be HMAC SHA512
  // For demo purposes, we'll return a mock signature
  return `sha512=demo_signature_${btoa(payload).substr(0, 20)}`;
};

export const validateDemoCard = (cardNumber: string): { valid: boolean; type: string; message: string } => {
  const cleanCard = cardNumber.replace(/\s/g, '');
  
  if (cleanCard === DEMO_CARDS.SUCCESS.number) {
    return { valid: true, type: 'success', message: 'Payment will succeed' };
  } else if (cleanCard === DEMO_CARDS.DECLINED.number) {
    return { valid: true, type: 'declined', message: 'Payment will be declined' };
  } else if (cleanCard === DEMO_CARDS.INSUFFICIENT_FUNDS.number) {
    return { valid: true, type: 'insufficient', message: 'Insufficient funds error' };
  } else {
    return { valid: false, type: 'unknown', message: 'Unknown test card' };
  }
};

// Export everything for easy import
export default {
  PAYSTACK_DEMO_CONFIG,
  DEMO_CARDS,
  DEMO_CUSTOMERS, 
  DEMO_ORDERS,
  DEMO_WEBHOOK_EVENTS,
  DEMO_SUBACCOUNTS,
  MOCK_RESPONSES,
  generateDemoReference,
  generateDemoWebhookSignature,
  validateDemoCard
};
