/**
 * Utility for consistent error logging and display
 * Prevents "[object Object]" issues by properly serializing errors
 */

export interface ErrorDetails {
  message: string;
  code?: string;
  details?: any;
  hint?: string;
  type: string;
  timestamp: string;
}

/**
 * Extract useful information from any error object
 */
export function extractErrorDetails(error: any): ErrorDetails {
  const timestamp = new Date().toISOString();
  
  if (error === null || error === undefined) {
    return {
      message: 'Unknown error (null/undefined)',
      type: typeof error,
      timestamp
    };
  }

  // Handle Error objects
  if (error instanceof Error) {
    return {
      message: error.message || 'No message available',
      code: (error as any).code,
      details: (error as any).details,
      hint: (error as any).hint,
      type: error.constructor.name,
      timestamp
    };
  }

  // Handle Supabase/PostgreSQL error objects
  if (typeof error === 'object' && error !== null) {
    return {
      message: error.message || error.details || error.hint || 'No message available',
      code: error.code,
      details: error.details,
      hint: error.hint,
      type: typeof error,
      timestamp
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
      type: 'string',
      timestamp
    };
  }

  // Handle anything else
  return {
    message: String(error),
    type: typeof error,
    timestamp
  };
}

/**
 * Log error with consistent formatting
 */
export function logError(context: string, error: any, additionalInfo?: any): ErrorDetails {
  const errorDetails = extractErrorDetails(error);
  
  console.error(`❌ ${context}:`, {
    ...errorDetails,
    ...(additionalInfo && { additionalInfo }),
    serializedError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
  });

  return errorDetails;
}

/**
 * Get user-friendly error message for display
 */
export function getUserFriendlyErrorMessage(error: any, fallback: string = 'An unexpected error occurred'): string {
  const errorDetails = extractErrorDetails(error);
  
  // Return the most descriptive message available
  return errorDetails.message || fallback;
}

/**
 * Create detailed error info for debugging
 */
export function createErrorInfo(error: any): any {
  return {
    error: error,
    errorMessage: error?.message || 'No message available',
    errorCode: error?.code || 'No code available',
    errorDetails: error?.details || 'No details available',
    errorHint: error?.hint || 'No hint available',
    errorType: typeof error,
    timestamp: new Date().toISOString(),
    serializedError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
  };
}
