/**
 * Shared Response Utilities - Consistent response creation across Edge Functions
 */

import { corsHeaders } from "./cors.ts";

export interface ResponseOptions {
  status?: number;
  headers?: Record<string, string>;
}

/**
 * Create standardized JSON response
 */
export function jsonResponse(data: any, options: ResponseOptions = {}): Response {
  return new Response(JSON.stringify(data), {
    status: options.status || 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...options.headers
    }
  });
}

/**
 * Alias for backward compatibility
 */
export const json = jsonResponse;

/**
 * Create success response
 */
export function successResponse(data: any, options: ResponseOptions = {}): Response {
  return jsonResponse({
    success: true,
    ...data
  }, options);
}

/**
 * Create error response
 */
export function errorResponse(error: string, details?: any, options: ResponseOptions = {}): Response {
  return jsonResponse({
    success: false,
    error,
    ...(details && { details }),
    timestamp: new Date().toISOString()
  }, {
    status: 400,
    ...options
  });
}

/**
 * Create validation error response
 */
export function validationErrorResponse(errors: string[], options: ResponseOptions = {}): Response {
  return jsonResponse({
    success: false,
    error: "VALIDATION_FAILED",
    details: {
      validation_errors: errors,
      message: `Validation failed: ${errors.join(", ")}`
    },
    timestamp: new Date().toISOString()
  }, {
    status: 400,
    ...options
  });
}
