import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ReadyToGetStarted = () => {
  const navigate = useNavigate();

  // For now, always show "Sign Up Now" to avoid auth context dependency
  // This component can work independently of auth state
  const isAuthenticated = false;

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-r from-book-600 to-book-700">
      <div className="container mx-auto px-4">
        <div className="text-center text-white max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Ready to Get Started?
          </h2>

          <p className="text-lg sm:text-xl lg:text-2xl mb-8 sm:mb-10 text-white/90 leading-relaxed">
            Join ReBooked Solutions to buy and sell textbooks securely. Save
            money and help others do the same!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center max-w-lg mx-auto">
            <Button
              onClick={() =>
                navigate(isAuthenticated ? "/create-listing" : "/register")
              }
              size="lg"
              className="w-full sm:w-auto bg-white text-book-600 hover:bg-gray-100 font-semibold px-8 py-4 text-lg"
            >
              {isAuthenticated ? "List Your Books" : "Sign Up Now"}
            </Button>

            <Button
              onClick={() => navigate("/books")}
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-book-600 font-semibold px-8 py-4 text-lg bg-white/10 backdrop-blur-sm"
            >
              Browse Books
            </Button>
          </div>

          <div className="mt-8 text-sm sm:text-base text-white/80">
            <p>Join thousands of students already saving money on textbooks</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReadyToGetStarted;
