import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookIcon, Calendar, Edit, Trash2, Eye } from "lucide-react";
import { Book } from "@/types/book";
import { useNavigate } from "react-router-dom";
import BookNotSellingHelp from "@/components/BookNotSellingHelp";

interface MobileListingsViewProps {
  activeListings: Book[];
  isLoading: boolean;
  onEditBook: (bookId: string) => void;
  onDeleteBook: (bookId: string, bookTitle: string) => Promise<void>;
}

const MobileListingsView = ({
  activeListings,
  isLoading,
  onEditBook,
  onDeleteBook,
}: MobileListingsViewProps) => {
  const navigate = useNavigate();

  return (
    <Card className="lg:hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center">
            <BookIcon className="h-5 w-5 mr-2" />
            My Active Listings
          </span>
          <Badge variant="secondary">{activeListings.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-book-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading listings...</p>
          </div>
        ) : activeListings.length > 0 ? (
          <div className="space-y-4">
            <div className="mb-4">
              <BookNotSellingHelp />
            </div>

            {activeListings.map((book) => (
              <div
                key={book.id}
                className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg bg-white"
              >
                <img
                  src={book.frontCover || book.imageUrl}
                  alt={book.title}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {book.title}
                  </h3>
                  <p className="text-lg font-bold text-book-600">
                    R{book.price}
                  </p>
                  <div className="flex items-center text-xs text-gray-400 mt-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(book.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex flex-col space-y-2 ml-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate(`/books/${book.id}`)}
                    className="text-blue-600 hover:text-blue-700 min-w-[44px] min-h-[44px]"
                    aria-label="View book"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onEditBook(book.id)}
                    className="text-book-600 hover:text-book-700 min-w-[44px] min-h-[44px]"
                    aria-label="Edit book"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onDeleteBook(book.id, book.title)}
                    className="text-red-600 hover:text-red-700 min-w-[44px] min-h-[44px]"
                    aria-label="Delete book"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button
              onClick={() => navigate("/create-listing")}
              className="w-full bg-book-600 hover:bg-book-700 text-white mt-4 h-12"
              size="lg"
            >
              <BookIcon className="h-5 w-5" />
              <span className="ml-2">Create New Listing</span>
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <BookIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No active listings</p>
            <Button
              onClick={() => navigate("/create-listing")}
              className="w-full bg-book-600 hover:bg-book-700 text-white h-12"
              size="lg"
            >
              Create Your First Listing
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MobileListingsView;
