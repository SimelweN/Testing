import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const AdminAccess = () => {
  const { profile, isAuthenticated, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  // Memoize the visibility logic to prevent unnecessary re-renders
  const shouldShowButton = useMemo(() => {
    return !isLoading && isAuthenticated && isAdmin;
  }, [isLoading, isAuthenticated, isAdmin]);

  // Early return with transition-friendly approach
  if (!shouldShowButton) {
    return (
      <div
        className="opacity-0 pointer-events-none transition-opacity duration-200"
        aria-hidden="true"
      />
    );
  }

  const handleAdminAccess = () => {
    // Direct access to admin page for authenticated admin users
    navigate("/admin");
  };

  return (
    <div className="opacity-100 transition-opacity duration-200">
      <Button
        onClick={handleAdminAccess}
        variant="outline"
        className="flex items-center hover:bg-book-100 min-h-[44px] touch-manipulation transition-all duration-200"
      >
        <Shield className="mr-2 h-4 w-4" />
        <span>Admin</span>
      </Button>
    </div>
  );
};

export default memo(AdminAccess);
