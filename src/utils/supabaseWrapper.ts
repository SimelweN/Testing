import { supabase } from "@/integrations/supabase/client";
import { isNetworkError, getUserFriendlyErrorMessage } from "./networkUtils";

/**
 * Enhanced Supabase wrapper with better error handling and retries
 */

interface QueryOptions {
  retries?: number;
  timeout?: number;
  fallbackData?: any;
}

/**
 * Wrapper for Supabase queries with enhanced error handling
 */
export const supabaseQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: QueryOptions = {},
): Promise<{ data: T | null; error: any; userMessage?: string }> => {
  const { retries = 1, timeout = 10000, fallbackData = null } = options;

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), timeout);
      });

      // Race between query and timeout
      const result = (await Promise.race([queryFn(), timeoutPromise])) as {
        data: T | null;
        error: any;
      };

      if (result.error) {
        lastError = result.error;

        // Don't retry on certain errors
        if (
          !isNetworkError(result.error) &&
          !result.error.message?.includes("timeout")
        ) {
          return {
            ...result,
            userMessage: getUserFriendlyErrorMessage(result.error),
          };
        }

        // If this is the last attempt, return the error
        if (attempt === retries) {
          return {
            data: fallbackData,
            error: result.error,
            userMessage: getUserFriendlyErrorMessage(result.error),
          };
        }

        // Wait before retrying (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, attempt)),
        );
        continue;
      }

      return result;
    } catch (error) {
      lastError = error;

      // Don't retry on timeout or non-network errors on last attempt
      if (
        attempt === retries ||
        (!isNetworkError(error) && !String(error).includes("timeout"))
      ) {
        return {
          data: fallbackData,
          error: error,
          userMessage: getUserFriendlyErrorMessage(error),
        };
      }

      // Wait before retrying
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * Math.pow(2, attempt)),
      );
    }
  }

  return {
    data: fallbackData,
    error: lastError,
    userMessage: getUserFriendlyErrorMessage(lastError),
  };
};

/**
 * Get user addresses with enhanced error handling
 */
export const getUserAddressesWithRetry = async (userId: string) => {
  return supabaseQuery(
    () =>
      supabase
        .from("profiles")
        .select("pickup_address, shipping_address, addresses_same")
        .eq("id", userId)
        .single(),
    {
      retries: 2,
      timeout: 8000,
      fallbackData: null,
    },
  );
};

/**
 * Get seller pickup address with enhanced error handling
 */
export const getSellerPickupAddressWithRetry = async (sellerId: string) => {
  return supabaseQuery(
    () =>
      supabase
        .from("profiles")
        .select("pickup_address")
        .eq("id", sellerId)
        .single(),
    {
      retries: 2,
      timeout: 8000,
      fallbackData: null,
    },
  );
};

/**
 * Get book by ID with enhanced error handling
 */
export const getBookByIdWithRetry = async (bookId: string) => {
  return supabaseQuery(
    () => supabase.from("books").select("*").eq("id", bookId).single(),
    {
      retries: 2,
      timeout: 10000,
      fallbackData: null,
    },
  );
};

/**
 * Get seller profile with enhanced error handling
 */
export const getSellerProfileWithRetry = async (sellerId: string) => {
  return supabaseQuery(
    () =>
      supabase
        .from("profiles")
        .select("id, name, email")
        .eq("id", sellerId)
        .single(),
    {
      retries: 2,
      timeout: 8000,
      fallbackData: null,
    },
  );
};

export default {
  supabaseQuery,
  getUserAddressesWithRetry,
  getSellerPickupAddressWithRetry,
  getBookByIdWithRetry,
  getSellerProfileWithRetry,
};
