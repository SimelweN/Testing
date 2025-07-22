import { supabase } from "@/integrations/supabase/client";

export const testDatabaseConnection = async () => {
  console.log("🔍 Testing database connection...");
  
  try {
    // Test 1: Basic connection
    console.log("1. Testing basic Supabase connection...");
    const { data: healthCheck, error: healthError } = await supabase
      .from("books")
      .select("count", { count: "exact", head: true });
    
    if (healthError) {
      console.error("❌ Database connection failed:", healthError);
      return { success: false, error: healthError.message };
    }
    
    console.log(`✅ Database connected! Total books count: ${healthCheck || 0}`);
    
    // Test 2: Fetch actual books
    console.log("2. Testing books query...");
    const { data: books, error: booksError } = await supabase
      .from("books")
      .select("*")
      .limit(5);
    
    if (booksError) {
      console.error("❌ Books query failed:", booksError);
      return { success: false, error: booksError.message };
    }
    
    console.log(`✅ Books query successful! Found ${books?.length || 0} books`);
    
    if (books && books.length > 0) {
      console.log("📚 Sample book:", books[0]);
    } else {
      console.log("📭 No books found in database");
    }
    
    // Test 3: Check if any books exist at all (including sold ones)
    console.log("3. Checking ALL books in database (including sold)...");
    const { data: allBooks, error: allBooksError } = await supabase
      .from("books")
      .select("id, title, sold, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (allBooksError) {
      console.error("❌ All books query failed:", allBooksError);
    } else {
      const unsoldBooks = allBooks?.filter(book => !book.sold) || [];
      const soldBooks = allBooks?.filter(book => book.sold) || [];
      console.log(`📊 Database stats:`);
      console.log(`   Total books: ${allBooks?.length || 0}`);
      console.log(`   Unsold books: ${unsoldBooks.length}`);
      console.log(`   Sold books: ${soldBooks.length}`);

      if (allBooks && allBooks.length > 0) {
        console.log("📚 Recent books in database:");
        allBooks.slice(0, 10).forEach((book, index) => {
          console.log(`   ${index + 1}. "${book.title}" (${book.sold ? 'SOLD' : 'AVAILABLE'}) - ${book.created_at}`);
        });
      }
    }
    
    return { 
      success: true, 
      totalBooks: books?.length || 0,
      hasData: (books?.length || 0) > 0
    };
    
  } catch (error) {
    console.error("❌ Database test failed with exception:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
};
