/**
 * Comprehensive Edge Function Testing Utility
 * Import this into any Edge Function for instant testing with complete mock data
 */

import { FunctionMockData, validateMockData } from "./index.ts";
import { createMockResponse } from "./mock-responses.ts";

/**
 * Test any Edge Function with proper mock data
 * Usage in Edge Function:
 * 
 * import { testFunction } from "../_mock-data/edge-function-tester.ts";
 * 
 * // At the start of your function handler:
 * const testResult = await testFunction("your-function-name", req);
 * if (testResult.isTest) {
 *   return testResult.response;
 * }
 */
export async function testFunction(functionName: string, req: Request) {
  // Check if this is a test request
  const url = new URL(req.url);
  const isTest = url.searchParams.get("test") === "true" ||
                 url.searchParams.get("mock") === "true" ||
                 req.headers.get("x-test-mode") === "true";

  if (!isTest) {
    return { isTest: false, response: null };
  }

  console.log(`🧪 Test mode activated for function: ${functionName}`);

  const mockData = FunctionMockData[functionName as keyof typeof FunctionMockData];
  
  if (!mockData) {
    return {
      isTest: true,
      response: new Response(
        JSON.stringify({
          success: false,
          error: "NO_MOCK_DATA_AVAILABLE",
          message: `No mock data found for function: ${functionName}`,
          available_functions: Object.keys(FunctionMockData),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    };
  }

  // Validate mock data completeness
  const isValid = validateMockData(functionName, mockData);
  if (!isValid) {
    return {
      isTest: true,
      response: new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_MOCK_DATA",
          message: `Mock data validation failed for function: ${functionName}`,
          mock_data: mockData,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    };
  }

  // Return realistic mock response for the function
  const mockResponse = createMockResponse(functionName, {
    test_mode: true,
    mock_data_used: mockData
  });

  return {
    isTest: true,
    response: new Response(
      JSON.stringify(mockResponse),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  };
}

/**
 * Get mock data for any function
 */
export function getMockData(functionName: string) {
  return FunctionMockData[functionName as keyof typeof FunctionMockData];
}

/**
 * Validate that a function's mock data has all required fields
 */
export function validateFunctionMockData(functionName: string): {
  valid: boolean;
  missing_fields: string[];
  mock_data: any;
} {
  const mockData = getMockData(functionName);
  
  if (!mockData) {
    return {
      valid: false,
      missing_fields: ["ENTIRE_MOCK_DATA_MISSING"],
      mock_data: null
    };
  }

  const isValid = validateMockData(functionName, mockData);
  
  return {
    valid: isValid,
    missing_fields: isValid ? [] : ["See console for detailed field validation"],
    mock_data: mockData
  };
}

/**
 * Generate a test request with proper mock data
 */
export function createTestRequest(functionName: string, baseUrl: string = "https://localhost:54321"): Request {
  const mockData = getMockData(functionName);
  
  if (!mockData) {
    throw new Error(`No mock data available for function: ${functionName}`);
  }

  // For webhook functions that need headers
  if (functionName === "paystack-webhook") {
    return new Request(`${baseUrl}/functions/v1/${functionName}?test=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-paystack-signature": mockData.headers["x-paystack-signature"] || "test-signature",
        "x-test-mode": "true"
      },
      body: JSON.stringify(mockData.body || mockData)
    });
  }

  // For functions that require special headers (like subaccount management)
  if (functionName.includes("subaccount")) {
    return new Request(`${baseUrl}/functions/v1/${functionName}?test=true`, {
      method: "POST", 
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-auth-token",
        "x-test-mode": "true"
      },
      body: JSON.stringify(mockData)
    });
  }

  // Standard request for most functions
  return new Request(`${baseUrl}/functions/v1/${functionName}?test=true`, {
    method: Object.keys(mockData).length > 0 ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      "x-test-mode": "true"
    },
    body: Object.keys(mockData).length > 0 ? JSON.stringify(mockData) : undefined
  });
}

/**
 * Test all functions and report which ones have complete mock data
 */
export function validateAllFunctions(): {
  total_functions: number;
  valid_functions: number;
  invalid_functions: string[];
  report: Record<string, { valid: boolean; mock_data_present: boolean }>;
} {
  const allFunctions = Object.keys(FunctionMockData);
  const report: Record<string, { valid: boolean; mock_data_present: boolean }> = {};
  const invalidFunctions: string[] = [];
  let validCount = 0;

  for (const functionName of allFunctions) {
    const validation = validateFunctionMockData(functionName);
    report[functionName] = {
      valid: validation.valid,
      mock_data_present: validation.mock_data !== null
    };

    if (validation.valid) {
      validCount++;
    } else {
      invalidFunctions.push(functionName);
    }
  }

  return {
    total_functions: allFunctions.length,
    valid_functions: validCount,
    invalid_functions: invalidFunctions,
    report
  };
}

console.log("🚀 Edge Function Testing Utility loaded");
console.log("📊 Available functions:", Object.keys(FunctionMockData).length);
console.log("✅ Use testFunction() in your Edge Functions for instant testing");
