/**
 * Utility to fix "[object Object]" console logging errors
 * This provides safe error logging functions to prevent error objects from displaying as "[object Object]"
 */

export interface SafeErrorInfo {
  message: string;
  error: any;
  timestamp: string;
  context?: string;
}

/**
 * Safely formats an error for console logging to prevent "[object Object]" display
 */
export const formatErrorSafely = (error: unknown): any => {
  if (error === null || error === undefined) {
    return { type: typeof error, value: error };
  }

  if (error instanceof Error) {
    return {
      type: 'Error',
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  if (typeof error === 'string' || typeof error === 'number' || typeof error === 'boolean') {
    return { type: typeof error, value: error };
  }

  if (typeof error === 'object') {
    try {
      // Handle common Supabase error structure
      const errorObj = error as any;
      
      if (errorObj.message || errorObj.code || errorObj.details) {
        return {
          type: 'SupabaseError',
          message: errorObj.message || 'Unknown error',
          code: errorObj.code || 'NO_CODE',
          details: errorObj.details || 'No details',
          hint: errorObj.hint || undefined,
        };
      }

      // Try to safely stringify the object
      const safeStringify = (obj: any): string => {
        try {
          return JSON.stringify(obj, (key, value) => {
            if (typeof value === 'function') return '[Function]';
            if (typeof value === 'undefined') return '[Undefined]';
            if (value instanceof Error) {
              return {
                name: value.name,
                message: value.message,
                stack: value.stack
              };
            }
            return value;
          }, 2);
        } catch {
          return obj.toString();
        }
      };

      return {
        type: 'Object',
        stringified: safeStringify(errorObj),
        constructor: errorObj.constructor?.name || 'Unknown',
        keys: Object.keys(errorObj)
      };
    } catch {
      return {
        type: 'Object',
        error: 'Failed to format error object',
        toString: String(error)
      };
    }
  }

  return { type: typeof error, value: String(error) };
};

/**
 * Safe console.error that prevents "[object Object]" logging
 */
export const consoleErrorSafe = (message: string, error?: unknown, context?: string): SafeErrorInfo => {
  const errorInfo: SafeErrorInfo = {
    message,
    error: error ? formatErrorSafely(error) : undefined,
    timestamp: new Date().toISOString(),
    context
  };

  console.error(message, errorInfo);
  return errorInfo;
};

/**
 * Safe console.log that prevents "[object Object]" logging
 */
export const consoleLogSafe = (message: string, data?: unknown, context?: string) => {
  const logInfo = {
    message,
    data: data ? formatErrorSafely(data) : undefined,
    timestamp: new Date().toISOString(),
    context
  };

  console.log(message, logInfo);
  return logInfo;
};

/**
 * Safe console.warn that prevents "[object Object]" logging
 */
export const consoleWarnSafe = (message: string, data?: unknown, context?: string) => {
  const warnInfo = {
    message,
    data: data ? formatErrorSafely(data) : undefined,
    timestamp: new Date().toISOString(),
    context
  };

  console.warn(message, warnInfo);
  return warnInfo;
};

/**
 * Extract a readable message from any error type
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object') {
    const errorObj = error as any;
    if (errorObj.message) return String(errorObj.message);
    if (errorObj.error) return String(errorObj.error);
    if (errorObj.details) return String(errorObj.details);
  }
  
  return String(error);
};

export default {
  formatErrorSafely,
  consoleErrorSafe,
  consoleLogSafe,
  consoleWarnSafe,
  getErrorMessage
};
