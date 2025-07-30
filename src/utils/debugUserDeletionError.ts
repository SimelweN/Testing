/**
 * Debug utility to test user deletion error handling
 * Use in browser console to verify error message formatting
 */

export function testUserDeletionErrorFormatting() {
  console.log("🧪 Testing user deletion error formatting...");

  // Test 1: Array with string errors (should work)
  const stringErrors = ["Database connection failed", "User not found"];
  console.log("Test 1 - String errors:");
  console.log("Array:", stringErrors);
  console.log("Joined:", stringErrors.join(", "));

  // Test 2: Array with error objects (problematic)
  const errorObjects = [
    new Error("Database connection failed"),
    { message: "User not found", code: "NOT_FOUND" }
  ];
  console.log("\nTest 2 - Error objects:");
  console.log("Array:", errorObjects);
  console.log("Joined (before fix):", errorObjects.join(", "));

  // Test 3: Properly converted error objects
  const convertedErrors = errorObjects.map(err => 
    err instanceof Error ? err.message : 
    (typeof err === 'object' && err.message) ? String(err.message) : 
    String(err)
  );
  console.log("\nTest 3 - Converted errors:");
  console.log("Array:", convertedErrors);
  console.log("Joined (after fix):", convertedErrors.join(", "));

  // Test 4: Complex object that would show [object Object]
  const complexError = { 
    code: 'PGRST301', 
    details: 'Foreign key violation', 
    message: 'Delete failed',
    metadata: { table: 'users', constraint: 'fk_user_orders' }
  };
  console.log("\nTest 4 - Complex error object:");
  console.log("Object:", complexError);
  console.log("String conversion:", String(complexError));
  console.log("Proper extraction:", complexError.message || String(complexError));

  console.log("\n✅ User deletion error formatting test completed!");
}

// Test if an array contains any non-string values
export function validateErrorsArray(errors: any[]): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  errors.forEach((error, index) => {
    if (typeof error !== 'string') {
      const type = typeof error;
      const constructor = error?.constructor?.name;
      issues.push(`Index ${index}: ${type} (${constructor}) - ${error}`);
    }
  });

  return {
    isValid: issues.length === 0,
    issues
  };
}

// Helper to safely convert any error array to strings
export function sanitizeErrorsArray(errors: any[]): string[] {
  return errors.map(error => {
    if (typeof error === 'string') {
      return error;
    }
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'object' && error !== null) {
      if (error.message) {
        return String(error.message);
      }
      if (error.error) {
        return String(error.error);
      }
      if (error.details) {
        return String(error.details);
      }
      // Try to safely stringify
      try {
        return JSON.stringify(error);
      } catch {
        return '[Complex Error Object]';
      }
    }
    return String(error);
  });
}

// Make functions available in browser console
if (typeof window !== 'undefined') {
  (window as any).testUserDeletionErrorFormatting = testUserDeletionErrorFormatting;
  (window as any).validateErrorsArray = validateErrorsArray;
  (window as any).sanitizeErrorsArray = sanitizeErrorsArray;
}
