import { supabase } from "@/integrations/supabase/client";
import { Book, BookFormData } from "@/types/book";
import { mapBookFromDatabase } from "./bookMapper";
import { handleBookServiceError } from "./bookErrorHandler";
import { BookQueryResult } from "./bookTypes";
import { ActivityService } from "@/services/activityService";

export const createBook = async (bookData: BookFormData): Promise<Book> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Fetch province, pickup address, and banking info from user profile
    let province = null;
    let pickupAddress = null;
    let paystackSubaccountCode = null;

    try {
      // First, try to get encrypted address from profile
      let encryptedAddressFound = false;

      try {
        const { data: encryptedAddressData, error: decryptError } = await supabase.functions.invoke('decrypt-address', {
          body: {
            fetch: {
              table: 'profiles',
              target_id: user.id,
              address_type: 'pickup'
            }
          }
        });

        if (encryptedAddressData && encryptedAddressData.success && encryptedAddressData.data) {
          pickupAddress = encryptedAddressData.data;
          encryptedAddressFound = true;
          console.log("✅ Using encrypted pickup address from profile for book listing");

          // Extract province from encrypted address
          if (pickupAddress?.province) {
            province = pickupAddress.province;
          }
        }
      } catch (error) {
        console.warn("Could not decrypt address, falling back to plaintext:", error);
      }

      // Fallback to plaintext address if encryption failed
      if (!encryptedAddressFound) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("pickup_address, subaccount_code")
          .eq("id", user.id)
          .single();

        if (profileData?.pickup_address) {
          pickupAddress = profileData.pickup_address;
          console.log("⚠️ Using plaintext pickup address from profile for book listing");

          // Extract province from pickup address
          const addressObj = profileData.pickup_address as any;
          if (addressObj?.province) {
            province = addressObj.province;
          } else if (typeof addressObj === "string") {
            // If pickup_address is a string, try to extract province from it
            // This is a fallback for older address formats
            const addressStr = addressObj.toLowerCase();
            if (addressStr.includes("western cape")) province = "Western Cape";
            else if (addressStr.includes("gauteng")) province = "Gauteng";
            else if (addressStr.includes("kwazulu")) province = "KwaZulu-Natal";
            else if (addressStr.includes("eastern cape"))
              province = "Eastern Cape";
            else if (addressStr.includes("free state")) province = "Free State";
            else if (addressStr.includes("limpopo")) province = "Limpopo";
            else if (addressStr.includes("mpumalanga")) province = "Mpumalanga";
            else if (addressStr.includes("northern cape"))
              province = "Northern Cape";
            else if (addressStr.includes("north west")) province = "North West";
          }
        }

        // Get Paystack subaccount code if available
        if (profileData?.subaccount_code) {
          paystackSubaccountCode = profileData.subaccount_code;
        }
      } else {
        // Get subaccount code from separate query when using encrypted address
        const { data: bankingData } = await supabase
          .from("profiles")
          .select("subaccount_code")
          .eq("id", user.id)
          .single();

        if (bankingData?.subaccount_code) {
          paystackSubaccountCode = bankingData.subaccount_code;
        }
      }
    } catch (addressError) {
      console.warn("Could not fetch user address for province:", addressError);
      // Continue without province - it's not critical for book creation
    }

    // Create book data with all required fields
    const fullBookData = {
      seller_id: user.id,
      title: bookData.title,
      author: bookData.author,
      description: bookData.description,
      price: bookData.price,
      category: bookData.category,
      condition: bookData.condition,
      image_url: bookData.imageUrl,
      front_cover: bookData.frontCover,
      back_cover: bookData.backCover,
      inside_pages: bookData.insidePages,
      grade: bookData.grade,
      university_year: bookData.universityYear,
      province: province,
      pickup_address: pickupAddress,
      seller_subaccount_code: paystackSubaccountCode,
      requires_banking_setup: false, // Set to false since user passed banking requirements
    };

    console.log("📍 Creating book with address and banking info:", {
      province,
      hasPickupAddress: !!pickupAddress,
      hasSubaccountCode: !!paystackSubaccountCode,
    });

    const { data: book, error } = await supabase
      .from("books")
      .insert([fullBookData])
      .select()
      .single();

    if (error) {
      handleBookServiceError(error, "create book");
    }

    // Encrypt and save pickup address to books table if we have an address
    if (pickupAddress && book.id) {
      try {
        const { data: encryptResult, error: encryptError } = await supabase.functions.invoke('encrypt-address', {
          body: {
            object: pickupAddress,
            save: {
              table: 'books',
              target_id: book.id,
              address_type: 'pickup'
            }
          }
        });

        if (encryptResult && encryptResult.success) {
          console.log("✅ Book pickup address encrypted and saved successfully");
        } else {
          console.warn("⚠️ Failed to encrypt book pickup address:", encryptResult?.error);
        }
      } catch (encryptError) {
        console.warn("⚠️ Exception encrypting book pickup address:", encryptError);
      }
    }

    // Fetch seller profile
    const { data: seller } = await supabase
      .from("profiles")
      .select("id, name, email")
      .eq("id", user.id)
      .single();

    const bookWithProfile: BookQueryResult = {
      ...book,
      profiles: seller
        ? {
            id: seller.id,
            name: seller.name,
            email: seller.email,
          }
        : null,
    };

    const mappedBook = mapBookFromDatabase(bookWithProfile);

    // Log activity for book listing
    try {
      await ActivityService.logBookListing(
        user.id,
        book.id,
        bookData.title,
        bookData.price,
      );
      console.log("✅ Activity logged for book listing:", book.id);
    } catch (activityError) {
      console.warn(
        "⚠️ Failed to log activity for book listing:",
        activityError,
      );
      // Don't throw here - book creation was successful, activity logging is secondary
    }

    return mappedBook;
  } catch (error) {
    console.error(
      "Error in createBook:",
      error instanceof Error ? error.message : String(error),
    );
    handleBookServiceError(error, "create book");
    throw error; // This line will never be reached due to handleBookServiceError throwing, but TypeScript needs it
  }
};

export const updateBook = async (
  bookId: string,
  bookData: Partial<BookFormData>,
): Promise<Book | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // First verify the user owns this book
    const { data: existingBook, error: fetchError } = await supabase
      .from("books")
      .select("seller_id")
      .eq("id", bookId)
      .single();

    if (fetchError || !existingBook) {
      throw new Error("Book not found");
    }

    if (existingBook.seller_id !== user.id) {
      throw new Error("User not authorized to edit this book");
    }

    const updateData: any = {};

    if (bookData.title !== undefined) updateData.title = bookData.title;
    if (bookData.author !== undefined) updateData.author = bookData.author;
    if (bookData.description !== undefined)
      updateData.description = bookData.description;
    if (bookData.price !== undefined) updateData.price = bookData.price;
    if (bookData.category !== undefined)
      updateData.category = bookData.category;
    if (bookData.condition !== undefined)
      updateData.condition = bookData.condition;
    if (bookData.imageUrl !== undefined)
      updateData.image_url = bookData.imageUrl;
    if (bookData.frontCover !== undefined)
      updateData.front_cover = bookData.frontCover;
    if (bookData.backCover !== undefined)
      updateData.back_cover = bookData.backCover;
    if (bookData.insidePages !== undefined)
      updateData.inside_pages = bookData.insidePages;
    if (bookData.grade !== undefined) updateData.grade = bookData.grade;
    if (bookData.universityYear !== undefined)
      updateData.university_year = bookData.universityYear;

    const { data: book, error } = await supabase
      .from("books")
      .update(updateData)
      .eq("id", bookId)
      .select()
      .single();

    if (error) {
      handleBookServiceError(error, "update book");
    }

    // Fetch seller profile
    const { data: seller } = await supabase
      .from("profiles")
      .select("id, name, email")
      .eq("id", book.seller_id)
      .single();

    const bookWithProfile: BookQueryResult = {
      ...book,
      profiles: seller
        ? {
            id: seller.id,
            name: seller.name,
            email: seller.email,
          }
        : null,
    };

    return mapBookFromDatabase(bookWithProfile);
  } catch (error) {
    console.error(
      "Error in updateBook:",
      error instanceof Error ? error.message : String(error),
    );
    handleBookServiceError(error, "update book");
    return null; // This line will never be reached due to handleBookServiceError throwing, but TypeScript needs it
  }
};

export const deleteBook = async (bookId: string, forceDelete: boolean = false): Promise<void> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    console.log("Attempting to delete book:", bookId);

    // First verify the user owns this book or is an admin
    const { data: existingBook, error: fetchError } = await supabase
      .from("books")
      .select("seller_id, title")
      .eq("id", bookId)
      .single();

    if (fetchError || !existingBook) {
      handleBookServiceError(
        fetchError || new Error("Book not found"),
        "delete book - book not found",
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.is_admin || false;
    const isOwner = existingBook.seller_id === user.id;

    if (!isAdmin && !isOwner) {
      throw new Error("User not authorized to delete this book");
    }

    console.log("User authorized to delete book. Proceeding with deletion...");

    // Delete related records first to maintain referential integrity

    // Try to check for orders with book_id column first (if it exists)
    let relatedOrders: any[] = [];

    try {
      const { data: directOrders, error: directOrdersError } = await supabase
        .from("orders")
        .select("id, status, book_id")
        .eq("book_id", bookId);

      if (!directOrdersError && directOrders) {
        relatedOrders = directOrders;
        console.log(`Found ${relatedOrders.length} orders with direct book_id reference`);
      }
    } catch (error) {
      console.log("No direct book_id column in orders, checking items JSON...");
    }

    // If no direct book_id column, check items JSON
    if (relatedOrders.length === 0) {
      const { data: allOrders, error: ordersCheckError } = await supabase
        .from("orders")
        .select("id, status, items");

      if (!ordersCheckError && allOrders) {
        relatedOrders = allOrders.filter(order => {
          if (!order.items || !Array.isArray(order.items)) return false;
          return order.items.some((item: any) => item.book_id === bookId);
        });
        console.log(`Found ${relatedOrders.length} orders with book_id in items JSON`);
      }
    }

    // If there are active orders, handle based on force delete flag
    const activeOrders = relatedOrders.filter(order =>
      !["cancelled", "refunded", "declined", "completed"].includes(order.status)
    );

    if (activeOrders.length > 0) {
      if (!forceDelete) {
        throw new Error(
          `Cannot delete book: There are ${activeOrders.length} active order(s) for this book. ` +
          "Please wait for orders to complete or be cancelled before deleting."
        );
      }

      // Admin force delete: Cancel active orders first
      if (isAdmin && forceDelete) {
        console.log(`Admin force delete: Cancelling ${activeOrders.length} active orders...`);

        for (const order of activeOrders) {
          try {
            // Cancel the order by updating its status
            const { error: cancelError } = await supabase
              .from("orders")
              .update({
                status: "cancelled",
                cancelled_at: new Date().toISOString(),
                cancellation_reason: `Book deleted by admin - Book ID: ${bookId}`
              })
              .eq("id", order.id);

            if (cancelError) {
              console.warn(`Failed to cancel order ${order.id}:`, cancelError);
            } else {
              console.log(`Successfully cancelled order ${order.id}`);
            }
          } catch (error) {
            console.warn(`Error cancelling order ${order.id}:`, error);
          }
        }

        console.log("All active orders cancelled. Proceeding with book deletion...");
      } else {
        throw new Error(
          `Cannot force delete: Only admins can force delete books with active orders.`
        );
      }
    }

    // Try to delete orders that reference this book (for cleanup)
    if (relatedOrders.length > 0) {
      try {
        const { error: ordersDeleteError } = await supabase
          .from("orders")
          .delete()
          .eq("book_id", bookId);

        if (ordersDeleteError) {
          console.log("Could not delete orders by book_id, they might be in items JSON only");
        } else {
          console.log(`Deleted ${relatedOrders.length} completed orders`);
        }
      } catch (error) {
        console.log("Orders cleanup failed, proceeding with book deletion");
      }
    }

    // Delete any reports related to this book
    const { error: reportsDeleteError } = await supabase
      .from("reports")
      .delete()
      .eq("book_id", bookId);

    if (reportsDeleteError) {
      console.warn("Error deleting related reports:", reportsDeleteError);
      // Continue with deletion even if reports cleanup fails
    }

    // Delete any transactions related to this book
    const { error: transactionsDeleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("book_id", bookId);

    if (transactionsDeleteError) {
      console.warn(
        "Error deleting related transactions:",
        transactionsDeleteError,
      );
      // Continue with deletion even if transactions cleanup fails
    }

    // Finally delete the book itself
    const { error: deleteError } = await supabase
      .from("books")
      .delete()
      .eq("id", bookId);

    if (deleteError) {
      console.error(
        "Error deleting book:",
        deleteError.message || String(deleteError),
      );
      throw new Error(`Failed to delete book: ${deleteError.message}`);
    }

    console.log("Book deleted successfully:", existingBook.title);
  } catch (error) {
    console.error(
      "Error in deleteBook:",
      error instanceof Error ? error.message : String(error),
    );
    handleBookServiceError(error, "delete book");
    throw error; // This line will never be reached due to handleBookServiceError throwing, but TypeScript needs it
  }
};
