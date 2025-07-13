import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Search, BookOpen } from "lucide-react";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log("Searching for:", searchQuery.trim());
      navigate(`/books?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const categories = [
    { name: "Computer Science", icon: "💻" },
    { name: "Mathematics", icon: "📊" },
    { name: "Biology", icon: "🧬" },
    { name: "Chemistry", icon: "⚗️" },
    { name: "Physics", icon: "🔭" },
    { name: "Economics", icon: "📈" },
  ];

  return (
    <Layout>
      <SEO
        title="ReBooked Solutions - Buy and Sell Used Textbooks"
        description="South Africa's trusted platform for buying and selling used textbooks. Find affordable academic books, sell your old textbooks, and connect with students across the country."
        keywords="textbooks, used books, academic books, sell books, buy books, student books, South Africa"
        url="https://www.rebookedsolutions.co.za/"
      />

      {/* Mobile-Optimized Hero Section */}
      <section className="bg-gradient-to-r from-book-100 to-book-200 py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0 text-center md:text-left">
            <div className="mb-4">
              <span className="inline-block bg-book-600/10 text-book-700 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium italic">
                "Pre-Loved Pages, New Adventures"
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-book-900 mb-4 leading-tight">
              Buy and Sell Textbooks with Ease
            </h1>
            <p className="text-lg sm:text-xl text-book-700 mb-6 sm:mb-8 px-2 sm:px-0">
              Buy affordable secondhand textbooks and give your old ones a new
              home — all handled securely through ReBooked Solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 px-4 sm:px-0">
              <Button
                size="lg"
                className="bg-book-600 hover:bg-book-700 w-full sm:w-auto"
                onClick={() => navigate("/books")}
              >
                Browse Books
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-book-600 text-book-700 hover:bg-book-100 w-full sm:w-auto"
                onClick={() => navigate("/create-listing")}
              >
                Sell Your Books
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <img
              src="https://cdn.builder.io/api/v1/assets/4b236342bc954bc3a0760c75cd3f3881/pexels-yankrukov-8199706-ad0e6d?format=webp&width=800"
              alt="Three diverse students smiling with stacks of textbooks in library"
              width="600"
              height="400"
              className="rounded-lg shadow-xl max-w-full h-auto w-full max-w-sm md:max-w-full"
              loading="eager"
              decoding="sync"
            />
          </div>
        </div>
      </section>

      {/* Mobile-Optimized Search Section */}
      <section className="py-8 sm:py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-book-800">
            Find Your Textbooks
          </h2>
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <input
                type="text"
                placeholder="Search by title, author, or subject..."
                className="w-full p-3 sm:p-4 sm:pr-16 rounded-lg sm:rounded-r-none border border-gray-300 focus:outline-none focus:ring-2 focus:ring-book-500 focus:border-transparent text-base sm:text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="bg-book-600 text-white p-3 sm:p-2 rounded-lg sm:rounded-l-none sm:absolute sm:right-2 sm:top-2 hover:bg-book-700 transition duration-200 flex items-center justify-center"
              >
                <Search className="h-5 w-5 sm:h-6 sm:w-6 sm:mr-2" />
                <span className="sm:hidden">Search</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Mobile-Optimized Categories Section */}
      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-book-800">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={`/books?category=${encodeURIComponent(category.name)}`}
                className="bg-white rounded-lg shadow-md p-4 sm:p-6 text-center hover:shadow-lg transition-shadow duration-200"
              >
                <span className="text-2xl sm:text-4xl mb-2 sm:mb-4 block">
                  {category.icon}
                </span>
                <h3 className="font-semibold text-book-800 text-xs sm:text-base leading-tight">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ReBooked Campus Promotion Section */}
      <section className="py-8 sm:py-12 bg-gradient-to-r from-book-600 to-book-700">
        <div className="container mx-auto px-4">
          <div className="text-center text-white space-y-4 sm:space-y-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-full">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">
                Introducing ReBooked Campus
              </h2>
            </div>

            <p className="text-lg sm:text-xl max-w-2xl mx-auto text-white/90">
              Your complete university guide! Calculate your APS score, explore
              degree programs, find bursaries, and buy textbooks from students
              at your campus.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto text-sm sm:text-base">
              <div className="bg-white/10 rounded-lg p-3 sm:p-4">
                <div className="text-2xl mb-2">🎓</div>
                <div className="font-semibold">APS Calculator</div>
                <div className="text-white/80 text-xs sm:text-sm">
                  Calculate your score
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 sm:p-4">
                <div className="text-2xl mb-2">🏫</div>
                <div className="font-semibold">23+ Universities</div>
                <div className="text-white/80 text-xs sm:text-sm">
                  Explore programs
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 sm:p-4">
                <div className="text-2xl mb-2">💰</div>
                <div className="font-semibold">Find Bursaries</div>
                <div className="text-white/80 text-xs sm:text-sm">
                  Get funding
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 sm:p-4">
                <div className="text-2xl mb-2">📚</div>
                <div className="font-semibold">Campus Books</div>
                <div className="text-white/80 text-xs sm:text-sm">
                  From your university
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Button
                onClick={() => navigate("/university-info")}
                size="lg"
                className="bg-white text-book-600 hover:bg-gray-100 font-semibold"
              >
                Explore ReBooked Campus →
              </Button>
              <Link
                to="/university-info"
                className="text-white/90 hover:text-white text-sm underline"
              >
                Calculate your APS score now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
