import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BookOpen,
  ShoppingCart,
  Search,
  Filter,
  MapPin,
  Star,
  Building,
  GraduationCap,
  AlertCircle,
  Book as BookIcon,
} from "lucide-react";
import { ALL_SOUTH_AFRICAN_UNIVERSITIES } from "@/constants/universities";
import { getBooks } from "@/services/book/bookQueries";
import { Book } from "@/types/book";
import { toast } from "sonner";

const CampusBooksSection = () => {
  const navigate = useNavigate();
  const universities = ALL_SOUTH_AFRICAN_UNIVERSITIES;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadBooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: {
        university?: string;
        search?: string;
      } = {};

      if (selectedUniversity !== "all") {
        filters.university = selectedUniversity;
      }

      if (searchTerm) {
        filters.search = searchTerm;
      }

      const loadedBooks = await getBooks(filters);
      setBooks(Array.isArray(loadedBooks) ? loadedBooks : []);
    } catch (error) {
      console.error("Error loading campus books:", error);
      toast.error("Failed to load books. Please try again.");
      setBooks([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedUniversity, searchTerm]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesCategory =
        selectedCategory === "all" || book.category === selectedCategory;

      let matchesPrice = true;
      if (priceRange === "under-300") matchesPrice = book.price < 300;
      else if (priceRange === "300-500")
        matchesPrice = book.price >= 300 && book.price <= 500;
      else if (priceRange === "over-500") matchesPrice = book.price > 500;

      return matchesCategory && matchesPrice;
    });
  }, [books, selectedCategory, priceRange]);

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "excellent":
        return "bg-green-100 text-green-800 border-green-200";
      case "very good":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "good":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "fair":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const BookCard = ({ book }: { book: Book }) => {
    const universityInfo = universities.find(
      (uni) => uni.id === book.university,
    );

    return (
      <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-200 book-card-hover flex flex-col">
        <div
          className="block flex-1 cursor-pointer"
          onClick={() => navigate(`/books/${book.id}`)}
        >
          <div className="relative h-48 overflow-hidden">
            <img
              src={book.imageUrl || "/placeholder.svg"}
              alt={book.title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
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

            {/* University and Location Info */}
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Building className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">
                  {universityInfo?.name || book.university}
                </span>
              </div>
              {book.location && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{book.location}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between mt-4 gap-1">
              <span className="bg-book-100 text-book-800 px-2 py-1 rounded text-xs font-medium">
                {book.condition}
              </span>
              {book.universityYear && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium flex items-center">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  {book.universityYear}
                </span>
              )}
              <span className="text-gray-500 text-xs">{book.category}</span>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              <span className="truncate">Sold by: {book.seller.name}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (universities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5" />
            <span>Campus Books</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Loading universities data...</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
          Campus Books Marketplace
        </h2>
        <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
          Find affordable textbooks from students at your university. Buy, sell,
          and save on academic materials.
        </p>
      </div>

      {/* Filters - Mobile Optimized */}
      <Card className="bg-white border-0 shadow-lg">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            Find Your Books
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search books or authors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>

            {/* University Filter */}
            <Select
              value={selectedUniversity}
              onValueChange={setSelectedUniversity}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="All Universities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Universities</SelectItem>
                {universities.slice(0, 10).map((university) => (
                  <SelectItem key={university.id} value={university.id}>
                    {university.abbreviation || university.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Computer Science">
                  Computer Science
                </SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="Chemistry">Chemistry</SelectItem>
                <SelectItem value="Physics">Physics</SelectItem>
                <SelectItem value="Biology">Biology</SelectItem>
              </SelectContent>
            </Select>

            {/* Price Range Filter */}
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="All Prices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="under-300">Under R300</SelectItem>
                <SelectItem value="300-500">R300 - R500</SelectItem>
                <SelectItem value="over-500">Over R500</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
            {isLoading ? "Loading..." : `${filteredBooks.length} Books Found`}
          </h3>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate("/books")}
              variant="outline"
              className="text-sm"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              View All Books
            </Button>
            <Button
              onClick={() => navigate("/create-listing")}
              className="bg-green-600 hover:bg-green-700 text-white text-sm"
            >
              <BookIcon className="w-4 h-4 mr-2" />
              Sell Books
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
        ) : filteredBooks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No books found
              </h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your search criteria or browse all available
                books.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedUniversity("all");
                    setSelectedCategory("all");
                    setPriceRange("all");
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
                <Button
                  onClick={() => navigate("/books")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Browse All Books
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampusBooksSection;
