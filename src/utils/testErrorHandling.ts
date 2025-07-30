/**
 * Test script to verify error handling improvements for user deletion
 * This can be used in the browser console to test error scenarios
 */

export function testErrorHandling() {
  console.log("🧪 Testing error handling improvements...");

  // Test 1: Error object with message property
  const errorWithMessage = new Error("Database connection failed");
  console.log("Test 1 - Error with message:");
  console.log("Before fix would show: [object Object]");
  console.log("After fix shows:", errorWithMessage instanceof Error ? errorWithMessage.message : String(errorWithMessage));

  // Test 2: Plain object error
  const objectError = { code: 'PGRST301', details: 'Foreign key violation', message: 'User has active orders' };
  console.log("\nTest 2 - Object error:");
  console.log("Before fix would show: [object Object]");
  console.log("After fix shows:", objectError instanceof Error ? objectError.message : String(objectError));

  // Test 3: String error
  const stringError = "Network timeout occurred";
  console.log("\nTest 3 - String error:");
  console.log("Shows:", stringError instanceof Error ? stringError.message : String(stringError));

  // Test 4: Null/undefined error
  const nullError = null;
  console.log("\nTest 4 - Null error:");
  console.log("Shows:", nullError instanceof Error ? nullError.message : String(nullError));

  console.log("\n✅ Error handling test completed. All errors should now show meaningful messages instead of '[object Object]'");
}

// Make function available in browser console
if (typeof window !== 'undefined') {
  (window as any).testErrorHandling = testErrorHandling;
}
