import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Toaster } from "@/components/ui/sonner";
import ConnectionStatus from "./ConnectionStatus";
import PayoutNotifications from "./admin/PayoutNotifications";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user } = useAuth();

  // Check if user is admin - multiple ways to detect admin status
  const isAdmin = user && (
    user.user_metadata?.role === 'admin' ||
    user.user_metadata?.is_admin === true ||
    user.email?.includes('admin') ||
    user.app_metadata?.role === 'admin'
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 mobile-container">
      <Navbar />
      <main className="flex-1 w-full overflow-x-hidden">
        <div className="w-full max-w-full">{children}</div>
      </main>
      <Footer />
      <ConnectionStatus />
      {isAdmin && <PayoutNotifications />}
      <Toaster
        position="top-center"
        toastOptions={{
          className: "mobile-toast",
          duration: 2000,
        }}
      />
    </div>
  );
};

export default Layout;
