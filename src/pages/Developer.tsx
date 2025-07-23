import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import DeveloperDashboard from "@/components/DeveloperDashboard";
import { ArrowLeft, Terminal, Shield } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorBoundary from "@/components/ErrorBoundary";

const Developer = () => {
  const { user, profile, isLoading, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner size="lg" text="Checking developer access..." />
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
              You must be logged in to access the developer dashboard.
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
                onClick={() => navigate("/")}
                variant="outline"
                className="w-full min-h-[48px]"
                size="lg"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
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
              <Terminal className="h-8 w-8 text-orange-600" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Developer Access Only</h2>
            <p className="text-gray-600 mb-6">
              This dashboard is restricted to developers and administrators only.
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
                onClick={() => navigate("/")}
                variant="outline"
                className="w-full min-h-[48px]"
                size="lg"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
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
      <ErrorBoundary level="page">
        <div className="container mx-auto px-4 py-8">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              size={isMobile ? "sm" : "default"}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {!isMobile && "Back"}
            </Button>

            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-slate-600" />
              <span className="text-sm text-gray-600">
                Logged in as {profile?.name || user.email}
              </span>
            </div>
          </div>

          {/* Developer Dashboard */}
          <DeveloperDashboard />
        </div>
      </ErrorBoundary>
    </Layout>
  );
};

export default Developer;
