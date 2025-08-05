import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  ExternalLink,
  Users,
  Star,
  MapPin,
} from "lucide-react";
import { getBooks } from "@/services/book/bookQueries";
import { Book } from "@/types/book";
import {
  SOUTH_AFRICAN_UNIVERSITIES_SIMPLE,
  UNIVERSITY_YEARS,
} from "@/constants/universities";
import { toast } from "sonner";

interface CampusBooksProps {
  selectedUniversity?: string;
  selectedDegree?: string;
  onNavigateToFullMarketplace?: () => void;
}

const CampusBooks = ({
  selectedUniversity,
  selectedDegree,
  onNavigateToFullMarketplace,
}: CampusBooksProps) => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUniversityFilter, setSelectedUniversityFilter] = useState(
    selectedUniversity || "",
  );
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");

  const loadBooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: {
        university?: string;
        universityYear?: string;
        condition?: string;
        search?: string;
      } = {};

      if (selectedUniversityFilter) {
        filters.university = selectedUniversityFilter;
      }

      if (selectedYear) {
        filters.universityYear = selectedYear;
      }

      if (searchQuery) {
        filters.search = searchQuery;
      }

      if (selectedCondition) {
        filters.condition = selectedCondition;
      }

      const loadedBooks = await getBooks(filters);
      setBooks(Array.isArray(loadedBooks) ? loadedBooks : []);
    } catch (error) {
      const errorDetails = {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : "Unknown",
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      };

      console.error("[CampusBooks] Error loading campus books:", errorDetails);

      const userMessage =
        error instanceof Error && error.message.includes("Failed to fetch")
          ? "Unable to connect to the textbook database. Please check your internet connection and try again."
          : "Failed to load campus books. Please try again later.";

      toast.error(userMessage);
      setBooks([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedUniversityFilter, selectedYear, searchQuery, selectedCondition]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const filteredBooks = useMemo(() => {
    let filtered = books;

    // Additional filtering for degree if specified
    if (selectedDegree && selectedDegree !== "") {
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(selectedDegree.toLowerCase()) ||
          book.description
            .toLowerCase()
            .includes(selectedDegree.toLowerCase()) ||
          book.category.toLowerCase().includes(selectedDegree.toLowerCase()),
      );
    }

    return filtered;
  }, [books, selectedDegree]);

  const handleBookClick = (bookId: string) => {
    navigate(`/books/${bookId}`);
  };

  const handleViewFullMarketplace = () => {
    const params = new URLSearchParams();
    if (selectedUniversityFilter)
      params.set("university", selectedUniversityFilter);
    if (selectedYear) params.set("universityYear", selectedYear);
    if (searchQuery) params.set("search", searchQuery);

    navigate(`/books?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedUniversityFilter("");
    setSelectedYear("");
    setSelectedCondition("");
  };

  const getUniversityName = (universityId: string) => {
    const university = SOUTH_AFRICAN_UNIVERSITIES_SIMPLE.find(
      (u) => u.id === universityId,
    );
    return university ? university.abbreviation : universityId;
  };

  const BookCard = ({ book }: { book: Book }) => (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={() => handleBookClick(book.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Book Image */}
          <div className="w-16 h-20 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
            {book.imageUrl ? (
              <img
                src={book.imageUrl}
                alt={book.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
            ) : (
              <div className="w-full h-full bg-book-100 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-book-400" />
              </div>
            )}
          </div>

          {/* Book Details */}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold text-book-800 group-hover:text-book-600 transition-colors line-clamp-2">
              {book.title}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              by {book.author}
            </CardDescription>

            {/* Price and Condition */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-lg font-bold text-green-600">
                R{book.price.toLocaleString()}
              </span>
              <Badge variant="secondary" className="text-xs">
                {book.condition}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Description */}
        {book.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {book.description}
          </p>
        )}

        {/* University and Year Info */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>Listed by {book.seller.name}</span>
          </div>
          {book.universityYear && (
            <Badge variant="outline" className="text-xs">
              {book.universityYear}
            </Badge>
          )}
        </div>

        {/* Province/Location display */}
        {(book.province || book.location) && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{book.province || book.location}</span>
          </div>
        )}

        {/* Category and Date */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {book.category}
          </Badge>
          <span className="text-xs text-gray-500">
            {new Date(book.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-book-800 flex items-center justify-center gap-2">
          <BookOpen className="h-8 w-8" />
          Campus Books
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Find textbooks from students at your university or browse all
          available books from our marketplace.
        </p>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Find Your Textbooks
          </CardTitle>
          <CardDescription>
            Search and filter books by university, year level, and condition.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search books by title, author, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={selectedUniversityFilter || "all"}
              onValueChange={(value) =>
                setSelectedUniversityFilter(value === "all" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select university" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all-universities" value="all">
                  All Universities
                </SelectItem>
                {SOUTH_AFRICAN_UNIVERSITIES_SIMPLE.map((university) => (
                  <SelectItem key={university.id} value={university.id}>
                    {university.abbreviation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedYear || "all"}
              onValueChange={(value) =>
                setSelectedYear(value === "all" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Year level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all-years" value="all">
                  All Years
                </SelectItem>
                {UNIVERSITY_YEARS.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedCondition || "all"}
              onValueChange={(value) =>
                setSelectedCondition(value === "all" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all-conditions" value="all">
                  All Conditions
                </SelectItem>
                <SelectItem key="new" value="New">
                  New
                </SelectItem>
                <SelectItem key="good" value="Good">
                  Good
                </SelectItem>
                <SelectItem key="better" value="Better">
                  Better
                </SelectItem>
                <SelectItem key="average" value="Average">
                  Average
                </SelectItem>
                <SelectItem key="below-average" value="Below Average">
                  Below Average
                </SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>

          {/* Active Filters Display */}
          {(selectedUniversityFilter ||
            selectedYear ||
            selectedCondition ||
            searchQuery) && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {selectedUniversityFilter && (
                <Badge variant="secondary">
                  University: {getUniversityName(selectedUniversityFilter)}
                </Badge>
              )}
              {selectedYear && (
                <Badge variant="secondary">Year: {selectedYear}</Badge>
              )}
              {selectedCondition && (
                <Badge variant="secondary">
                  Condition: {selectedCondition}
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary">Search: "{searchQuery}"</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {isLoading ? "Loading..." : `${filteredBooks.length} books found`}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewFullMarketplace}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Full Marketplace
          </Button>
          <Button
            size="sm"
            onClick={() => navigate("/create-listing")}
            className="bg-book-600 hover:bg-book-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Sell Your Books
          </Button>
        </div>
      </div>

      {/* Books Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="flex gap-3">
                  <div className="w-16 h-20 bg-gray-200 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <BookOpen className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No books found
          </h3>
          <p className="text-gray-600 mb-4">
            No textbooks match your current search criteria. Try adjusting your
            filters or search terms.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button
              onClick={() => navigate("/create-listing")}
              className="bg-book-600 hover:bg-book-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              List Your Books
            </Button>
          </div>
        </div>
      )}

      {/* Helpful Information */}
      {!selectedUniversity && (
        <Alert>
          <BookOpen className="h-4 w-4" />
          <AlertDescription>
            <strong>Tip:</strong> Select your university above to see books
            specifically listed by students from your campus. You can also
            browse all books or list your own textbooks for sale.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default CampusBooks;
