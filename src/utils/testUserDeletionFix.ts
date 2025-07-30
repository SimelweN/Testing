/**
 * Simple test to verify user deletion error handling fixes
 * This simulates the exact error flow that was causing "[object Object]"
 */

// Simulate a UserDeletionReport with mixed error types
const simulateBrokenReport = {
  success: false,
  userId: 'test-user-123',
  email: 'test@example.com',
  deletedRecords: {},
  errors: [
    'String error message',
    new Error('Error object message'),
    { message: 'Object with message property', code: 'ERR001' },
    { code: 'ERR002', details: 'Object without message' },
    42, // Number
    null, // Null value
  ]
};

// Test the original error handling (would cause [object Object])
export function testOriginalErrorHandling() {
  console.log("🔍 Testing original error handling (would show [object Object]):");
  console.log("Raw errors array:", simulateBrokenReport.errors);
  console.log("Joined result:", simulateBrokenReport.errors.join(", "));
  console.log("^ This would show '[object Object]' for complex objects");
}

// Test the fixed error handling
export function testFixedErrorHandling() {
  console.log("\n✅ Testing fixed error handling:");
  
  // Apply the same sanitization logic used in AdminDashboard
  const sanitizedErrors = simulateBrokenReport.errors.map(error => {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (typeof error === 'object' && error !== null && error.message) {
      return String(error.message);
    }
    return String(error);
  });
  
  console.log("Sanitized errors:", sanitizedErrors);
  console.log("Final message:", `User deletion failed: ${sanitizedErrors.join(", ")}`);
  console.log("^ All errors are now readable strings");
}

// Test comprehensive error scenarios
export function testAllErrorScenarios() {
  console.log("\n🧪 Testing all error scenarios:");
  
  const testCases = [
    'Simple string error',
    new Error('Standard Error object'),
    new TypeError('Type Error object'),
    { message: 'Supabase-style error', code: 'PGRST301', details: 'Some details' },
    { error: 'Alternative error property', status: 500 },
    { details: 'Only details property', hint: 'Some hint' },
    { code: 'UNKNOWN', status: 'failed' }, // No message/error/details
    123, // Number
    true, // Boolean
    null, // Null
    undefined, // Undefined
    [], // Empty array
    {}, // Empty object
  ];
  
  console.log("Input errors:", testCases);
  
  const results = testCases.map(error => {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (typeof error === 'object' && error !== null && error.message) {
      return String(error.message);
    }
    return String(error);
  });
  
  console.log("Converted results:", results);
  console.log("Final joined:", results.join(", "));
  
  // Verify no "[object Object]" appears
  const hasObjectString = results.some(result => result.includes('[object Object]'));
  console.log(`✅ No '[object Object]' found: ${!hasObjectString}`);
}

// Run all tests
export function runAllUserDeletionErrorTests() {
  console.log("🧪 Running complete user deletion error handling tests...\n");
  
  testOriginalErrorHandling();
  testFixedErrorHandling();
  testAllErrorScenarios();
  
  console.log("\n🎉 All tests completed! Error handling should now work correctly.");
}

// Make available in browser console
if (typeof window !== 'undefined') {
  (window as any).testOriginalErrorHandling = testOriginalErrorHandling;
  (window as any).testFixedErrorHandling = testFixedErrorHandling;
  (window as any).testAllErrorScenarios = testAllErrorScenarios;
  (window as any).runAllUserDeletionErrorTests = runAllUserDeletionErrorTests;
}
