import { supabase } from "@/integrations/supabase/client";
import { Book } from "@/types/book";
import { BookFilters, BookQueryResult } from "./bookTypes";
import { mapBookFromDatabase } from "./bookMapper";
import {
  handleBookServiceError,
  logBookServiceError,
} from "./bookErrorHandler";
import {
  logError,
  getErrorMessage,
  logDatabaseError,
} from "@/utils/errorUtils";
import { formatSupabaseError } from "@/utils/safeErrorLogger";
import { getSafeErrorMessage } from "@/utils/errorMessageUtils";
// Simple retry function to replace the missing connectionHealthCheck
const retryWithConnection = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
};
import { getFallbackBooks } from "@/utils/fallbackBooksData";

// Circuit breaker to prevent error spam
let bookQueryErrorCount = 0;
let lastBookQueryError = 0;
const ERROR_SPAM_THRESHOLD = 5;
const ERROR_COOLDOWN_PERIOD = 60000; // 1 minute

const shouldLogBookError = (): boolean => {
  const now = Date.now();

  // Reset error count after cooldown period
  if (now - lastBookQueryError > ERROR_COOLDOWN_PERIOD) {
    bookQueryErrorCount = 0;
  }

  // Only log if we haven't exceeded the threshold
  if (bookQueryErrorCount < ERROR_SPAM_THRESHOLD) {
    bookQueryErrorCount++;
    lastBookQueryError = now;
    return true;
  }

  // Log warning about suppressing errors (only once)
  if (bookQueryErrorCount === ERROR_SPAM_THRESHOLD) {
    console.warn(
      "[BookQueries] Too many errors - suppressing further error logs for 1 minute",
    );
    bookQueryErrorCount++;
  }

  return false;
};

// Enhanced error logging function with spam protection
const logDetailedError = (context: string, error: unknown) => {
  // Check if we should log this error (spam protection)
  if (!shouldLogBookError()) {
    return;
  }

  // Use safe error logging to prevent [object Object] issues
  const errorMessage = error instanceof Error ? error.message :
                      (typeof error === 'object' && error !== null) ?
                      JSON.stringify(error, Object.getOwnPropertyNames(error)) :
                      String(error);

  console.error(`[BookQueries - ${context}]`, {
    message: errorMessage,
    error_type: error instanceof Error ? 'Error' : typeof error,
    error_details: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error,
    timestamp: new Date().toISOString()
  });

  // Also log to our error utility with safe message extraction (but don't spam it)
  if (logError && bookQueryErrorCount <= 3) {
    logError(context, new Error(errorMessage));
  }
};

export const getBooks = async (filters?: BookFilters): Promise<Book[]> => {
  try {
    console.log("🔍 BookQueries: Fetching books with filters:", filters);

        const fetchBooksOperation = async (retryCount = 0): Promise<any[]> => {
      try {
        console.log("📊 BookQueries: Starting database query...");

        // SIMPLIFIED QUERY: Get ALL books first to debug
        let query = supabase
          .from("books")
          .select(`
            *,
            seller_profile:profiles!seller_id(
              id,
              pickup_address
            )
          `)
          .eq("sold", false)  // Only show available books
          .order("created_at", { ascending: false });

        console.log("📋 BookQueries: Basic query constructed, applying filters...");

        // Apply filters if provided
        if (filters) {
          if (filters.search) {
            query = query.or(
              `title.ilike.%${filters.search}%,author.ilike.%${filters.search}%`,
            );
          }
          if (filters.category) {
            query = query.eq("category", filters.category);
          }
          if (filters.condition) {
            query = query.eq("condition", filters.condition);
          }
          if (filters.grade) {
            query = query.eq("grade", filters.grade);
          }
          if (filters.universityYear) {
            query = query.eq("university_year", filters.universityYear);
          }
          if (filters.university) {
            query = query.eq("university", filters.university);
          }
          if (filters.province) {
            query = query.eq("province", filters.province);
          }
          if (filters.minPrice !== undefined) {
            query = query.gte("price", filters.minPrice);
          }
          if (filters.maxPrice !== undefined) {
            query = query.lte("price", filters.maxPrice);
          }
        }

        console.log("🚀 BookQueries: Executing database query...");
        const { data: booksData, error: booksError } = await query;
        console.log("📬 BookQueries: Query result - data:", booksData?.length || 0, "error:", booksError?.message || "none");

        if (booksError) {
          // Log error with proper formatting to prevent [object Object]
          console.error('Books query failed:', {
            message: booksError.message || 'Unknown error',
            code: booksError.code || 'NO_CODE',
            details: booksError.details || 'No details',
            hint: booksError.hint || 'No hint',
            retryCount,
            filters,
            timestamp: new Date().toISOString()
          });

          logDetailedError("Books query failed", booksError);

          // If it's a connection error and we haven't retried too many times, try again
          if (retryCount < 3 && (
            booksError.message?.includes('fetch') ||
            booksError.message?.includes('network') ||
            booksError.message?.includes('Failed to fetch') ||
            booksError.message?.includes('timeout')
          )) {
            console.log(`Retrying books query (attempt ${retryCount + 1}/4)...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
            return fetchBooksOperation(retryCount + 1);
          }

          throw new Error(
            `Failed to fetch books after ${retryCount + 1} attempts: ${booksError.message || "Unknown database error"}`,
          );
        }

        if (!booksData) {
          console.warn("Books query returned null data");
          return [];
        }

        console.log(`Successfully fetched ${booksData.length} books`);
        return booksData;
      } catch (networkError) {
        logDetailedError("Network exception in books query", networkError);

        // If it's a network error and we haven't retried too many times, try again
        if (retryCount < 3) {
          console.log(`Retrying books query after network exception (attempt ${retryCount + 1}/4)...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchBooksOperation(retryCount + 1);
        }

        throw networkError;
            }
    };

    // Execute the books query with retry logic
    const booksData = await fetchBooksOperation();

    if (!booksData || booksData.length === 0) {
      console.log("No books found");
      return [];
    }

    // EMERGENCY: Show ALL books regardless of seller profile or address
    console.log("🆘 EMERGENCY MODE: Bypassing ALL filters to show books");
    const validBooks = booksData; // Show everything!

    console.log(`📦 Filtered ${booksData.length} books down to ${validBooks.length} with valid pickup addresses`);

    if (validBooks.length === 0) {
      console.log("No books with valid seller pickup addresses found");
      return [];
    }

    // Get unique seller IDs from valid books only
    const sellerIds = [...new Set(validBooks.map((book) => book.seller_id))];

      // Fetch seller profiles separately with error handling
      let profilesMap = new Map();
            try {
        // Add retry logic for profile fetching
        const fetchProfiles = async (retryCount = 0): Promise<void> => {
          try {
            const { data: profilesData, error: profilesError } = await supabase
              .from("profiles")
              .select("id, name, email")
              .in("id", sellerIds);

            if (profilesError) {
              // Log error with proper formatting to prevent [object Object]
              console.error('Error fetching profiles:', {
                message: profilesError.message || 'Unknown error',
                code: profilesError.code || 'NO_CODE',
                details: profilesError.details || 'No details',
                hint: profilesError.hint || 'No hint',
                sellerIds: sellerIds.length,
                retryCount,
                timestamp: new Date().toISOString()
              });

              logDetailedError("Error fetching profiles", profilesError);

              // Check network connectivity
              const isNetworkError = (
                profilesError.message?.includes('fetch') ||
                profilesError.message?.includes('network') ||
                profilesError.message?.includes('Failed to fetch') ||
                profilesError.message?.includes('NetworkError')
              );

              if (isNetworkError) {
                console.warn("🔌 Network connectivity issue detected:", {
                  online_status: navigator.onLine,
                  error_message: profilesError.message,
                  retry_count: retryCount
                });

                // Show user-friendly message for network issues
                if (!navigator.onLine) {
                  console.error("📡 Device appears to be offline - check internet connection");
                  // Could add a toast notification here if needed:
                  // toast.error("You appear to be offline. Please check your internet connection.");
                } else {
                  console.error("🔌 Network request failed despite being online - possible server connectivity issue");
                }
              }

              // If it's a connection error and we haven't retried too many times, try again
              if (retryCount < 2 && isNetworkError) {
                console.log(`🔄 Retrying profile fetch (attempt ${retryCount + 1}/3) in ${(retryCount + 1)}s...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                return fetchProfiles(retryCount + 1);
              }

              console.warn(`Continuing without profile data due to error: ${profilesError.message || 'Unknown error'}`);
            } else if (profilesData) {
              profilesData.forEach((profile) => {
                profilesMap.set(profile.id, profile);
              });
              console.log(`Successfully fetched ${profilesData.length} profiles`);
            }
          } catch (innerError) {
            if (retryCount < 2) {
              console.log(`Retrying profile fetch after exception (attempt ${retryCount + 1}/3)...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
              return fetchProfiles(retryCount + 1);
            }
            throw innerError;
          }
        };

        await fetchProfiles();
      } catch (profileFetchError) {
        // Log error with proper formatting to prevent [object Object]
        console.error('Critical exception in profile fetching:', {
          message: profileFetchError instanceof Error ? profileFetchError.message : String(profileFetchError),
          stack: profileFetchError instanceof Error ? profileFetchError.stack : undefined,
          sellerIds,
          timestamp: new Date().toISOString()
        });

        logDetailedError("Critical exception in profile fetching", profileFetchError);

        console.warn("Profile fetching failed completely, books will be returned without seller information");
      }

      // Combine valid books with profile data
      const books: Book[] = validBooks.map((book: any) => {
        const profile = profilesMap.get(book.seller_id);
        const bookData: BookQueryResult = {
          ...book,
          profiles: profile
            ? {
                id: profile.id,
                name: profile.name,
                email: profile.email,
              }
            : null,
        };
        return mapBookFromDatabase(bookData);
      });

            console.log("Processed books:", books.length);
      return books;
  } catch (error) {
    logDetailedError("Error in getBooks", error);

    // Provide user-friendly error message
    const userMessage =
      error instanceof Error && error.message.includes("Failed to fetch")
        ? "Unable to connect to the book database. Please check your internet connection and try again."
        : "Failed to load books. Please try again later.";

        console.warn(`[BookQueries] ${userMessage}`, error);

    // If it's a network error, return fallback data instead of empty array
    if (error instanceof Error && (
      error.message.includes("Failed to fetch") ||
      error.message.includes("fetch") ||
      error.message.includes("network")
    )) {
      console.log("Using fallback books data due to network connectivity issues");
      return getFallbackBooks();
    }

    // For other errors, return empty array to prevent app crashes
    return [];
  }
};

export const getBookById = async (id: string): Promise<Book | null> => {
  try {
    console.log("Fetching book by ID:", id);

    // UUID validation - allow any format that looks like a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    console.log("Book ID validation:", {
      id,
      length: id?.length,
      isValidFormat: uuidRegex.test(id),
      url: window?.location?.href
    });

    if (!uuidRegex.test(id)) {
      console.error("Invalid UUID format for book ID:", {
        provided: id,
        expected: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        url: window?.location?.href
      });

      // Return null instead of throwing to let the component handle it gracefully
      return null;
    }

    const fetchBookOperation = async () => {
      // Get book first
      const { data: bookData, error: bookError } = await supabase
        .from("books")
        .select("*")
        .eq("id", id)
        .single();

      if (bookError) {
        if (bookError.code === "PGRST116") {
          return null; // Book not found
        }

        // Log error with proper formatting to prevent [object Object]
        console.error('Error fetching book:', {
          message: bookError.message || 'Unknown error',
          code: bookError.code || 'NO_CODE',
          details: bookError.details || 'No details',
          hint: bookError.hint || 'No hint',
          bookId: id,
          timestamp: new Date().toISOString()
        });

        logDetailedError("Error fetching book", bookError);

        throw new Error(
          `Failed to fetch book: ${bookError.message || "Unknown database error"}`,
        );
      }

      if (!bookData) {
        console.log("No book found with ID:", id);
        return null;
      }

      console.log("Found book data:", bookData);

      // Get seller profile separately - handle case where profile might not exist
      let profileData = null;
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, name, email")
          .eq("id", bookData.seller_id)
          .maybeSingle();

        if (profileError) {
          const errorMsg =
            profileError.message || profileError.details || "Unknown error";
          console.error("Error fetching seller profile:", {
            message: errorMsg,
            code: profileError.code,
            sellerId: bookData.seller_id,
          });
          // Continue without profile data rather than failing
        } else {
          profileData = profile;
        }
      } catch (profileFetchError) {
        console.error("Exception fetching seller profile:", {
          error: profileFetchError,
          message:
            profileFetchError instanceof Error
              ? profileFetchError.message
              : String(profileFetchError),
          sellerId: bookData.seller_id,
        });
        // Continue with null profile
      }

      console.log("Found profile data:", profileData);

      const bookWithProfile: BookQueryResult = {
        ...bookData,
        profiles: profileData
          ? {
              id: profileData.id,
              name: profileData.name,
              email: profileData.email,
            }
          : null,
      };

      const mappedBook = mapBookFromDatabase(bookWithProfile);
      console.log("Final mapped book:", mappedBook);

      return mappedBook;
    };

    // Use retry logic for network resilience
    return await retryWithConnection(fetchBookOperation, 2, 1000);
  } catch (error) {
    // Log error with proper formatting to prevent [object Object]
    console.error('Error in getBookById:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      bookId: id,
      timestamp: new Date().toISOString()
    });

    logDetailedError("Error in getBookById", error);

    if (
      error instanceof Error &&
      error.message.includes("Invalid book ID format")
    ) {
      throw error; // Re-throw validation errors
    }

    // For other errors, return null instead of throwing
    return null;
  }
};

export const getUserBooks = async (userId: string): Promise<Book[]> => {
  try {
    console.log(`[BookQueries] Fetching user books for ID: ${userId}`);

    if (!userId) {
      console.log("[BookQueries] No userId provided to getUserBooks");
      return [];
    }

    // Use fallback function with retry logic
    return await retryWithConnection(
      () => getUserBooksWithFallback(userId),
      2,
      1000,
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[BookQueries] Error in getUserBooks:`, {
      message: errorMessage,
      userId,
      error: error instanceof Error ? error.stack : error,
    });

    // Try one more time without retry wrapper as a final fallback
    try {
      console.log(`[BookQueries] Attempting final fallback for user ${userId}`);
      return await getUserBooksWithFallback(userId);
    } catch (fallbackError) {
      const fallbackMessage =
        fallbackError instanceof Error
          ? fallbackError.message
          : String(fallbackError);
      console.error(`[BookQueries] Final fallback also failed:`, {
        message: fallbackMessage,
        userId,
        error:
          fallbackError instanceof Error ? fallbackError.stack : fallbackError,
      });
      return [];
    }
  }
};

// Enhanced fallback function with better error handling
const getUserBooksWithFallback = async (userId: string): Promise<Book[]> => {
  try {
    console.log(
      `[BookQueries] getUserBooksWithFallback started for user: ${userId}`,
    );

    // Get books for user
    const { data: booksData, error: booksError } = await supabase
      .from("books")
      .select("*")
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });

    if (booksError) {
      // Log error with proper formatting
      safelog('getUserBooksWithFallback - books query failed', booksError, {
        userId,
        code: booksError.code || 'NO_CODE',
        hint: booksError.hint || 'No hint'
      });

      logDetailedError("getUserBooksWithFallback - books query failed", booksError);
      throw new Error(
        `Failed to fetch user books: ${booksError.message || "Unknown database error"}`,
      );
    }

    console.log(
      `[BookQueries] Found ${booksData?.length || 0} books for user ${userId}`,
    );

    if (!booksData || booksData.length === 0) {
      return [];
    }

    // Get user profile separately with error handling
    let profileData = null;
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        logDetailedError("getUserBooksWithFallback - profile query failed", profileError);
      } else {
        profileData = profile;
        console.log(
          `[BookQueries] Found profile for user ${userId}: ${profile?.name || "Anonymous"}`,
        );
      }
    } catch (profileFetchError) {
      logDetailedError("Exception fetching user profile", profileFetchError);
    }

    const mappedBooks = booksData.map((book: any) => {
      const bookData: BookQueryResult = {
        ...book,
        profiles: profileData || {
          id: userId,
          name: "Anonymous",
          email: "",
        },
      };
      return mapBookFromDatabase(bookData);
    });

    console.log(
      `[BookQueries] Successfully mapped ${mappedBooks.length} books for user ${userId}`,
    );
    return mappedBooks;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    safelog('BookQueries - getUserBooksWithFallback', error, {
      userId,
      errorMessage
    });

    // If it's a network error, throw it so retry can handle it
    if (
      error instanceof Error &&
      (error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError") ||
        error.message.includes("fetch") ||
        error.message.includes("timeout") ||
        error.name === "NetworkError" ||
        error.name === "TypeError")
    ) {
      console.log(
        `[BookQueries] Network error detected, allowing retry: ${error.message}`,
      );
      throw error;
    }

    return [];
  }
};
