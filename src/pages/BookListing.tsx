import { useState, useEffect, useCallback } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import BookFilters from "@/components/book-listing/BookFilters";
import BookGrid from "@/components/book-listing/BookGrid";
import { getBooks } from "@/services/book/bookQueries";
import { Book } from "@/types/book";
import { toast } from "sonner";
import { useCommit } from "@/hooks/useCommit";
import { useAuth } from "@/contexts/AuthContext";
import { clearAllBrowseBooks } from "@/utils/clearBrowseBooks";
import { Button } from "@/components/ui/button";

const BookListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClearingBooks, setIsClearingBooks] = useState(false);

  // Commit functionality
  const { commitBook } = useCommit();
  const { user } = useAuth();

  // Filter states
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "",
  );
  const [selectedCondition, setSelectedCondition] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedUniversityYear, setSelectedUniversityYear] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [bookType, setBookType] = useState<"all" | "school" | "university">(
    "all",
  );

  // Memoize loadBooks function to prevent infinite loops
  const loadBooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const searchQuery = searchParams.get("search") || "";
      const category = searchParams.get("category") || "";
      const grade = searchParams.get("grade") || "";
      const universityYear = searchParams.get("universityYear") || "";

      const filters: {
        search?: string;
        category?: string;
        condition?: string;
        grade?: string;
        universityYear?: string;
        university?: string;
        minPrice?: number;
        maxPrice?: number;
      } = {};

      if (searchQuery) filters.search = searchQuery;
      if (category) filters.category = category;
      if (selectedCondition) filters.condition = selectedCondition;
      if (grade) filters.grade = grade;
      if (universityYear) filters.universityYear = universityYear;
      if (selectedUniversity) filters.university = selectedUniversity;

      if (priceRange[0] > 0) filters.minPrice = priceRange[0];
      if (priceRange[1] < 1000) filters.maxPrice = priceRange[1];

      console.log("Applied filters:", filters);

      const loadedBooks = await getBooks(filters);
      console.log("Loaded books count:", loadedBooks.length);

      // Ensure we have an array
      const booksArray = Array.isArray(loadedBooks) ? loadedBooks : [];
      setBooks(booksArray);

      if (booksArray.length === 0) {
        console.log("No books found with current filters");
      }
    } catch (error) {
      const errorDetails = {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : "Unknown",
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      };

      console.error("[BookListing] Error loading books:", errorDetails);

      const userMessage =
        error instanceof Error && error.message.includes("Failed to fetch")
          ? "Unable to connect to the book database. Please check your internet connection and try again."
          : "Failed to load books. Please try again later.";

      toast.error(userMessage);
      setBooks([]);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, selectedCondition, selectedUniversity, priceRange]);

  // Initial load
  useEffect(() => {
    console.log("BookListing component mounted");
    loadBooks();
  }, [loadBooks]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Search submitted with query:", searchQuery);
    updateFilters();
  };

  const updateFilters = useCallback(() => {
    const newSearchParams = new URLSearchParams();

    if (searchQuery.trim()) {
      newSearchParams.set("search", searchQuery.trim());
    }
    if (selectedCategory) {
      newSearchParams.set("category", selectedCategory);
    }
    if (selectedGrade) {
      newSearchParams.set("grade", selectedGrade);
    }
    if (selectedUniversityYear) {
      newSearchParams.set("universityYear", selectedUniversityYear);
    }

    setSearchParams(newSearchParams);
  }, [
    searchQuery,
    selectedCategory,
    selectedGrade,
    selectedUniversityYear,
    setSearchParams,
  ]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedCondition("");
    setSelectedGrade("");
    setSelectedUniversityYear("");
    setSelectedUniversity("");
    setPriceRange([0, 1000]);
    setBookType("all");
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const handleCommitBook = async (bookId: string) => {
    try {
      await commitBook(bookId);
      // Reload books after commit
      loadBooks();
    } catch (error) {
      console.error(
        "Failed to commit book:",
        error instanceof Error ? error.message : String(error),
      );
      toast.error("Failed to commit sale. Please try again.");
    }
  };

  const handleClearAllBooks = async () => {
    if (
      !window.confirm(
        "Are you sure you want to clear ALL books from Browse Books? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsClearingBooks(true);
    try {
      const result = await clearAllBrowseBooks();
      if (result.success) {
        toast.success(result.message);
        setBooks([]); // Clear the local state
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error(
        "Failed to clear books:",
        error instanceof Error ? error.message : String(error),
      );
      toast.error("Failed to clear books");
    } finally {
      setIsClearingBooks(false);
    }
  };

  return (
    <Layout>
      <SEO
        title="Browse Textbooks - ReBooked Solutions"
        description="Find affordable used textbooks for your studies. Browse our collection of university and school books from verified sellers."
        keywords="textbooks, used books, university books, school books, study materials"
        url="https://www.rebookedsolutions.co.za/books"
      />

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-8 px-2 sm:px-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-book-800 mb-4 sm:mb-0">
            Browse Books
          </h1>
          {user?.email === "admin@rebookedsolutions.co.za" && (
            <Button
              onClick={handleClearAllBooks}
              disabled={isClearingBooks}
              variant="destructive"
              size="sm"
            >
              {isClearingBooks ? "Clearing..." : "Clear All Books"}
            </Button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
          <BookFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedCondition={selectedCondition}
            setSelectedCondition={setSelectedCondition}
            selectedGrade={selectedGrade}
            setSelectedGrade={setSelectedGrade}
            selectedUniversityYear={selectedUniversityYear}
            setSelectedUniversityYear={setSelectedUniversityYear}
            selectedUniversity={selectedUniversity}
            setSelectedUniversity={setSelectedUniversity}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            bookType={bookType}
            setBookType={setBookType}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            onSearch={handleSearch}
            onUpdateFilters={updateFilters}
            onClearFilters={clearFilters}
          />

          <BookGrid
            books={books}
            isLoading={isLoading}
            onClearFilters={clearFilters}
            currentUserId={user?.id}
            onCommitBook={handleCommitBook}
          />
        </div>
      </div>
    </Layout>
  );
};

export default BookListing;
