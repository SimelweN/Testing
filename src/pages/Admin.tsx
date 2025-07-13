import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import AdminDashboard from "@/components/AdminDashboard";
import { ArrowLeft, Flag, Shield } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorBoundary from "@/components/ErrorBoundary";

const Admin = () => {
  const { user, profile, isLoading, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner size="lg" text="Checking admin access..." />
        </div>
      </Layout>
    );
  }

  // Show access denied for non-authenticated users
  if (!isAuthenticated || !user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-6">
              You must be logged in to access the admin dashboard.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate("/login")}
                className="w-full min-h-[48px]"
                size="lg"
              >
                Log In
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="w-full min-h-[48px]"
                size="lg"
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show access denied for non-admin users
  if (!isAdmin) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">
              Admin Access Required
            </h2>
            <p className="text-gray-600 mb-6">
              You do not have administrator privileges to access this page.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate("/profile")}
                className="w-full min-h-[48px]"
                size="lg"
              >
                Go to Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="w-full min-h-[48px]"
                size="lg"
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        className={`container mx-auto ${isMobile ? "px-2" : "px-4"} py-4 md:py-8 space-y-4 max-w-full`}
      >
        {/* Mobile-optimized Header */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-book-600 min-h-[44px] btn-mobile"
              size={isMobile ? "sm" : "default"}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {isMobile ? "" : "Back to Home"}
            </Button>
          </div>

          <div
            className={`flex ${isMobile ? "flex-col space-y-3" : "flex-row items-center justify-between"} gap-4`}
          >
            <div className="flex items-center space-x-3 min-w-0">
              <Shield
                className={`${isMobile ? "h-5 w-5" : "h-6 w-6"} text-book-600 flex-shrink-0`}
              />
              <h1
                className={`${isMobile ? "text-lg" : "text-2xl md:text-3xl"} font-bold text-book-800 truncate`}
              >
                Admin Dashboard
              </h1>
            </div>

            <Button
              variant="outline"
              onClick={() => navigate("/admin/reports")}
              className={`flex items-center ${isMobile ? "w-full" : "w-auto"} min-h-[44px] btn-mobile`}
              size={isMobile ? "default" : "default"}
            >
              <Flag className="mr-2 h-4 w-4" />
              View Reports
            </Button>
          </div>
        </div>

        <div
          className={`bg-white rounded-lg shadow-md ${isMobile ? "p-3 card-mobile" : "p-4 md:p-6"} overflow-hidden`}
        >
          <ErrorBoundary level="component">
            <AdminDashboard />
          </ErrorBoundary>
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
