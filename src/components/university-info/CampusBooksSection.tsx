import React, { useState, useMemo } from "react";
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
  Book,
} from "lucide-react";
import { ALL_SOUTH_AFRICAN_UNIVERSITIES } from "@/constants/universities";

const CampusBooksSection = () => {
  const navigate = useNavigate();
  const universities = ALL_SOUTH_AFRICAN_UNIVERSITIES;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");

  // Mock book data - in production this would come from your database
  const mockBooks = useMemo(
    () => [
      {
        id: "1",
        title: "Introduction to Computer Science",
        author: "John Smith",
        price: 450.0,
        condition: "excellent",
        university: "uct",
        category: "Computer Science",
        cover_image: "/api/placeholder/200/250",
        description:
          "Comprehensive introduction to computer science fundamentals.",
        faculty: "Science",
        location: "Cape Town",
        tags: ["Programming", "Algorithms", "Data Structures"],
        seller: "Alex K.",
      },
      {
        id: "2",
        title: "Calculus and Analytical Geometry",
        author: "Maria Rodriguez",
        price: 380.0,
        condition: "good",
        university: "wits",
        category: "Mathematics",
        cover_image: "/api/placeholder/200/250",
        description: "Advanced calculus textbook with detailed examples.",
        faculty: "Science",
        location: "Johannesburg",
        tags: ["Calculus", "Geometry", "Mathematics"],
        seller: "Sarah M.",
      },
      {
        id: "3",
        title: "Organic Chemistry Principles",
        author: "Dr. James Wilson",
        price: 520.0,
        condition: "very good",
        university: "up",
        category: "Chemistry",
        cover_image: "/api/placeholder/200/250",
        description: "Essential organic chemistry concepts and reactions.",
        faculty: "Natural Sciences",
        location: "Pretoria",
        tags: ["Chemistry", "Organic", "Laboratory"],
        seller: "Mike T.",
      },
    ],
    [],
  );

  const filteredBooks = useMemo(() => {
    return mockBooks.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUniversity =
        selectedUniversity === "all" || book.university === selectedUniversity;
      const matchesCategory =
        selectedCategory === "all" || book.category === selectedCategory;

      let matchesPrice = true;
      if (priceRange === "under-300") matchesPrice = book.price < 300;
      else if (priceRange === "300-500")
        matchesPrice = book.price >= 300 && book.price <= 500;
      else if (priceRange === "over-500") matchesPrice = book.price > 500;

      return (
        matchesSearch && matchesUniversity && matchesCategory && matchesPrice
      );
    });
  }, [mockBooks, searchTerm, selectedUniversity, selectedCategory, priceRange]);

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

  const BookCard = ({
    book,
  }: {
    book: {
      id: string;
      title: string;
      author: string;
      condition: string;
      price: number;
      university: string;
      category: string;
      cover_image?: string;
      description: string;
      faculty: string;
      location: string;
      tags: string[];
      seller: string;
    };
  }) => {
    const universityInfo = universities.find(
      (uni) => uni.id === book.university,
    );

    return (
      <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-2">
            <CardTitle className="text-base sm:text-lg font-bold text-blue-900 line-clamp-2">
              {book.title}
            </CardTitle>
            <Badge
              className={`${getConditionColor(book.condition)} text-xs whitespace-nowrap`}
            >
              {book.condition}
            </Badge>
          </div>
          <CardDescription className="text-sm text-gray-600 mb-2">
            by {book.author}
          </CardDescription>
          <div className="text-xl sm:text-2xl font-bold text-green-600 mb-2">
            R{book.price.toFixed(2)}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* University and Location Info */}
          <div className="mb-3 space-y-1">
            <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
              <Building className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">
                {universityInfo?.name || book.university}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
              <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">{book.faculty}</span>
            </div>
            <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">{book.location}</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
            {book.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3 sm:mb-4">
            {book.tags.slice(0, 3).map((tag: string, index: number) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs bg-gray-100"
              >
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mb-3 sm:mb-4">
            <span className="truncate">Sold by: {book.seller}</span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="w-3 h-3 fill-current text-yellow-400" />
              <span>4.5</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              size="sm"
              className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
              onClick={() => navigate(`/book/${book.id}`)}
            >
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              View Details
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto border-green-200 text-green-600 hover:bg-green-50 text-xs sm:text-sm"
              onClick={() => navigate(`/cart?add=${book.id}`)}
            >
              <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-0" />
              <span className="sm:hidden">Add to Cart</span>
            </Button>
          </div>
        </CardContent>
      </Card>
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
            {filteredBooks.length} Books Found
          </h3>
          <Button
            onClick={() => navigate("/create-listing")}
            className="bg-green-600 hover:bg-green-700 text-white text-sm"
          >
            <Book className="w-4 h-4 mr-2" />
            Sell Books
          </Button>
        </div>

        {filteredBooks.length === 0 ? (
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
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
