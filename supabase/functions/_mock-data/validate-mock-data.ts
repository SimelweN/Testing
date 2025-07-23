/**
 * Comprehensive Mock Data Validation
 * Validates that ALL Edge Functions have complete mock data with ALL required fields
 */

import { FunctionMockData } from "./index.ts";

// Define exact required fields for each function based on actual validation code
const FUNCTION_REQUIREMENTS = {
  // PAYSTACK FUNCTIONS
  "initialize-paystack-payment": {
    required: ["user_id", "items", "total_amount", "email"],
    validation: (data: any) => {
      if (!Array.isArray(data.items) || data.items.length === 0) {
        return "items must be a non-empty array";
      }
      if (typeof data.total_amount !== "number" || data.total_amount <= 0) {
        return "total_amount must be a positive number";
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        return "email must be in valid email format";
      }
      return null;
    }
  },

  "paystack-webhook": {
    required: ["headers", "body"],
    validation: (data: any) => {
      if (!data.headers["x-paystack-signature"]) {
        return "headers must include x-paystack-signature";
      }
      if (!data.body?.event || !data.body?.data) {
        return "body must have event and data fields";
      }
      return null;
    }
  },

  "verify-paystack-payment": {
    required: ["reference"],
    validation: null
  },

  "process-book-purchase": {
    required: ["user_id", "book_id", "email", "payment_reference"],
    validation: (data: any) => {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        return "email must be in valid email format";
      }
      return null;
    }
  },

  "process-multi-seller-purchase": {
    required: ["user_id", "cart_items", "email"],
    validation: (data: any) => {
      if (!Array.isArray(data.cart_items) || data.cart_items.length === 0) {
        return "cart_items must be a non-empty array";
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        return "email must be in valid email format";
      }
      return null;
    }
  },

  "create-order": {
    required: ["buyer_id", "buyer_email", "cart_items"],
    validation: (data: any) => {
      if (!Array.isArray(data.cart_items) || data.cart_items.length === 0) {
        return "cart_items must be a non-empty array";
      }
      return null;
    }
  },

  "send-email": {
    required: ["to", "subject"],
    validation: (data: any) => {
      if (!data.html && !data.text && !data.template) {
        return "either html, text, or template must be provided";
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.to)) {
        return "to must be in valid email format";
      }
      if (data.from && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.from)) {
        return "from must be in valid email format if provided";
      }
      return null;
    }
  },

  "commit-to-sale": {
    required: ["order_id", "seller_id"],
    validation: null
  },

  "decline-commit": {
    required: ["order_id", "seller_id"],
    validation: null
  },

  "mark-collected": {
    required: ["order_id", "seller_id"],
    validation: null
  },

  // "pay-seller": removed - no automated seller payments

  "create-paystack-subaccount": {
    required: ["business_name", "email", "bank_name", "bank_code", "account_number"],
    validation: (data: any) => {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        return "email must be in valid email format";
      }
      if (!/^\d{3}$/.test(data.bank_code)) {
        return "bank_code must be 3 digits";
      }
      if (data.account_number.length < 8 || data.account_number.length > 12) {
        return "account_number must be between 8-12 digits";
      }
      return null;
    }
  },

  "manage-paystack-subaccount": {
    required: ["action", "subaccount_code", "business_name", "settlement_bank", "account_number"],
    validation: null
  },

  // DELIVERY FUNCTIONS
  "courier-guy-quote": {
    required: ["fromAddress", "toAddress", "weight"],
    validation: (data: any) => {
      if (!data.fromAddress.suburb || !data.fromAddress.province || !data.fromAddress.postalCode) {
        return "fromAddress must have suburb, province, and postalCode";
      }
      if (!data.toAddress.suburb || !data.toAddress.province || !data.toAddress.postalCode) {
        return "toAddress must have suburb, province, and postalCode";
      }
      if (typeof data.weight !== "number" || data.weight <= 0 || data.weight > 50) {
        return "weight must be a number between 0.1 and 50 kg";
      }
      return null;
    }
  },

  "courier-guy-shipment": {
    required: ["order_id", "pickup_address", "delivery_address"],
    validation: null
  },

  "fastway-quote": {
    required: ["fromAddress", "toAddress", "weight"],
    validation: (data: any) => {
      if (!data.fromAddress.suburb || !data.fromAddress.province || !data.fromAddress.postalCode) {
        return "fromAddress must have suburb, province, and postalCode";
      }
      if (!data.toAddress.suburb || !data.toAddress.province || !data.toAddress.postalCode) {
        return "toAddress must have suburb, province, and postalCode";
      }
      if (typeof data.weight !== "number" || data.weight <= 0 || data.weight > 50) {
        return "weight must be a number between 0.1 and 50 kg";
      }
      return null;
    }
  },

  "fastway-shipment": {
    required: ["order_id", "pickup_address", "delivery_address"],
    validation: null
  },

  "get-delivery-quotes": {
    required: ["fromAddress", "toAddress", "weight"],
    validation: (data: any) => {
      if (!data.fromAddress.suburb || !data.fromAddress.province || !data.fromAddress.postalCode) {
        return "fromAddress must have suburb, province, and postalCode";
      }
      if (!data.toAddress.suburb || !data.toAddress.province || !data.toAddress.postalCode) {
        return "toAddress must have suburb, province, and postalCode";
      }
      if (typeof data.weight !== "number" || data.weight <= 0 || data.weight > 50) {
        return "weight must be a number between 0.1 and 50 kg";
      }
      return null;
    }
  },

  "automate-delivery": {
    required: ["order_id", "seller_address", "buyer_address"],
    validation: null
  },

  // Functions with no input requirements
  "auto-expire-commits": { required: [], validation: null },
  "check-expired-orders": { required: [], validation: null },
  "process-order-reminders": { required: [], validation: null },
  "health-test": { required: [], validation: null },
  "debug-email-template": { required: ["templateName", "template"], validation: null },
  "courier-guy-track": { required: ["tracking_number"], validation: null },
  "fastway-track": { required: ["consignment_number"], validation: null },
  "paystack-refund-management": { required: ["action", "transaction_reference"], validation: null },
  "paystack-transfer-management": { required: ["action"], validation: null },
  "paystack-split-management": { required: ["action"], validation: null },
};

export interface ValidationResult {
  functionName: string;
  passed: boolean;
  issues: string[];
  mockData: any;
}

export function validateSingleFunction(functionName: string): ValidationResult {
  const mockData = FunctionMockData[functionName as keyof typeof FunctionMockData];
  const requirements = FUNCTION_REQUIREMENTS[functionName as keyof typeof FUNCTION_REQUIREMENTS];
  
  const result: ValidationResult = {
    functionName,
    passed: true,
    issues: [],
    mockData
  };

  if (!mockData) {
    result.passed = false;
    result.issues.push("No mock data found");
    return result;
  }

  if (!requirements) {
    result.issues.push("No validation requirements defined (this might be okay for some functions)");
    return result;
  }

  // Check required fields
  for (const field of requirements.required) {
    if (field.includes('.')) {
      // Handle nested fields like "fromAddress.suburb"
      const parts = field.split('.');
      let value = mockData;
      for (const part of parts) {
        value = value?.[part];
      }
      if (value === undefined || value === null) {
        result.passed = false;
        result.issues.push(`Missing required field: ${field}`);
      }
    } else {
      // Handle top-level fields
      if (mockData[field] === undefined || mockData[field] === null) {
        result.passed = false;
        result.issues.push(`Missing required field: ${field}`);
      }
    }
  }

  // Run custom validation if provided
  if (requirements.validation) {
    const validationError = requirements.validation(mockData);
    if (validationError) {
      result.passed = false;
      result.issues.push(`Validation error: ${validationError}`);
    }
  }

  return result;
}

export function validateAllMockData(): {
  totalFunctions: number;
  passedFunctions: number;
  failedFunctions: number;
  results: ValidationResult[];
  summary: string;
} {
  const allFunctions = Object.keys(FunctionMockData);
  const results = allFunctions.map(validateSingleFunction);
  
  const passed = results.filter(r => r.passed);
  const failed = results.filter(r => !r.passed);

  const summary = failed.length === 0 
    ? `🎉 ALL ${allFunctions.length} FUNCTIONS HAVE COMPLETE MOCK DATA!`
    : `❌ ${failed.length}/${allFunctions.length} functions have incomplete mock data`;

  return {
    totalFunctions: allFunctions.length,
    passedFunctions: passed.length,
    failedFunctions: failed.length,
    results,
    summary
  };
}

export function printValidationReport(): void {
  console.log("🧪 COMPREHENSIVE MOCK DATA VALIDATION\n");
  
  const validation = validateAllMockData();
  
  console.log(validation.summary);
  console.log(`📊 Summary: ${validation.passedFunctions}/${validation.totalFunctions} functions passed\n`);

  if (validation.failedFunctions > 0) {
    console.log("❌ FAILED FUNCTIONS:\n");
    validation.results
      .filter(r => !r.passed)
      .forEach(result => {
        console.log(`  ${result.functionName}:`);
        result.issues.forEach(issue => console.log(`    - ${issue}`));
        console.log();
      });
  }

  console.log("✅ PASSED FUNCTIONS:\n");
  validation.results
    .filter(r => r.passed)
    .forEach(result => {
      console.log(`  ✓ ${result.functionName}`);
    });

  if (validation.failedFunctions === 0) {
    console.log("\n🚀 READY FOR TESTING!");
    console.log("All Edge Functions can now be tested without missing field errors.");
    console.log("Add ?test=true to any function URL to test with complete mock data.");
  }
}

// Auto-run validation when imported
if (import.meta.main) {
  printValidationReport();
}
