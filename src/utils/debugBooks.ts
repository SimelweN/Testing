import { supabase } from "@/integrations/supabase/client";

export const debugBookFetching = async () => {
  console.log("🔍 Starting book debugging...");

  try {
    // First, get total count of books
    const { count: totalBooks, error: countError } = await supabase
      .from("books")
      .select("*", { count: "exact", head: true });

    console.log("📊 Total books in database:", totalBooks);

    if (countError) {
      console.error("❌ Error counting books:", countError);
      return;
    }

    // Get all books with seller profiles
    const { data: allBooks, error: booksError } = await supabase
      .from("books")
      .select(`
        id,
        title,
        sold,
        seller_id,
        created_at,
        seller_profile:profiles!seller_id(
          id,
          pickup_address
        )
      `)
      .order("created_at", { ascending: false });

    if (booksError) {
      console.error("❌ Error fetching books:", booksError);
      return;
    }

    console.log("📚 Books fetched from database:", allBooks?.length || 0);

    if (!allBooks || allBooks.length === 0) {
      console.log("❌ No books found in database");
      return;
    }

    // Analyze the books
    const soldBooks = allBooks.filter(book => book.sold);
    const availableBooks = allBooks.filter(book => !book.sold);
    
    console.log("📈 Books analysis:");
    console.log("  - Total books:", allBooks.length);
    console.log("  - Sold books:", soldBooks.length);
    console.log("  - Available books:", availableBooks.length);

    // Check seller profiles
    const booksWithoutSeller = availableBooks.filter(book => !book.seller_profile);
    const booksWithoutPickupAddress = availableBooks.filter(book => 
      book.seller_profile && !book.seller_profile.pickup_address
    );
    const booksWithInvalidPickupAddress = availableBooks.filter(book => {
      if (!book.seller_profile?.pickup_address) return false;
      const addr = book.seller_profile.pickup_address;
      const streetField = addr.streetAddress || addr.street;
      return !(streetField && addr.city && addr.province && addr.postalCode);
    });

    console.log("🚫 Filtering analysis:");
    console.log("  - Books without seller profile:", booksWithoutSeller.length);
    console.log("  - Books without pickup address:", booksWithoutPickupAddress.length);
    console.log("  - Books with invalid pickup address:", booksWithInvalidPickupAddress.length);

    // Show details of problematic books
    if (booksWithoutSeller.length > 0) {
      console.log("📝 Books without seller profile:", booksWithoutSeller.map(b => ({
        id: b.id,
        title: b.title,
        seller_id: b.seller_id
      })));
    }

    if (booksWithoutPickupAddress.length > 0) {
      console.log("📝 Books without pickup address:", booksWithoutPickupAddress.map(b => ({
        id: b.id,
        title: b.title,
        seller_id: b.seller_id
      })));
    }

    if (booksWithInvalidPickupAddress.length > 0) {
      console.log("📝 Books with invalid pickup address:", booksWithInvalidPickupAddress.map(b => ({
        id: b.id,
        title: b.title,
        seller_id: b.seller_id,
        pickup_address: b.seller_profile?.pickup_address
      })));
    }

    // Calculate final valid books count
    const validBooks = availableBooks.filter(book => {
      if (!book.seller_profile?.pickup_address) return false;
      const addr = book.seller_profile.pickup_address;
      const streetField = addr.streetAddress || addr.street;
      return !!(streetField && addr.city && addr.province && addr.postalCode);
    });

    console.log("✅ Final valid books count:", validBooks.length);

    return {
      totalBooks,
      allBooks: allBooks.length,
      availableBooks: availableBooks.length,
      validBooks: validBooks.length,
      filterReasons: {
        soldBooks: soldBooks.length,
        missingSellerProfile: booksWithoutSeller.length,
        missingPickupAddress: booksWithoutPickupAddress.length,
        invalidPickupAddress: booksWithInvalidPickupAddress.length
      }
    };

  } catch (error) {
    console.error("💥 Error debugging books:", error);
    return null;
  }
};

// Helper function to fix books by setting up missing pickup addresses
export const fixBooksWithMissingAddresses = async () => {
  console.log("🔧 Attempting to fix books with missing addresses...");

  try {
    // Get books without proper pickup addresses
    const { data: books, error } = await supabase
      .from("books")
      .select(`
        id,
        title,
        seller_id,
        province,
        seller_profile:profiles!seller_id(
          id,
          pickup_address
        )
      `)
      .eq("sold", false);

    if (error || !books) {
      console.error("❌ Error fetching books for fixing:", error);
      return;
    }

    const booksToFix = books.filter(book => {
      if (!book.seller_profile) return false;
      const addr = book.seller_profile.pickup_address;
      if (!addr) return true;
      
      const streetField = addr.streetAddress || addr.street;
      return !(streetField && addr.city && addr.province && addr.postalCode);
    });

    console.log(`🔧 Found ${booksToFix.length} books that need address fixes`);

    for (const book of booksToFix) {
      // Create a default pickup address based on book province
      const defaultAddress = {
        street: "Address Not Set",
        streetAddress: "Address Not Set",
        city: book.province === "Western Cape" ? "Cape Town" : 
              book.province === "Gauteng" ? "Johannesburg" :
              book.province === "KwaZulu-Natal" ? "Durban" : "Unknown City",
        province: book.province || "Western Cape",
        postalCode: book.province === "Western Cape" ? "8000" : 
                   book.province === "Gauteng" ? "2000" :
                   book.province === "KwaZulu-Natal" ? "4000" : "0000"
      };

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ pickup_address: defaultAddress })
        .eq("id", book.seller_id);

      if (updateError) {
        console.error(`❌ Failed to update address for seller ${book.seller_id}:`, updateError);
      } else {
        console.log(`✅ Updated address for seller ${book.seller_id} (book: ${book.title})`);
      }
    }

    console.log("🔧 Address fixing completed");
    return booksToFix.length;

  } catch (error) {
    console.error("💥 Error fixing books:", error);
    return 0;
  }
};
