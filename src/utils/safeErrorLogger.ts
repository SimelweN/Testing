/**
 * Safe error logging utility to prevent "[object Object]" errors
 */

export const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error === null) {
    return 'null';
  }

  if (error === undefined) {
    return 'undefined';
  }

  if (error && typeof error === 'object') {
    try {
      // Handle common error object structures
      const errorObj = error as any;
      if (errorObj.message) {
        return errorObj.message;
      }
      if (errorObj.error && typeof errorObj.error === 'string') {
        return errorObj.error;
      }
      if (errorObj.details) {
        return typeof errorObj.details === 'string' ? errorObj.details : JSON.stringify(errorObj.details);
      }

      // Try to stringify the object
      const stringified = JSON.stringify(error);
      return stringified === '{}' ? 'Empty object error' : stringified;
    } catch {
      // If JSON.stringify fails, use a safe fallback
      return `Error object (${Object.prototype.toString.call(error)})`;
    }
  }

  return String(error);
};

export const safeLogError = (context: string, error: unknown, additionalData?: Record<string, any>) => {
  const errorMessage = formatError(error);

  // Prevent logging [object Object] by ensuring all data is properly serialized
  const errorInfo = error instanceof Error ? {
    name: error.name,
    message: error.message,
    stack: error.stack
  } : formatError(error);

  // Clean additional data to prevent [object Object] issues
  const cleanAdditionalData = additionalData ?
    Object.fromEntries(
      Object.entries(additionalData).map(([key, value]) => [
        key,
        typeof value === 'object' && value !== null ?
          JSON.stringify(value) : String(value)
      ])
    ) : {};

  console.error(`[${context}]`, {
    message: errorMessage,
    error: errorInfo,
    timestamp: new Date().toISOString(),
    ...cleanAdditionalData
  });
};

export const formatSupabaseError = (error: any): string => {
  if (!error) return 'Unknown error';
  
  if (typeof error === 'string') return error;
  
  // Handle Supabase error format
  if (error.message) {
    return error.message;
  }
  
  if (error.details) {
    return typeof error.details === 'object' 
      ? JSON.stringify(error.details) 
      : String(error.details);
  }
  
  if (error.hint) {
    return error.hint;
  }
  
  return formatError(error);
};

export const isNetworkError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  
  return (
    error.message.includes('Failed to fetch') ||
    error.message.includes('NetworkError') ||
    error.message.includes('fetch') ||
    error.message.includes('timeout') ||
    error.name === 'NetworkError' ||
    error.name === 'TypeError'
  );
};
