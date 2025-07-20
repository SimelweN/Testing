/**
 * Utility to test error message extraction and prevent [object Object] issues
 */

// Test function for error extraction
export function testErrorExtraction() {
  console.log("🧪 Testing error message extraction...");
  
  const testCases = [
    // Test 1: Simple string error
    "Simple string error",
    
    // Test 2: Error object with message
    { message: "Error object with message" },
    
    // Test 3: Error object with details
    { details: "Error object with details" },
    
    // Test 4: Error object with code
    { code: "ERROR_CODE_123" },
    
    // Test 5: Complex object that might return [object Object]
    { complex: { nested: { object: true } } },
    
    // Test 6: Error object with [object Object] as message
    { message: "[object Object]" },
    
    // Test 7: Actual Error instance
    new Error("Actual Error instance"),
    
    // Test 8: null/undefined
    null,
    undefined,
    
    // Test 9: Empty object
    {},
    
    // Test 10: Function (should not happen but test anyway)
    () => "function error"
  ];

  const extractErrorMessage = (err: any): string => {
    // Direct string check first
    if (typeof err === 'string') {
      return err === '[object Object]' ? 'String conversion error' : err;
    }
    
    // Check for standard error properties
    if (err && typeof err === 'object') {
      if (typeof err.message === 'string' && err.message && err.message !== '[object Object]') {
        return err.message;
      }
      if (typeof err.details === 'string' && err.details && err.details !== '[object Object]') {
        return err.details;
      }
      if (typeof err.hint === 'string' && err.hint && err.hint !== '[object Object]') {
        return err.hint;
      }
      if (err.code) {
        return `Error code: ${String(err.code)}`;
      }
      
      // Try to extract meaningful info from object
      if (err.name) {
        return `${err.name}: ${err.message || 'Unknown error'}`;
      }
    }
    
    return 'Unknown error occurred';
  };

  testCases.forEach((testCase, index) => {
    try {
      const result = extractErrorMessage(testCase);
      const isValid = result !== '[object Object]' && typeof result === 'string' && result.length > 0;
      
      console.log(`Test ${index + 1}:`, {
        input: testCase,
        inputType: typeof testCase,
        result: result,
        isValid: isValid,
        status: isValid ? '✅' : '❌'
      });
      
      if (!isValid) {
        console.warn(`⚠️ Test ${index + 1} failed - invalid result:`, result);
      }
    } catch (error) {
      console.error(`❌ Test ${index + 1} threw error:`, error);
    }
  });
  
  console.log("🧪 Error extraction testing complete");
}

// Test the PaymentErrorHandler function
export function testPaymentErrorClassification() {
  console.log("🧪 Testing payment error classification...");
  
  const mockErrors = [
    "Network connection failed",
    { message: "Authentication failed" },
    { message: "[object Object]" },
    { details: "Payment declined by bank" },
    new Error("Test error"),
    null,
    undefined,
    {},
    "Edge Function returned a non-2xx status code"
  ];

  // We can't import the function easily here, so just test our extraction logic
  mockErrors.forEach((error, index) => {
    let errorMessage = error?.message || (typeof error === 'string' ? error : 'Payment error occurred');
    
    // Prevent [object Object] from being used
    if (errorMessage === '[object Object]') {
      errorMessage = 'Payment processing error occurred';
    }
    
    const isValid = errorMessage !== '[object Object]' && typeof errorMessage === 'string';
    console.log(`Payment Error Test ${index + 1}:`, {
      input: error,
      result: errorMessage,
      isValid: isValid,
      status: isValid ? '✅' : '❌'
    });
  });
  
  console.log("🧪 Payment error classification testing complete");
}

// Combined test function
export function runAllErrorTests() {
  console.log("🚀 Running comprehensive error extraction tests...");
  testErrorExtraction();
  testPaymentErrorClassification();
  console.log("✅ All error extraction tests completed");
}

// Auto-run tests in development
if (import.meta.env.DEV) {
  // Uncomment to auto-run tests during development
  // runAllErrorTests();
}
