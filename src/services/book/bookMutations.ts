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

    // Fetch province from user's pickup address
    let province = null;
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("pickup_address")
        .eq("id", user.id)
        .single();

      if (profileData?.pickup_address) {
        // Check if pickup_address has province property
        const pickupAddress = profileData.pickup_address as any;
        if (pickupAddress?.province) {
          province = pickupAddress.province;
        } else if (typeof pickupAddress === "string") {
          // If pickup_address is a string, try to extract province from it
          // This is a fallback for older address formats
          const addressStr = pickupAddress.toLowerCase();
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
    } catch (addressError) {
      console.warn("Could not fetch user address for province:", addressError);
      // Continue without province - it's not critical for book creation
    }

    // Create book data without province first (safer approach)
    const bookDataWithoutProvince = {
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
    };

    // Store province for future use when database schema is updated
    if (province) {
      console.log("📍 Province extracted from user address:", province);
      console.log("💡 Province will be stored once database schema is updated");
      // TODO: Add province to book data when 'province' column is available in production
    }

    const { data: book, error } = await supabase
      .from("books")
      .insert([bookDataWithoutProvince])
      .select()
      .single();

    if (error) {
      console.error("Error creating book:", error.message || String(error));
      handleBookServiceError(error, "create book");
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
      console.error("Error updating book:", error.message || String(error));
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

export const deleteBook = async (bookId: string): Promise<void> => {
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
      console.error("Book not found:", fetchError);
      throw new Error("Book not found");
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
