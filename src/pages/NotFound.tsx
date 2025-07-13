import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Home, Search, ArrowLeft } from "lucide-react";
import { updateMetaTags } from "@/utils/seoUtils";
import { useEffect } from "react";

const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    updateMetaTags({
      title: "Page Not Found - 404",
      description:
        "The page you're looking for doesn't exist. Browse our textbook marketplace instead.",
      url: `${window.location.origin}/404`,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-book-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center">
        {/* Logo and Brand */}
        <div className="mb-8">
          <Link to="/" className="inline-block">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <BookOpen className="h-8 w-8 text-book-600" />
              <span className="text-2xl font-bold text-book-800">
                Rebooked Solutions
              </span>
            </div>
          </Link>
        </div>

        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-book-200 mb-4">404</div>
          <div className="flex justify-center items-center space-x-2 mb-6">
            <BookOpen className="h-16 w-16 text-book-300" />
            <div className="text-6xl text-book-300">📚</div>
            <BookOpen className="h-16 w-16 text-book-300" />
          </div>
        </div>

        {/* Error Message */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-book-800">
              Oops! Page Not Found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 text-lg">
              The page you're looking for seems to have wandered off like a lost
              textbook. Don't worry, we'll help you find what you need!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-book-50 rounded-lg">
                <BookOpen className="h-8 w-8 text-book-600 mx-auto mb-2" />
                <h3 className="font-semibold text-book-800 mb-1">
                  Browse Books
                </h3>
                <p className="text-sm text-gray-600">
                  Discover thousands of textbooks
                </p>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Search className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-800 mb-1">Search</h3>
                <p className="text-sm text-gray-600">
                  Find exactly what you need
                </p>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Home className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-blue-800 mb-1">Start Over</h3>
                <p className="text-sm text-gray-600">Go back to homepage</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </Button>

          <Link to="/">
            <Button className="bg-book-600 hover:bg-book-700 flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span>Homepage</span>
            </Button>
          </Link>

          <Link to="/books">
            <Button
              variant="outline"
              className="border-book-600 text-book-600 hover:bg-book-50 flex items-center space-x-2"
            >
              <BookOpen className="h-4 w-4" />
              <span>Browse Books</span>
            </Button>
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-sm text-gray-500">
          <p>
            Still can't find what you're looking for?{" "}
            <Link
              to="/contact"
              className="text-book-600 hover:text-book-700 underline"
            >
              Contact our support team
            </Link>{" "}
            for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
