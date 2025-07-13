import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Flag } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import AdminReportsTab from "@/components/admin/AdminReportsTab";

const AdminReports = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (!isAdmin) {
    navigate("/");
    return null;
  }

  return (
    <Layout>
      <div
        className={`container mx-auto ${isMobile ? "px-2" : "px-4"} py-4 md:py-8 max-w-full overflow-hidden`}
      >
        {/* Mobile-optimized Header */}
        <div
          className={`flex items-center gap-4 mb-4 ${isMobile ? "px-2" : ""}`}
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-book-600 hover:text-book-700 flex-shrink-0 min-h-[44px] btn-mobile"
            size={isMobile ? "sm" : "default"}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {isMobile ? "" : "Back"}
          </Button>

          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Flag
              className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} text-red-600 flex-shrink-0`}
            />
            <h1
              className={`${isMobile ? "text-base" : "text-2xl"} font-bold text-book-800 truncate`}
            >
              {isMobile ? "Reports" : "Reports & Moderation"}
            </h1>
          </div>
        </div>

        {/* Main Content with better mobile layout */}
        <div
          className={`bg-white rounded-lg shadow-md ${isMobile ? "p-1 card-mobile" : "p-3 md:p-6"} min-h-[calc(100vh-150px)] overflow-hidden`}
        >
          <AdminReportsTab />
        </div>
      </div>
    </Layout>
  );
};

export default AdminReports;
