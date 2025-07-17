import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";

// Suppress harmless ResizeObserver warnings
import "./utils/suppressResizeObserverError";
// Suppress harmless network and third-party script errors
import "./utils/suppressNetworkErrors";
// Network debugging utility for development
import "./utils/networkDebugger";
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

import ComingSoon from "./pages/ComingSoon";
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

// Full app is now restored!

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
                      <Route path="/" element={<Index />} />
                      <Route path="/books" element={<BookListing />} />
                      <Route path="/books/:id" element={<BookDetails />} />
                      <Route path="/book/:id" element={<BookDetails />} />
                      <Route
                        path="/seller/:sellerId"
                        element={<SellerProfile />}
                      />
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
                      <Route path="/confirm" element={<Confirm />} />
                      <Route
                        path="/confirm-email-change"
                        element={<ConfirmEmailChange />}
                      />

                      {/* University and Campus Routes */}
                      <Route
                        path="/university-info"
                        element={<UniversityInfo />}
                      />
                      <Route
                        path="/university-profile"
                        element={<ModernUniversityProfile />}
                      />
                      <Route
                        path="/university/:id"
                        element={<UniversityProfile />}
                      />
                      <Route
                        path="/study-resources"
                        element={<StudyResources />}
                      />
                      <Route path="/study-tips" element={<StudyResources />} />
                      <Route path="/aps-demo" element={<APSDemo />} />

                      {/* Shopping and Cart Routes */}
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout/:id" element={<Checkout />} />

                      <Route path="/shipping" element={<Shipping />} />

                      {/* Support and Info Pages */}
                      <Route path="/contact" element={<ContactUs />} />
                      <Route path="/faq" element={<FAQ />} />
                      <Route path="/policies" element={<Policies />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/terms" element={<Terms />} />

                      {/* Protected Routes */}
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <Profile />
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
                        path="/create-listing"
                        element={
                          <ProtectedRoute>
                            <CreateListing />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/edit-book/:id"
                        element={
                          <ProtectedRoute>
                            <EditBook />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/notifications"
                        element={
                          <ProtectedRoute>
                            <Notifications />
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
                        path="/activity"
                        element={
                          <ProtectedRoute>
                            <ActivityLog />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/report"
                        element={
                          <ProtectedRoute>
                            <Report />
                          </ProtectedRoute>
                        }
                      />

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
                        path="/admin/function-testing"
                        element={
                          <AdminProtectedRoute>
                            <FunctionTesting />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/email-testing"
                        element={
                          <AdminProtectedRoute>
                            <EmailTesting />
                          </AdminProtectedRoute>
                        }
                      />

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Router>
                </CartProvider>
              </AuthProvider>
            </GoogleMapsProvider>
          </ThemeProvider>
        </QueryClientProvider>
        <Analytics />
      </NetworkErrorBoundary>
    </ErrorBoundary>
  );
}
export default App;
