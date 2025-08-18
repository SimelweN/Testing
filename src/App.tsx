import React, { lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Suppress harmless ResizeObserver warnings
import "./utils/suppressResizeObserverError";
// Loading state manager to prevent white screens
import "./utils/loadingStateManager";
// Test Supabase connection in development
import "./utils/testSupabaseConnection";
// Debug contact messages
import "./utils/debugContactMessages";
// Test notifications
import "./utils/testNotifications";

import { ThemeProvider } from "next-themes";
import ErrorBoundary from "./components/ErrorBoundary";
import NetworkErrorBoundary from "./components/NetworkErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import AuthErrorHandler from "./components/AuthErrorHandler";
import GoogleMapsProvider from "./contexts/GoogleMapsContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

// Main Pages
import Index from "./pages/Index";
import BookListing from "./pages/BookListing";
import BookDetails from "./pages/BookDetails";
import EditBook from "./pages/EditBook";
import Profile from "./pages/Profile";
import CreateListing from "./pages/CreateListing";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";

// University Pages
import UniversityInfo from "./pages/UniversityInfo";
import UniversityProfile from "./pages/UniversityProfile";
import StudyResources from "./pages/StudyResources";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Verify from "./pages/Verify";
import VerifyDebug from "./pages/VerifyDebug";
import AuthCallback from "./pages/AuthCallback";
import EnvironmentConfigHelper from "./components/EnvironmentConfigHelper";

// Admin Pages
import Admin from "./pages/Admin";
import AdminReports from "./pages/AdminReports";
import PhotoUploadDemo from "./pages/PhotoUploadDemo";

// Support Pages
import ContactUs from "./pages/ContactUs";
import ContactTest from "./pages/ContactTest";
import FAQ from "./pages/FAQ";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Policies from "./pages/Policies";
import Shipping from "./pages/Shipping";
import Report from "./pages/Report";
import SellerProfile from "./pages/SellerProfile";

// Other Pages
import NotificationsNew from "./pages/NotificationsNew";
import NotificationTest from "./pages/NotificationTest";
import ClearNotifications from "./pages/ClearNotifications";
import RestoreBooks from "./pages/RestoreBooks";
import TestAuth from "./pages/TestAuth";
import TestEmailSystem from "./pages/TestEmailSystem";
import ActivityLog from "./pages/ActivityLog";
import BankingSetup from "./pages/BankingSetup";
import UserProfile from "./pages/UserProfile";
// import LockerSearchPage from "./pages/LockerSearchPage"; // DISABLED - Locker functionality removed


import "./App.css";

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Full application routing restored

function App() {
  // Check environment configuration first
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const isEnvironmentConfigured = !!(
    supabaseUrl &&
    supabaseUrl.trim() !== "" &&
    supabaseUrl !== "undefined" &&
    supabaseKey &&
    supabaseKey.trim() !== "" &&
    supabaseKey !== "undefined"
  );

  // Show configuration helper if environment is not properly set up
  if (!isEnvironmentConfigured) {
    return <EnvironmentConfigHelper />;
  }

  return (
    <ErrorBoundary level="app">
      <NetworkErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="light">
            <GoogleMapsProvider>
              <AuthProvider>
                <CartProvider>
                  <Router>
                    <AuthErrorHandler />
                    <ScrollToTop />

                    <Routes>
                      {/* Main Application Routes */}
                      <Route path="/" element={<Index />} />
                      <Route path="/books" element={<BookListing />} />
                      <Route path="/books/:id" element={<BookDetails />} />
                      <Route
                        path="/edit-book/:id"
                        element={
                          <ProtectedRoute>
                            <EditBook />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/university-info"
                        element={<UniversityInfo />}
                      />
                      <Route
                        path="/university/:id"
                        element={<UniversityProfile />}
                      />
                      <Route
                        path="/study-resources"
                        element={<StudyResources />}
                      />
                      <Route
                        path="/study-tips"
                        element={<Navigate to="/study-resources" replace />}
                      />
                      <Route
                        path="/seller/:sellerId"
                        element={<SellerProfile />}
                      />

                      {/* Authentication Routes */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route
                        path="/forgot-password"
                        element={<ForgotPassword />}
                      />
                      <Route
                        path="/reset-password"
                        element={<ResetPassword />}
                      />
                      <Route path="/verify" element={<Verify />} />
                      <Route path="/verify/*" element={<VerifyEmail />} />
                      {import.meta.env.DEV && (
                        <Route path="/verify-debug" element={<VerifyDebug />} />
                      )}
                      <Route path="/auth/callback" element={<AuthCallback />} />

                      {/* Protected User Routes */}
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/create-listing"
                        element={
                          <ProtectedRoute>
                            <CreateListing />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/cart"
                        element={
                          <ProtectedRoute>
                            <Cart />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/checkout"
                        element={
                          <ProtectedRoute>
                            <Checkout />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/checkout/:id"
                        element={
                          <ProtectedRoute>
                            <Checkout />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/checkout-cart"
                        element={
                          <ProtectedRoute>
                            <Checkout />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/notifications"
                        element={
                          <ProtectedRoute>
                            <NotificationsNew />
                          </ProtectedRoute>
                        }
                      />
                      {import.meta.env.DEV && (
                        <Route
                          path="/notification-test"
                          element={
                            <ProtectedRoute>
                              <NotificationTest />
                            </ProtectedRoute>
                          }
                        />
                      )}
                      <Route
                        path="/clear-notifications"
                        element={
                          <ProtectedRoute>
                            <ClearNotifications />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/restore-books"
                        element={
                          <ProtectedRoute>
                            <RestoreBooks />
                          </ProtectedRoute>
                        }
                      />
                      {import.meta.env.DEV && (
                        <Route
                          path="/test-auth"
                          element={<TestAuth />}
                        />
                      )}
                      {import.meta.env.DEV && (
                        <Route
                          path="/test-email"
                          element={<TestEmailSystem />}
                        />
                      )}
                      <Route
                        path="/activity"
                        element={
                          <ProtectedRoute>
                            <ActivityLog />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/banking-setup"
                        element={
                          <ProtectedRoute>
                            <BankingSetup />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/user-profile"
                        element={
                          <ProtectedRoute>
                            <UserProfile />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/sell"
                        element={
                          <ProtectedRoute>
                            <CreateListing />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        }
                      />
                      {/* DISABLED - Locker functionality removed */}
                      {/* <Route
                        path="/lockers"
                        element={<LockerSearchPage />}
                      /> */}

                                            {/* Admin Routes */}
                      <Route
                        path="/admin"
                        element={
                          <AdminProtectedRoute>
                            <Admin />
                          </AdminProtectedRoute>
                        }
                      />
                                            <Route
                        path="/admin/reports"
                        element={
                          <AdminProtectedRoute>
                            <AdminReports />
                          </AdminProtectedRoute>
                        }
                      />

                      <Route
                        path="/photo-upload-demo"
                        element={<PhotoUploadDemo />}
                      />

                      {/* Support Routes */}
                      <Route path="/contact" element={<ContactUs />} />
                      <Route path="/contact-test" element={<ContactTest />} />
                      <Route path="/faq" element={<FAQ />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/policies" element={<Policies />} />
                      <Route path="/shipping" element={<Shipping />} />
                                            <Route path="/report" element={<Report />} />


                      {/* 404 Catch All */}
                      <Route path="*" element={<Index />} />
                    </Routes>
                  </Router>
                </CartProvider>
              </AuthProvider>
            </GoogleMapsProvider>
          </ThemeProvider>
        </QueryClientProvider>
        <Analytics />
        <SpeedInsights />
      </NetworkErrorBoundary>
    </ErrorBoundary>
  );
}
export default App;
