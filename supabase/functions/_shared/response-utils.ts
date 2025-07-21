/**
 * Response Utilities - Prevents "Failed to execute 'clone' on 'Response'" errors
 */

import { corsHeaders, getCorsHeaders } from "./cors.ts";
import { getErrorMessage, createErrorDetails } from "./error-utils.ts";

/**
 * Create a standardized JSON response with proper headers
 */
export function jsonResponse(data: any, options: { status?: number; headers?: any } = {}): Response {
  const { status = 200, headers = {} } = options;
  
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...headers
    }
  });
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  error: string,
  details: any = {},
  options: { status?: number; headers?: any } = {}
): Response {
  const { status = 500, headers = {} } = options;
  
  const errorData = {
    success: false,
    error,
    details,
    timestamp: new Date().toISOString()
  };

  return jsonResponse(errorData, { status, headers });
}

/**
 * Create a success response
 */
export function successResponse(data: any, message?: string): Response {
  const responseData = {
    success: true,
    ...(message && { message }),
    ...data,
    timestamp: new Date().toISOString()
  };

  return jsonResponse(responseData);
}

/**
 * Handle CORS preflight requests with origin-aware headers
 */
export function handleCorsPreflightRequest(origin?: string): Response {
  return new Response("ok", {
    headers: getCorsHeaders(origin),
    status: 200
  });
}

/**
 * Create CORS-aware response with origin detection
 */
export function corsAwareResponse(data: any, request?: Request, options: { status?: number; headers?: any } = {}): Response {
  const origin = request?.headers.get('origin') || undefined;
  const corsHeaders = getCorsHeaders(origin);

  return jsonResponse(data, {
    ...options,
    headers: {
      ...corsHeaders,
      ...options.headers
    }
  });
}

/**
 * Create a health check response
 */
export function healthCheckResponse(serviceName: string, additionalData: any = {}): Response {
  return jsonResponse({
    success: true,
    service: serviceName,
    status: "healthy",
    ...additionalData
  });
}

/**
 * Create a safe error response from any error type
 * Prevents "[object Object]" errors by properly serializing error objects
 */
export function safeErrorResponse(
  errorCode: string,
  error: unknown,
  context?: string,
  options: { status?: number; headers?: any } = {}
): Response {
  const errorDetails = createErrorDetails(error, context);

  return errorResponse(errorCode, errorDetails, options);
}

/**
 * Create a simple error response with just a message
 */
export function simpleErrorResponse(
  message: string,
  options: { status?: number; headers?: any } = {}
): Response {
  return errorResponse("ERROR", { error_message: message }, options);
}
