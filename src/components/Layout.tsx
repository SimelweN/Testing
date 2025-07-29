import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Toaster } from "@/components/ui/sonner";
import ConnectionStatus from "./ConnectionStatus";

import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  // Defensive auth handling with fallback
  let user = null;
  let isAdmin = false;

  try {
    const auth = useAuth();
    user = auth.user;

    // Check if user is admin - multiple ways to detect admin status
    isAdmin = user && (
      user.user_metadata?.role === 'admin' ||
      user.user_metadata?.is_admin === true ||
      user.email?.includes('admin') ||
      user.app_metadata?.role === 'admin'
    );
  } catch (error) {
    console.warn("Auth context not available in Layout, using default values");
    // Fallback to no user if auth context is not available
    user = null;
    isAdmin = false;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 mobile-container">
      <Navbar />
      <main className="flex-1 w-full overflow-x-hidden">
        <div className="w-full max-w-full">{children}</div>
      </main>
      <Footer />
      <ConnectionStatus />

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
