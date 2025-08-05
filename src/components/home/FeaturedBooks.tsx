import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ArrowRight, MapPin } from "lucide-react";
import { getBooks } from "@/services/book/bookQueries";
import { Book } from "@/types/book";
import { logErrorSafely } from "@/utils/errorHandling";

const FeaturedBooks = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to create a seeded random number generator
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Function to shuffle array using seeded random
  const shuffleArrayWithSeed = <T,>(array: T[], seed: number): T[] => {
    const shuffled = [...array];
    let currentIndex = shuffled.length;
    let randomIndex: number;

    while (currentIndex !== 0) {
      randomIndex = Math.floor(seededRandom(seed + currentIndex) * currentIndex);
      currentIndex--;
      [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
    }

    return shuffled;
  };

  useEffect(() => {
    const fetchFeaturedBooks = async () => {
      try {
        setIsLoading(true);
        // Fetch all available books
        const allBooks = await getBooks({});

        if (allBooks.length === 0) {
          setBooks([]);
          return;
        }

        // Create a daily seed based on current date (YYYY-MM-DD)
        const today = new Date();
        const dateString = today.getFullYear() + "-" +
                          String(today.getMonth() + 1).padStart(2, '0') + "-" +
                          String(today.getDate()).padStart(2, '0');
        const dailySeed = dateString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        // Shuffle books using daily seed and take first 4
        const shuffledBooks = shuffleArrayWithSeed(allBooks, dailySeed);
        setBooks(shuffledBooks.slice(0, 4));
      } catch (error) {
        logErrorSafely("Error fetching featured books:", error);
        setBooks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedBooks();
  }, []);

  if (isLoading) {
    return (
      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-book-800 mb-4">
              Featured Books
            </h2>
            <p className="text-lg text-gray-600">
              Discover handpicked textbooks from our collection
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-300 rounded-lg h-48 mb-4"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (books.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="h-5 w-5 text-book-600 fill-current" />
            <Badge className="bg-book-100 text-book-800 hover:bg-book-200">
              Featured
            </Badge>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-book-800 mb-4">
            Featured Books
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover handpicked textbooks from our collection. Quality books at
            unbeatable prices.
          </p>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <FeaturedBookCard key={book.id} book={book} />
          ))}
        </div>

        <div className="text-center mt-8">
          <Button asChild size="lg" className="bg-book-600 hover:bg-book-700">
            <Link to="/books">
              View All Books
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

const FeaturedBookCard = ({ book }: { book: Book }) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
      <Link to={`/books/${book.id}`} className="block">
        <div className="relative h-48 overflow-hidden">
          <img
            src={book.imageUrl}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400&h=300&fit=crop&auto=format&q=80";
            }}
          />
          <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-sm font-semibold text-book-800">
            R{book.price.toLocaleString()}
          </div>
          <div className="absolute top-2 left-2">
            <Badge className="bg-book-600 text-white hover:bg-book-700">
              {book.condition}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="font-bold text-lg mb-1 text-book-800 line-clamp-1 group-hover:text-book-600 transition-colors">
            {book.title}
          </h3>
          <p className="text-gray-600 mb-2 text-sm">by {book.author}</p>
          <p className="text-gray-500 text-sm mb-3 line-clamp-2">
            {book.description}
          </p>

          {/* Province/Location display */}
          {book.province && (
            <div className="flex items-center text-xs text-gray-500 mb-3">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{book.province}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {book.category}
            </Badge>
            {book.grade && (
              <Badge variant="secondary" className="text-xs">
                {book.grade}
              </Badge>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

export default FeaturedBooks;
