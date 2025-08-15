/**
 * Comprehensive error display utilities to prevent [object Object] errors
 * and provide meaningful error messages to users and developers
 */

export interface FormattedError {
  userMessage: string;
  developerMessage: string;
  originalError: unknown;
  errorType: string;
}

/**
 * Formats any error into a user-friendly message and detailed developer info
 */
export const formatErrorForDisplay = (error: unknown, context?: string): FormattedError => {
  let userMessage = "An unexpected error occurred";
  let developerMessage = "Unknown error";
  let errorType = "unknown";

  if (error === null) {
    return {
      userMessage: "An unexpected error occurred",
      developerMessage: "Error is null",
      originalError: error,
      errorType: "null"
    };
  }

  if (error === undefined) {
    return {
      userMessage: "An unexpected error occurred", 
      developerMessage: "Error is undefined",
      originalError: error,
      errorType: "undefined"
    };
  }

  if (error instanceof Error) {
    errorType = error.name || "Error";
    developerMessage = error.message;
    
    // Handle specific error types
    if (error.message.includes("Failed to encrypt")) {
      userMessage = "Failed to securely save your address. Please try again.";
    } else if (error.message.includes("Network") || error.message.includes("fetch")) {
      userMessage = "Network connection error. Please check your internet connection.";
    } else if (error.message.includes("authentication") || error.message.includes("unauthorized")) {
      userMessage = "Authentication error. Please sign in again.";
    } else if (error.message.includes("validation")) {
      userMessage = "Please check that all required fields are filled correctly.";
    } else {
      userMessage = error.message || "An error occurred";
    }
  } else if (typeof error === "string") {
    errorType = "string";
    developerMessage = error;
    userMessage = error;
  } else if (typeof error === "object") {
    errorType = "object";
    const errorObj = error as any;
    
    // Handle common error object patterns
    if (errorObj.message) {
      developerMessage = String(errorObj.message);
      userMessage = String(errorObj.message);
    } else if (errorObj.error) {
      developerMessage = String(errorObj.error);
      userMessage = String(errorObj.error);
    } else if (errorObj.details) {
      developerMessage = typeof errorObj.details === "string" ? errorObj.details : JSON.stringify(errorObj.details);
      userMessage = "An error occurred while processing your request";
    } else {
      // Try to extract meaningful information from the object
      try {
        const stringified = JSON.stringify(errorObj);
        if (stringified && stringified !== "{}") {
          developerMessage = stringified;
        } else {
          developerMessage = Object.prototype.toString.call(errorObj);
        }
      } catch {
        developerMessage = `Error object of type ${errorObj.constructor?.name || 'unknown'}`;
      }
      userMessage = "An error occurred while processing your request";
    }
  } else {
    errorType = typeof error;
    developerMessage = String(error);
    userMessage = "An unexpected error occurred";
  }

  return {
    userMessage: context ? `${context}: ${userMessage}` : userMessage,
    developerMessage: context ? `[${context}] ${developerMessage}` : developerMessage,
    originalError: error,
    errorType
  };
};

/**
 * Logs an error with proper formatting and context
 */
export const logFormattedError = (error: unknown, context: string, additionalData?: Record<string, any>) => {
  const formatted = formatErrorForDisplay(error, context);
  
  console.error(formatted.developerMessage, {
    type: formatted.errorType,
    userMessage: formatted.userMessage,
    originalError: formatted.originalError,
    context,
    timestamp: new Date().toISOString(),
    ...additionalData
  });
  
  return formatted;
};

/**
 * Gets a user-friendly error message for toast notifications
 */
export const getUserFriendlyErrorMessage = (error: unknown, fallback = "An error occurred"): string => {
  const formatted = formatErrorForDisplay(error);
  return formatted.userMessage || fallback;
};

/**
 * Gets a detailed error message for developer logging
 */
export const getDeveloperErrorMessage = (error: unknown): string => {
  const formatted = formatErrorForDisplay(error);
  return formatted.developerMessage;
};

/**
 * Creates an error handler that formats and logs errors consistently
 */
export const createFormattedErrorHandler = (context: string) => {
  return (error: unknown, additionalData?: Record<string, any>) => {
    const formatted = logFormattedError(error, context, additionalData);
    return formatted;
  };
};

/**
 * Handles address-specific errors with helpful messages
 */
export const handleAddressError = (error: unknown, operation: "save" | "load" | "encrypt" | "decrypt") => {
  const formatted = formatErrorForDisplay(error);
  
  let userMessage = formatted.userMessage;
  
  // Provide specific guidance based on the operation
  switch (operation) {
    case "save":
      if (formatted.developerMessage.includes("encrypt")) {
        userMessage = "Failed to securely save your address. This may be a temporary issue - please try again.";
      } else if (formatted.developerMessage.includes("network") || formatted.developerMessage.includes("fetch")) {
        userMessage = "Network error while saving your address. Please check your connection and try again.";
      } else {
        userMessage = "Failed to save your address. Please verify all fields are correct and try again.";
      }
      break;
    case "load":
      userMessage = "Failed to load your saved addresses. Please refresh the page and try again.";
      break;
    case "encrypt":
      userMessage = "Failed to encrypt your address for secure storage. Please try again.";
      break;
    case "decrypt":
      userMessage = "Failed to decrypt your saved address. This may indicate a security issue.";
      break;
  }
  
  return {
    ...formatted,
    userMessage
  };
};

export default {
  formatErrorForDisplay,
  logFormattedError,
  getUserFriendlyErrorMessage,
  getDeveloperErrorMessage,
  createFormattedErrorHandler,
  handleAddressError
};
