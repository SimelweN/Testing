import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, School, GraduationCap, MapPin, Clock } from "lucide-react";
import { Book } from "@/types/book";
import { toast } from "sonner";

interface BookGridProps {
  books: Book[];
  isLoading: boolean;
  onClearFilters: () => void;
  currentUserId?: string | null;
  onCommitBook?: (bookId: string) => Promise<void>;
}

const BookGrid = ({
  books,
  isLoading,
  onClearFilters,
  currentUserId,
  onCommitBook,
}: BookGridProps) => {
  const handleCommit = async (bookId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!onCommitBook) return;

    try {
      await onCommitBook(bookId);
      toast.success("Sale committed successfully!");
    } catch (error) {
      console.error("Failed to commit sale:", error);
      toast.error("Failed to commit sale. Please try again.");
    }
  };
  if (isLoading) {
    return (
      <div className="lg:w-3/4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-book-600"></div>
        </div>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="lg:w-3/4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-book-300 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No books found</h3>
          <p className="text-gray-500 mb-6">
            Try adjusting your filters or search criteria
          </p>
          <Button
            onClick={onClearFilters}
            variant="outline"
            className="border-book-600 text-book-600"
          >
            Clear all filters
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:w-3/4">
      <div className="mb-4">
        <p className="text-gray-600">
          Found {books.length} book{books.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((book) => {
          console.log("Rendering book:", book.id, book.title);
          const isUnavailable =
            (book as Book & { status?: string }).status === "unavailable";
          const isPendingCommit =
            (book as Book & { status?: string }).status === "pending_commit";
          const isOwner = currentUserId && book.seller?.id === currentUserId;

          return (
            <div
              key={book.id}
              className={`bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-200 book-card-hover flex flex-col relative ${
                isUnavailable ? "opacity-60 grayscale" : ""
              }`}
            >
              {/* Unavailable Overlay */}
              {isUnavailable && (
                <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-10">
                  <div className="bg-white rounded-lg p-3 m-2 text-center shadow-lg">
                    <div className="flex items-center justify-center mb-2">
                      <MapPin className="h-4 w-4 text-orange-600 mr-1" />
                      <Badge
                        variant="secondary"
                        className="bg-orange-100 text-orange-800 text-xs"
                      >
                        Unavailable
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-700">
                      Seller must add a pickup address to activate this listing
                    </p>
                  </div>
                </div>
              )}

              {isUnavailable ? (
                <div className="block flex-1">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={book.imageUrl}
                      alt={book.title}
                      width="400"
                      height="300"
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        console.log("Image failed to load for book:", book.id);
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400&h=300&fit=crop&auto=format&q=80";
                      }}
                    />
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                      {book.description}
                    </p>

                    {/* Province/Location display */}
                    {book.province && (
                      <div className="flex items-center text-xs text-gray-500 mb-2">
                        <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{book.province}</span>
                      </div>
                    )}
                    {book.sold && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          SOLD
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-grow flex flex-col">
                    <h3 className="font-bold text-lg mb-1 text-book-800 line-clamp-1">
                      {book.title}
                    </h3>
                    <p className="text-gray-600 mb-2">{book.author}</p>
                    <p className="text-gray-500 text-sm mb-auto line-clamp-2">
                      {book.description}
                    </p>
                    <div className="flex flex-wrap items-center justify-between mt-4 gap-1">
                      <span className="bg-book-100 text-book-800 px-2 py-1 rounded text-xs font-medium">
                        {book.condition}
                      </span>
                      {book.grade && (
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-medium flex items-center">
                          <School className="h-3 w-3 mr-1" />
                          {book.grade}
                        </span>
                      )}
                      {book.universityYear && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium flex items-center">
                          <GraduationCap className="h-3 w-3 mr-1" />
                          {book.universityYear}
                        </span>
                      )}
                      <span className="text-gray-500 text-xs">
                        {book.category}
                      </span>
                    </div>

                    {/* Commit Button for Seller - even for unavailable books */}
                    {isPendingCommit && isOwner && onCommitBook && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <Button
                          onClick={(e) => handleCommit(book.id, e)}
                          className="w-full bg-book-600 hover:bg-book-700 text-white"
                          size="sm"
                        >
                          <Clock className="h-3 w-3 mr-2" />
                          Commit Sale
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Link
                  to={`/books/${book.id}`}
                  className="block flex-1"
                  onClick={(e) => {
                    if (!book.id) {
                      e.preventDefault();
                      console.error("Book ID is missing for book:", book.title);
                      return;
                    }
                    console.log("Navigating to book:", book.id);
                  }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={book.imageUrl}
                      alt={book.title}
                      width="400"
                      height="300"
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        console.log("Image failed to load for book:", book.id);
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400&h=300&fit=crop&auto=format&q=80";
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-sm font-semibold text-book-800">
                      R{book.price.toLocaleString()}
                    </div>
                    {book.sold && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          SOLD
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-grow flex flex-col">
                    <h3 className="font-bold text-lg mb-1 text-book-800 line-clamp-1">
                      {book.title}
                    </h3>
                    <p className="text-gray-600 mb-2">{book.author}</p>
                    <p className="text-gray-500 text-sm mb-auto line-clamp-2">
                      {book.description}
                    </p>
                    <div className="flex flex-wrap items-center justify-between mt-4 gap-1">
                      <span className="bg-book-100 text-book-800 px-2 py-1 rounded text-xs font-medium">
                        {book.condition}
                      </span>
                      {book.grade && (
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-medium flex items-center">
                          <School className="h-3 w-3 mr-1" />
                          {book.grade}
                        </span>
                      )}
                      {book.universityYear && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium flex items-center">
                          <GraduationCap className="h-3 w-3 mr-1" />
                          {book.universityYear}
                        </span>
                      )}
                      <span className="text-gray-500 text-xs">
                        {book.category}
                      </span>
                    </div>

                    {/* Commit Button for Seller */}
                    {isPendingCommit && isOwner && onCommitBook && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <Button
                          onClick={(e) => handleCommit(book.id, e)}
                          className="w-full bg-book-600 hover:bg-book-700 text-white"
                          size="sm"
                        >
                          <Clock className="h-3 w-3 mr-2" />
                          Commit Sale
                        </Button>
                      </div>
                    )}
                  </div>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookGrid;
