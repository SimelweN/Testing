/**
 * Edge Function Client
 * Handles API calls to Supabase Edge Functions with proper CORS headers
 */

import { supabase } from '@/lib/supabase';

interface EdgeFunctionOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

interface EdgeFunctionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

/**
 * Get the current origin for CORS headers
 */
function getCurrentOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://rebooked-solutions.vercel.app';
}

/**
 * Get proper headers for Edge Function calls
 */
function getEdgeFunctionHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabase.supabaseKey}`,
    'Origin': getCurrentOrigin(),
    ...additionalHeaders
  };
}

/**
 * Call a Supabase Edge Function with proper error handling and CORS
 */
export async function callEdgeFunction<T = any>(
  functionName: string,
  options: EdgeFunctionOptions = {}
): Promise<EdgeFunctionResponse<T>> {
  const {
    method = 'POST',
    body,
    headers = {},
    timeout = 30000 // 30 seconds default timeout
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const url = `${supabase.supabaseUrl}/functions/v1/${functionName}`;
    console.log(`🚀 Calling Edge Function: ${functionName}`);
    console.log(`📍 URL: ${url}`);

    const response = await fetch(url, {
      method,
      headers: getEdgeFunctionHeaders(headers),
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log(`📤 Response Status: ${response.status}`);

    // Handle different response types
    if (response.status === 404) {
      return {
        success: false,
        error: 'FUNCTION_NOT_FOUND',
        details: {
          message: `Edge Function '${functionName}' not found. Check deployment.`,
          function_name: functionName,
          url
        }
      };
    }

    let responseData: any;
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      responseData = await response.json();
    } else {
      const textData = await response.text();
      console.log(`📝 Non-JSON Response: ${textData}`);
      responseData = { message: textData };
    }

    if (!response.ok) {
      return {
        success: false,
        error: responseData.error || 'API_ERROR',
        details: responseData.details || responseData
      };
    }

    return {
      success: true,
      data: responseData
    };

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'TIMEOUT',
        details: {
          message: `Request to ${functionName} timed out after ${timeout}ms`
        }
      };
    }

    console.error(`❌ Edge Function call failed:`, error);
    
    return {
      success: false,
      error: 'NETWORK_ERROR',
      details: {
        message: error.message || 'Network request failed',
        function_name: functionName
      }
    };
  }
}

/**
 * Specific helper functions for common operations
 */

export async function createOrder(orderData: any) {
  return callEdgeFunction('create-order', {
    method: 'POST',
    body: orderData
  });
}

export async function commitToSale(orderId: string) {
  return callEdgeFunction('commit-to-sale', {
    method: 'POST',
    body: { order_id: orderId }
  });
}

export async function declineCommit(orderId: string, reason?: string) {
  return callEdgeFunction('decline-commit', {
    method: 'POST',
    body: { 
      order_id: orderId,
      ...(reason && { decline_reason: reason })
    }
  });
}

export async function markCollected(orderId: string) {
  return callEdgeFunction('mark-collected', {
    method: 'POST',
    body: { order_id: orderId }
  });
}

export async function initializePaystackPayment(paymentData: any) {
  return callEdgeFunction('initialize-paystack-payment', {
    method: 'POST',
    body: paymentData
  });
}

export async function verifyPaystackPayment(reference: string) {
  return callEdgeFunction('verify-paystack-payment', {
    method: 'POST',
    body: { reference }
  });
}

/**
 * Test Edge Function connectivity
 */
export async function testEdgeFunctionConnectivity(functionName: string = 'health-test') {
  console.log(`🔍 Testing connectivity to ${functionName}...`);
  
  const result = await callEdgeFunction(functionName, {
    method: 'POST',
    body: { test: true },
    timeout: 10000 // 10 second timeout for testing
  });

  if (result.success) {
    console.log(`✅ ${functionName} is accessible`);
  } else {
    console.log(`❌ ${functionName} failed:`, result.error);
  }

  return result;
}
