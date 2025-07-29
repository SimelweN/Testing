import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Suppress harmless ResizeObserver warnings
import "./utils/suppressResizeObserverError";
// Loading state manager to prevent white screens
import "./utils/loadingStateManager";

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
import LoadingSpinner from "./components/ui/LoadingSpinner";

// Lazy load all pages for code splitting
// Critical pages (load immediately)
import Index from "./pages/Index";
import Login from "./pages/Login";

// Main Pages (lazy loaded)
const BookListing = lazy(() => import("./pages/BookListing"));
const BookDetails = lazy(() => import("./pages/BookDetails"));
const Profile = lazy(() => import("./pages/Profile"));
const CreateListing = lazy(() => import("./pages/CreateListing"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));

// University Pages (lazy loaded)
const UniversityInfo = lazy(() => import("./pages/UniversityInfo"));
const UniversityProfile = lazy(() => import("./pages/UniversityProfile"));
const StudyResources = lazy(() => import("./pages/StudyResources"));

// Auth Pages (lazy loaded)
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Verify = lazy(() => import("./pages/Verify"));
const VerifyDebug = lazy(() => import("./pages/VerifyDebug"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));

// Admin Pages (lazy loaded)
const Admin = lazy(() => import("./pages/Admin"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const Developer = lazy(() => import("./pages/Developer"));

// Support Pages (lazy loaded)
const ContactUs = lazy(() => import("./pages/ContactUs"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Policies = lazy(() => import("./pages/Policies"));
const Shipping = lazy(() => import("./pages/Shipping"));
const Report = lazy(() => import("./pages/Report"));
const SellerProfile = lazy(() => import("./pages/SellerProfile"));

// Other Pages (lazy loaded)
const NotificationsNew = lazy(() => import("./pages/NotificationsNew"));
const ActivityLog = lazy(() => import("./pages/ActivityLog"));
const BankingSetup = lazy(() => import("./pages/BankingSetup"));
const UserProfile = lazy(() => import("./pages/UserProfile"));

// Loading component wrapper
const LazyPageWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingSpinner />}>
    {children}
  </Suspense>
);


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
                      <Route path="/books" element={<LazyPageWrapper><BookListing /></LazyPageWrapper>} />
                      <Route path="/books/:id" element={<LazyPageWrapper><BookDetails /></LazyPageWrapper>} />
                      <Route
                        path="/university-info"
                        element={<LazyPageWrapper><UniversityInfo /></LazyPageWrapper>}
                      />
                      <Route
                        path="/university/:id"
                        element={<LazyPageWrapper><UniversityProfile /></LazyPageWrapper>}
                      />
                      <Route
                        path="/study-resources"
                        element={<LazyPageWrapper><StudyResources /></LazyPageWrapper>}
                      />
                      <Route
                        path="/study-tips"
                        element={<Navigate to="/study-resources" replace />}
                      />
                      <Route
                        path="/seller/:sellerId"
                        element={<LazyPageWrapper><SellerProfile /></LazyPageWrapper>}
                      />

                      {/* Authentication Routes */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<LazyPageWrapper><Register /></LazyPageWrapper>} />
                      <Route
                        path="/forgot-password"
                        element={<LazyPageWrapper><ForgotPassword /></LazyPageWrapper>}
                      />
                      <Route
                        path="/reset-password"
                        element={<LazyPageWrapper><ResetPassword /></LazyPageWrapper>}
                      />
                      <Route path="/verify" element={<LazyPageWrapper><Verify /></LazyPageWrapper>} />
                      <Route path="/verify/*" element={<LazyPageWrapper><VerifyEmail /></LazyPageWrapper>} />
                      <Route path="/verify-debug" element={<LazyPageWrapper><VerifyDebug /></LazyPageWrapper>} />
                      <Route path="/auth/callback" element={<LazyPageWrapper><AuthCallback /></LazyPageWrapper>} />

                      {/* Protected User Routes */}
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <LazyPageWrapper><Profile /></LazyPageWrapper>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/create-listing"
                        element={
                          <ProtectedRoute>
                            <LazyPageWrapper><CreateListing /></LazyPageWrapper>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/cart"
                        element={
                          <ProtectedRoute>
                            <LazyPageWrapper><Cart /></LazyPageWrapper>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/checkout"
                        element={
                          <ProtectedRoute>
                            <LazyPageWrapper><Checkout /></LazyPageWrapper>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/checkout/:id"
                        element={
                          <ProtectedRoute>
                            <LazyPageWrapper><Checkout /></LazyPageWrapper>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/checkout-cart"
                        element={
                          <ProtectedRoute>
                            <LazyPageWrapper><Checkout /></LazyPageWrapper>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/notifications"
                        element={
                          <ProtectedRoute>
                            <LazyPageWrapper><NotificationsNew /></LazyPageWrapper>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/activity"
                        element={
                          <ProtectedRoute>
                            <LazyPageWrapper><ActivityLog /></LazyPageWrapper>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/banking-setup"
                        element={
                          <ProtectedRoute>
                            <LazyPageWrapper><BankingSetup /></LazyPageWrapper>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/user-profile"
                        element={
                          <ProtectedRoute>
                            <LazyPageWrapper><UserProfile /></LazyPageWrapper>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/sell"
                        element={
                          <ProtectedRoute>
                            <LazyPageWrapper><CreateListing /></LazyPageWrapper>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute>
                            <LazyPageWrapper><Profile /></LazyPageWrapper>
                          </ProtectedRoute>
                        }
                      />

                      {/* Admin Routes */}
                      <Route
                        path="/admin"
                        element={
                          <AdminProtectedRoute>
                            <LazyPageWrapper><Admin /></LazyPageWrapper>
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/reports"
                        element={
                          <AdminProtectedRoute>
                            <LazyPageWrapper><AdminReports /></LazyPageWrapper>
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/developer"
                        element={
                          <AdminProtectedRoute>
                            <LazyPageWrapper><Developer /></LazyPageWrapper>
                          </AdminProtectedRoute>
                        }
                      />

                      {/* Support Routes */}
                      <Route path="/contact" element={<LazyPageWrapper><ContactUs /></LazyPageWrapper>} />
                      <Route path="/faq" element={<LazyPageWrapper><FAQ /></LazyPageWrapper>} />
                      <Route path="/privacy" element={<LazyPageWrapper><Privacy /></LazyPageWrapper>} />
                      <Route path="/terms" element={<LazyPageWrapper><Terms /></LazyPageWrapper>} />
                      <Route path="/policies" element={<LazyPageWrapper><Policies /></LazyPageWrapper>} />
                      <Route path="/shipping" element={<LazyPageWrapper><Shipping /></LazyPageWrapper>} />
                      <Route path="/report" element={<LazyPageWrapper><Report /></LazyPageWrapper>} />

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
