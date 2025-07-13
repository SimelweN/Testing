import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  ArrowLeft,
  Calculator,
  GraduationCap,
  Search,
  BookOpen,
  Lightbulb,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const CampusNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/university-info" && location.pathname === "/university-info")
      return true;
    if (
      path.includes("aps-calculator") &&
      location.search.includes("tool=aps-calculator")
    )
      return true;
    if (
      path.includes("bursaries") &&
      location.search.includes("tool=bursaries")
    )
      return true;
    if (path.includes("campus-books") && location.search.includes("tool=books"))
      return true;
    return false;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md border-b border-book-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo - Mobile Optimized */}
          <div className="flex items-center">
            <button
              onClick={() => handleNavigation("/university-info")}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-book-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-base sm:text-lg">
                  R
                </span>
              </div>
              <span className="text-base sm:text-xl font-bold text-book-600 hidden xs:block">
                ReBooked Campus
              </span>
              <span className="text-sm font-bold text-book-600 xs:hidden">
                ReBooked&nbsp;
                <br />
                <br />
              </span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            <Button
              variant="ghost"
              onClick={() => handleNavigation("/university-info")}
              className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                isActive("/university-info")
                  ? "bg-book-50 text-book-600"
                  : "text-gray-600 hover:text-book-600 hover:bg-book-50"
              }`}
            >
              <Search className="w-4 h-4 mr-2" />
              Home
            </Button>

            <Button
              variant="ghost"
              onClick={() =>
                handleNavigation("/university-info?tool=aps-calculator")
              }
              className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                isActive("aps-calculator")
                  ? "bg-book-50 text-book-600"
                  : "text-gray-600 hover:text-book-600 hover:bg-book-50"
              }`}
            >
              <Calculator className="w-4 h-4 mr-2" />
              APS Calculator
            </Button>

            <Button
              variant="ghost"
              onClick={() =>
                handleNavigation("/university-info?tool=bursaries")
              }
              className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                isActive("bursaries")
                  ? "bg-book-50 text-book-600"
                  : "text-gray-600 hover:text-book-600 hover:bg-book-50"
              }`}
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Bursaries
            </Button>

            <Button
              variant="ghost"
              onClick={() => handleNavigation("/university-info?tool=books")}
              className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                isActive("campus-books")
                  ? "bg-book-50 text-book-600"
                  : "text-gray-600 hover:text-book-600 hover:bg-book-50"
              }`}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Campus & Books
            </Button>

            <Button
              variant="ghost"
              onClick={() => handleNavigation("/study-tips")}
              className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                isActive("/study-tips") || isActive("/study-resources")
                  ? "bg-book-50 text-book-600"
                  : "text-gray-600 hover:text-book-600 hover:bg-book-50"
              }`}
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Study Tips
            </Button>

            <Button
              variant="ghost"
              onClick={() => handleNavigation("/add-program")}
              className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                isActive("/add-program")
                  ? "bg-book-50 text-book-600"
                  : "text-gray-600 hover:text-book-600 hover:bg-book-50"
              }`}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Program
            </Button>
          </div>

          {/* Medium Screen Navigation */}
          <div className="hidden md:flex lg:hidden items-center space-x-1">
            <Button
              variant="ghost"
              onClick={() => handleNavigation("/university-info")}
              className={`px-2 py-2 rounded-lg transition-colors ${
                isActive("/university-info")
                  ? "bg-book-50 text-book-600"
                  : "text-gray-600 hover:text-book-600 hover:bg-book-50"
              }`}
              size="sm"
            >
              <Search className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              onClick={() =>
                handleNavigation("/university-info?tool=aps-calculator")
              }
              className={`px-2 py-2 rounded-lg transition-colors ${
                isActive("aps-calculator")
                  ? "bg-book-50 text-book-600"
                  : "text-gray-600 hover:text-book-600 hover:bg-book-50"
              }`}
              size="sm"
            >
              <Calculator className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              onClick={() => handleNavigation("/study-tips")}
              className={`px-2 py-2 rounded-lg transition-colors ${
                isActive("/study-tips") || isActive("/study-resources")
                  ? "bg-book-600 text-white"
                  : "text-gray-600 hover:text-book-600"
              }`}
              size="sm"
            >
              <GraduationCap className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              onClick={() => handleNavigation("/university-info?tool=books")}
              className={`px-2 py-2 rounded-lg transition-colors ${
                isActive("campus-books")
                  ? "bg-book-50 text-book-600"
                  : "text-gray-600 hover:text-book-600 hover:bg-book-50"
              }`}
              size="sm"
            >
              <BookOpen className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              onClick={() => handleNavigation("/study-resources")}
              className={`px-2 py-2 rounded-lg transition-colors ${
                isActive("/study-resources")
                  ? "bg-book-50 text-book-600"
                  : "text-gray-600 hover:text-book-600 hover:bg-book-50"
              }`}
              size="sm"
            >
              <Lightbulb className="w-4 h-4" />
            </Button>
          </div>

          {/* Back to Marketplace Button - Desktop */}
          <div className="hidden md:flex items-center">
            <Button
              onClick={() => handleNavigation("/books")}
              className="bg-book-600 hover:bg-book-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm"
              size="sm"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden lg:inline">Back to Marketplace</span>
              <span className="lg:hidden">Marketplace</span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-book-600 hover:bg-book-50"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-book-200">
            <div className="py-3 space-y-1">
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/university-info")}
                className={`w-full justify-start px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                  isActive("/university-info")
                    ? "bg-book-50 text-book-600"
                    : "text-gray-600"
                }`}
              >
                <Search className="w-4 h-4 mr-3" />
                Home
              </Button>

              <Button
                variant="ghost"
                onClick={() => handleNavigation("/study-tips")}
                className="flex items-center justify-start px-4 py-3 w-full text-left rounded-lg font-medium transition-colors hover:bg-book-50 hover:text-book-600"
              >
                <Lightbulb className="w-4 h-4 mr-3" />
                Study Tips
              </Button>

              <Button
                variant="ghost"
                onClick={() =>
                  handleNavigation("/university-info?tool=bursaries")
                }
                className={`w-full justify-start px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                  isActive("bursaries")
                    ? "bg-book-50 text-book-600"
                    : "text-gray-600"
                }`}
              >
                <GraduationCap className="w-4 h-4 mr-3" />
                Bursaries
              </Button>

              <Button
                variant="ghost"
                onClick={() => handleNavigation("/university-info?tool=books")}
                className={`w-full justify-start px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                  isActive("campus-books")
                    ? "bg-book-50 text-book-600"
                    : "text-gray-600"
                }`}
              >
                <BookOpen className="w-4 h-4 mr-3" />
                Campus & Books
              </Button>

              <Button
                variant="ghost"
                onClick={() => handleNavigation("/study-tips")}
                className={`w-full justify-start px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                  isActive("/study-tips") || isActive("/study-resources")
                    ? "bg-book-50 text-book-600"
                    : "text-gray-600"
                }`}
              >
                <Lightbulb className="w-4 h-4 mr-3" />
                Study Tips
              </Button>

              <Button
                variant="ghost"
                onClick={() => handleNavigation("/add-program")}
                className={`w-full justify-start px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                  isActive("/add-program")
                    ? "bg-book-50 text-book-600"
                    : "text-gray-600"
                }`}
              >
                <Plus className="w-4 h-4 mr-3" />
                Add Program
              </Button>

              <div className="border-t border-book-200 pt-3 mt-3">
                <Button
                  onClick={() => handleNavigation("/books")}
                  className="w-full bg-book-600 hover:bg-book-700 text-white px-4 py-3 rounded-lg font-medium text-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-3" />
                  Back to Marketplace
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default CampusNavbar;
