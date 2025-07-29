import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import LoadingSpinner from "./LoadingSpinner";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({
  children,
}) => {
  // Defensive auth handling with fallback
  let isAuthenticated = false;
  let isAdmin = false;
  let isLoading = true;
  let user = null;

  try {
    const auth = useAuth();
    isAuthenticated = auth.isAuthenticated;
    isAdmin = auth.isAdmin;
    isLoading = auth.isLoading;
    user = auth.user;
  } catch (error) {
    console.warn("Auth context not available in AdminProtectedRoute, redirecting to login");
    // Fallback to unauthenticated state and redirect
    isAuthenticated = false;
    isAdmin = false;
    isLoading = false;
    user = null;
  }

  const navigate = useNavigate();
  const [hasChecked, setHasChecked] = useState(false);
  const [checkTimeout, setCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (!hasChecked) {
        console.warn("Admin auth check timed out, assuming not admin");
        setHasChecked(true);
        if (!isAuthenticated) {
          toast.error("Please login to access the admin dashboard");
          navigate("/login");
        } else if (!isAdmin) {
          toast.error("You do not have admin privileges");
          navigate("/");
        }
      }
    }, 5000); // 5 second timeout

    setCheckTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [hasChecked, isAdmin, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isLoading && !hasChecked) {
      setHasChecked(true);

      // Clear the timeout since we got a result
      if (checkTimeout) {
        clearTimeout(checkTimeout);
      }

      if (!isAuthenticated) {
        toast.error("Please login to access the admin dashboard");
        navigate("/login");
        return;
      }

      if (!isAdmin) {
        toast.error("You do not have admin privileges");
        navigate("/");
        return;
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, navigate, hasChecked, checkTimeout]);

  // Show loading spinner while checking auth
  if ((isLoading || !hasChecked) && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" text="Verifying admin access..." />
          <p className="mt-4 text-sm text-gray-600">
            This should only take a moment...
          </p>
        </div>
      </div>
    );
  }

  // If we have a user but they're not admin, don't render anything (redirect will happen)
  if (user && !isAdmin) {
    return null;
  }

  // If we have a user and they are admin, render the children
  if (user && isAdmin) {
    return <>{children}</>;
  }

  // Fallback - don't render anything
  return null;
};

export default AdminProtectedRoute;
