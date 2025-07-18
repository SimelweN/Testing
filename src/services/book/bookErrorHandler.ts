import { safeLogError } from "@/utils/errorHandling";

export const handleBookServiceError = (
  error: any,
  operation: string,
): never => {
  safeLogError(`Error in ${operation}`, error);

  // Handle specific Supabase errors
  if (error?.message?.includes("JWT")) {
    throw new Error("Your session has expired. Please log in again.");
  }

  if (error?.message?.includes("Row Level Security")) {
    throw new Error(
      "Access denied. You do not have permission to perform this action.",
    );
  }

  if (error?.code === "PGRST116") {
    throw new Error("The requested book was not found or has been removed.");
  }

  // Handle UUID format errors
  if (error?.message?.includes("invalid input syntax for type uuid")) {
    throw new Error(
      "Invalid book ID format. Please check the link and try again.",
    );
  }

  if (error?.message?.includes("Invalid book ID format")) {
    throw new Error(
      "Invalid book ID format. Please check the link and try again.",
    );
  }

  if (
    error?.message?.includes("relation") &&
    error?.message?.includes("does not exist")
  ) {
    throw new Error("Database configuration error. Please contact support.");
  }

  if (error?.code === "PGRST200") {
    throw new Error(
      "Database relationship error. Please try again or contact support.",
    );
  }

  // Network and connection errors
  if (
    error?.message?.includes("fetch") ||
    error?.message?.includes("network")
  ) {
    throw new Error(
      "Network error. Please check your connection and try again.",
    );
  }

  // Handle book-specific errors
  if (error?.message?.includes("book not found")) {
    throw new Error("This book is no longer available or has been removed.");
  }

  if (error?.message?.includes("already sold")) {
    throw new Error("This book has already been sold to another buyer.");
  }

  if (error?.message?.includes("permission denied")) {
    throw new Error("You do not have permission to access this book.");
  }

  // Generic error fallback with more context
  const errorMessage = error?.message || "Unknown error occurred";
  throw new Error(
    `Failed to ${operation}: ${errorMessage}. Please try again later.`,
  );
};

// Non-throwing version for cases where we want to return empty results instead of erroring
export const logBookServiceError = (error: any, operation: string): string => {
  safeLogError(`Error in ${operation}`, error);

  // Handle specific Supabase errors
  if (error?.message?.includes("JWT")) {
    return "Your session has expired. Please log in again.";
  }

  if (error?.message?.includes("Row Level Security")) {
    return "Access denied. You do not have permission to perform this action.";
  }

  if (error?.code === "PGRST116") {
    return "The requested book was not found or has been removed.";
  }

  if (
    error?.message?.includes("relation") &&
    error?.message?.includes("does not exist")
  ) {
    return "Database configuration error. Please contact support.";
  }

  // Generic error fallback with more context
  const errorMessage = error?.message || "Unknown error occurred";
  return `Failed to ${operation}: ${errorMessage}. Please try again later.`;
};
