import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookIcon, Calendar, Edit, Trash2, Eye } from "lucide-react";
import { Book } from "@/types/book";
import { useNavigate } from "react-router-dom";
import BookNotSellingHelp from "@/components/BookNotSellingHelp";

interface ListingsSidebarProps {
  activeListings: Book[];
  isLoading: boolean;
  onEditBook: (bookId: string) => void;
  onDeleteBook: (bookId: string, bookTitle: string) => Promise<void>;
}

const ListingsSidebar = ({
  activeListings,
  isLoading,
  onEditBook,
  onDeleteBook,
}: ListingsSidebarProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center">
            <BookIcon className="h-5 w-5 mr-2" />
            Active Listings
          </span>
          <Badge variant="secondary">{activeListings.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-book-600 mx-auto"></div>
          </div>
        ) : activeListings.length > 0 ? (
          <div className="space-y-3">
            <div className="mb-4">
              <BookNotSellingHelp />
            </div>

            {activeListings.slice(0, 3).map((book) => (
              <div
                key={book.id}
                className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <img
                  src={book.frontCover || book.imageUrl}
                  alt={book.title}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {book.title}
                  </p>
                  <p className="text-sm text-book-600">R{book.price}</p>
                  <div className="flex items-center text-xs text-gray-400">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(book.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/books/${book.id}`)}
                    className="text-blue-600 hover:text-blue-700 h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditBook(book.id)}
                    className="text-book-600 hover:text-book-700 h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteBook(book.id, book.title)}
                    className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {activeListings.length > 3 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/user-profile")}
                className="w-full mt-3"
              >
                View All ({activeListings.length})
              </Button>
            )}

            <Button
              onClick={() => navigate("/create-listing")}
              className="w-full bg-book-600 hover:bg-book-700 text-white"
              size="sm"
            >
              Create New Listing
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <BookIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-3">No active listings</p>
            <Button
              onClick={() => navigate("/create-listing")}
              className="bg-book-600 hover:bg-book-700 text-white"
              size="sm"
            >
              Create Your First Listing
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ListingsSidebar;
