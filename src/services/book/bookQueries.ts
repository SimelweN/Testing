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
import { safeLogError } from "@/utils/errorHandling";
import { retryWithConnection } from "@/utils/connectionHealthCheck";

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
  safeLogError(`BookQueries - ${context}`, error);

  // Also log to our error utility (but don't spam it)
  if (logError && bookQueryErrorCount <= 3) {
    logError(context, error);
  }
};

export const getBooks = async (filters?: BookFilters): Promise<Book[]> => {
  try {
    console.log("Fetching books with filters:", filters);

    const fetchBooksOperation = async () => {
      // First get books
      let query = supabase
        .from("books")
        .select("*")
        .eq("sold", false)
        .order("created_at", { ascending: false });

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
        if (filters.minPrice !== undefined) {
          query = query.gte("price", filters.minPrice);
        }
        if (filters.maxPrice !== undefined) {
          query = query.lte("price", filters.maxPrice);
        }
      }

      const { data: booksData, error: booksError } = await query;

      if (booksError) {
        logDetailedError("Books query failed", booksError);
        throw new Error(
          `Failed to fetch books: ${booksError.message || "Unknown database error"}`,
        );
      }

      if (!booksData || booksData.length === 0) {
        console.log("No books found");
        return [];
      }

      // Get unique seller IDs
      const sellerIds = [...new Set(booksData.map((book) => book.seller_id))];

      // Fetch seller profiles separately with error handling
      let profilesMap = new Map();
      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, name, email")
          .in("id", sellerIds);

        if (profilesError) {
          logDetailedError("Error fetching profiles", profilesError);
          // Continue without profile data rather than failing completely
        } else if (profilesData) {
          profilesData.forEach((profile) => {
            profilesMap.set(profile.id, profile);
          });
        }
      } catch (profileFetchError) {
        logDetailedError("Exception fetching profiles", profileFetchError);
        // Continue with empty profiles map
      }

      // Combine books with profile data
      const books: Book[] = booksData.map((book: any) => {
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
    };

    // Use retry logic for network resilience
    return await retryWithConnection(fetchBooksOperation, 2, 1000);
  } catch (error) {
    logDetailedError("Error in getBooks", error);

    // Provide user-friendly error message
    const userMessage =
      error instanceof Error && error.message.includes("Failed to fetch")
        ? "Unable to connect to the book database. Please check your internet connection and try again."
        : "Failed to load books. Please try again later.";

    console.warn(`[BookQueries] ${userMessage}`, error);

    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
};

export const getBookById = async (id: string): Promise<Book | null> => {
  try {
    console.log("Fetching book by ID:", id);

    // Validate UUID format before making database call
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      const error = new Error(
        "Invalid book ID format. Please check the link and try again.",
      );
      logDetailedError("Invalid UUID format for book ID", { id, error });
      throw error;
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
          logDetailedError("Error fetching seller profile", profileError);
          // Continue without profile data rather than failing
        } else {
          profileData = profile;
        }
      } catch (profileFetchError) {
        logDetailedError(
          "Exception fetching seller profile",
          profileFetchError,
        );
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
      logDetailedError(
        "getUserBooksWithFallback - books query failed",
        booksError,
      );
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
        logDetailedError(
          "getUserBooksWithFallback - profile query failed",
          profileError,
        );
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
    console.error(`[BookQueries] Error in getUserBooksWithFallback:`, {
      message: errorMessage,
      userId,
      error: error instanceof Error ? error.stack : error,
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
