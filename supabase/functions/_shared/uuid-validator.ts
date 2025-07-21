/**
 * UUID Validation Utility - Consistent UUID validation across all Edge Functions
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TEST_ID_PATTERNS = [
  /^ORD_test/i,      // Test order IDs
  /^USR_test/i,      // Test user IDs
  /^ORD_\d+_/i,      // Generated order IDs
  /^test_ref_/i,     // Test payment references
];

export interface UUIDValidationResult {
  isValid: boolean;
  isTestMode: boolean;
  error?: string;
}

/**
 * Validates if a string is a valid UUID or test ID
 */
export function validateUUID(id: string | undefined | null, fieldName: string = "id"): UUIDValidationResult {
  if (!id || typeof id !== 'string') {
    return {
      isValid: false,
      isTestMode: false,
      error: `${fieldName} is required and must be a string`
    };
  }

  // Check if it's a test mode ID
  const isTestMode = TEST_ID_PATTERNS.some(pattern => pattern.test(id));
  
  if (isTestMode) {
    return {
      isValid: true,
      isTestMode: true
    };
  }

  // Check if it's a valid UUID
  if (UUID_REGEX.test(id)) {
    return {
      isValid: true,
      isTestMode: false
    };
  }

  return {
    isValid: false,
    isTestMode: false,
    error: `${fieldName} must be a valid UUID or test ID (got: "${id}")`
  };
}

/**
 * Validates multiple UUIDs at once
 */
export function validateUUIDs(fields: Record<string, string | undefined | null>): {
  isValid: boolean;
  errors: string[];
  testMode: boolean;
} {
  const errors: string[] = [];
  let hasTestMode = false;

  for (const [fieldName, value] of Object.entries(fields)) {
    const result = validateUUID(value, fieldName);
    if (!result.isValid) {
      errors.push(result.error!);
    }
    if (result.isTestMode) {
      hasTestMode = true;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    testMode: hasTestMode
  };
}

/**
 * Create error response for UUID validation failures
 */
export function createUUIDErrorResponse(errors: string[], corsHeaders: any): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: "UUID_VALIDATION_FAILED",
      details: {
        validation_errors: errors,
        accepted_formats: [
          "Valid UUID (e.g., 123e4567-e89b-12d3-a456-426614174000)",
          "Test order IDs (e.g., ORD_test_decline, ORD_1234567890_abc)",
          "Test user IDs (e.g., USR_test_123)",
          "Test payment refs (e.g., test_ref_1234567890_abc)",
          "Tracking numbers (e.g., FW123456789, CG123456789)",
          "Mock/Demo IDs (e.g., mock_123, demo_456, ACCT_mock_789)"
        ]
      },
      fix_instructions: "Ensure all ID fields are either valid UUIDs or test IDs in the correct format"
    }),
    {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
