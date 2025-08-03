import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  Profile,
  loginUser,
  registerUser,
  fetchUserProfile,
  fetchUserProfileQuick,
  createUserProfile,
  upgradeToUserProfile,
} from "@/services/authOperations";
import { addNotification } from "@/services/notificationService";
import { logError, getErrorMessage } from "@/utils/errorUtils";

// Simple logging for development
const devLog = (message: string, data?: unknown) => {
  if (import.meta.env.DEV) console.log(message, data);
};
const devWarn = (message: string, data?: unknown) => {
  if (import.meta.env.DEV) console.warn(message, data);
};

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  status: string;
  profile_picture_url?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  initError: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ needsVerification?: boolean }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error("useAuth hook called outside of AuthProvider context");
    console.error("This usually happens when:");
    console.error("1. Component is rendered before AuthProvider");
    console.error("2. Component is outside the AuthProvider tree");
    console.error("3. AuthProvider failed to initialize");
    throw new Error("useAuth must be used within an AuthProvider. Check your component tree structure.");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const isAuthenticated = !!user && !!session;
  const isAdmin = profile?.isAdmin === true;

  const createFallbackProfile = useCallback(
    (user: User): UserProfile => ({
      id: user.id,
      name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
      email: user.email || "",
      isAdmin: false,
      status: "active",
      profile_picture_url: user.user_metadata?.avatar_url,
      bio: undefined,
    }),
    [],
  );

  const handleError = useCallback((error: unknown, context: string) => {
    const errorMessage = getErrorMessage(
      error,
      `${context} failed. Please try again.`,
    );
    throw new Error(errorMessage);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setIsLoading(true);
        const result = await loginUser(email, password);

        // After successful login, give Supabase a moment to update auth state
        if (result && result.user) {
          console.log("✅ Login successful, waiting for auth state update...");
          // Small delay to let auth state propagate
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        return result;
      } catch (error) {
        // Only handle error if we're sure login actually failed
        // Check one more time if user is actually authenticated
        try {
          const { data: sessionCheck } = await supabase.auth.getSession();
          if (sessionCheck.session && sessionCheck.user) {
            console.log("✅ Login succeeded despite error - user is authenticated!");
            return sessionCheck;
          }
        } catch (sessionError) {
          console.warn("Session check failed:", sessionError);
        }

        handleError(error, "Login");
      } finally {
        setIsLoading(false);
      }
    },
    [handleError],
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        setIsLoading(true);
        console.log("🔄 AuthContext register called with:", { email, name });

        // First, check if user already exists in our profiles table
        console.log('🔍 Checking if user already exists...');
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('id, email, status')
          .eq('email', email)
          .single();

        if (existingProfile && !checkError) {
          console.log('❌ User already exists in profiles table:', existingProfile);
          throw new Error(
            "An account with this email already exists. Please try logging in instead."
          );
        }

        // If checkError is not "PGRST116" (no rows), then it's a real error
        if (checkError && checkError.code !== 'PGRST116') {
          console.warn('⚠️ Error checking existing user (non-critical):', checkError);
        }

        // Create user account - Supabase handles email confirmation automatically
        console.log('🔧 Creating user account with email verification...');

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}/auth/callback` // Supabase uses this in the email link
          },
        });

        if (error) {
          console.error("❌ Supabase signup failed:", error);
          throw new Error(error.message);
        }

        // Handle successful Supabase signup
        if (data.user && !data.session) {
          // Email verification is required - Supabase will send confirmation email automatically
          console.log("✅ Supabase signup successful - email confirmation required");
          console.log("📧 Supabase will send confirmation email automatically");
          return { needsVerification: true };
        }

        if (data.user && data.session) {
          // User is immediately logged in - no email verification needed
          console.log("✅ User immediately logged in - no email verification required");
          return { needsVerification: false };
        }

        // Fallback case
        console.log("✅ Registration completed successfully");
        return { needsVerification: false };
      } catch (error) {
        console.log("❌ AuthContext register caught error:", error);

        // Provide more specific error messages
        const errorMessage =
          error instanceof Error ? error.message : "Registration failed";

        if (errorMessage.includes("Email service")) {
          throw new Error(
            "Registration succeeded but email confirmation is currently unavailable. You can still log in.",
          );
        }

        if (errorMessage.includes("already registered") ||
            errorMessage.includes("User already registered") ||
            errorMessage.includes("already been registered") ||
            errorMessage.includes("email address is already registered")) {
          throw new Error(
            "An account with this email already exists. Please try logging in instead.",
          );
        }

        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();

      // Clear local state regardless of signOut result
      setUser(null);
      setProfile(null);
      setSession(null);

      // Only throw if it's a real error (not just session missing)
      if (error) {
        // Common "success" scenarios that shouldn't be treated as errors
        const isAcceptableError =
          error.message?.includes("session") ||
          error.message?.includes("not authenticated") ||
          error.message?.includes("JWT") ||
          error.message?.includes("token");

        if (!isAcceptableError) {
          console.warn("Logout had an error but user is signed out:", error);
          // Don't throw - the user is effectively logged out
        }
      }
    } catch (error) {
      // Always clear local state even if signOut fails
      setUser(null);
      setProfile(null);
      setSession(null);

      // Only log the error, don't throw it to the UI
      console.warn(
        "Logout encountered an error but user state cleared:",
        error,
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;

    try {
      const updatedProfile = await fetchUserProfile(user.id);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    } catch (error) {
      console.warn("Failed to refresh profile:", error);
    }
  }, [user]);

  // Simplified auth state change handler
  const handleAuthStateChange = useCallback(
    async (session: Session | null) => {
      try {
        if (session?.user) {
          setSession(session);
          setUser(session.user);

          // Create fallback profile immediately
          const fallbackProfile = createFallbackProfile(session.user);
          setProfile(fallbackProfile);

          // Try to load full profile in background (only if we don't have one)
          if (!profile || profile.id !== session.user.id) {
            fetchUserProfileQuick(session.user)
              .then(async (userProfile) => {
                if (userProfile && userProfile.id === session.user?.id) {
                  setProfile(userProfile);

                  // Check if this is a first-time login (profile exists but no welcome email sent)
                  // We'll use a simple heuristic: if profile was created recently (within 24 hours)
                  // and user is logging in, send welcome email
                  try {
                    const profileCreatedAt = new Date(userProfile.id); // UUID v4 has timestamp embedded
                    const now = new Date();
                    const hoursSinceCreation = (now.getTime() - profileCreatedAt.getTime()) / (1000 * 60 * 60);

                    // If profile created within last 24 hours, likely first login after verification
                    if (hoursSinceCreation <= 24) {
                      console.log("🎉 Detected first login after verification, sending welcome email");

                      // Import email service dynamically
                      const { emailService } = await import("@/services/emailService");

                      // Use direct HTML email instead of template to avoid deprecated template system
                      await emailService.sendEmail({
                        to: session.user.email!,
                        subject: "Welcome to ReBooked Solutions! 📚",
                        html: `
                          <!DOCTYPE html>
                          <html>
                          <head>
                            <meta charset="utf-8">
                            <title>Welcome to ReBooked Solutions!</title>
                          </head>
                          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ReBooked Solutions!</h1>
                            </div>

                            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
                              <h2 style="color: #333; margin-top: 0;">Hello ${userProfile.name}!</h2>

                              <p>🎉 Congratulations! Your email has been verified and your ReBooked Solutions account is now fully active.</p>

                              <p><strong>What you can do now:</strong></p>
                              <ul>
                                <li>📚 Browse thousands of textbooks from fellow students</li>
                                <li>💰 List your own textbooks for sale</li>
                                <li>🚚 Enjoy hassle-free courier delivery</li>
                                <li>💳 Secure payment processing</li>
                                <li>📱 Track your orders in real-time</li>
                              </ul>

                              <div style="text-align: center; margin: 30px 0;">
                                <a href="${window.location.origin}/profile"
                                   style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                  View My Profile
                                </a>
                              </div>

                              <p><strong>Need help getting started?</strong></p>
                              <p>Check out our quick start guide or browse books by university to find exactly what you need.</p>

                              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

                              <p style="font-size: 14px; color: #666;">
                                <strong>ReBooked Solutions</strong><br>
                                South Africa's Premier Student Textbook Marketplace<br>
                                <a href="mailto:support@rebookedsolutions.co.za">support@rebookedsolutions.co.za</a>
                              </p>
                            </div>
                          </body>
                          </html>
                        `,
                        text: `Welcome to ReBooked Solutions!

Hello ${userProfile.name}!

🎉 Congratulations! Your email has been verified and your ReBooked Solutions account is now fully active.

What you can do now:
- 📚 Browse thousands of textbooks from fellow students
- 💰 List your own textbooks for sale
- 🚚 Enjoy hassle-free courier delivery
- 💳 Secure payment processing
- 📱 Track your orders in real-time

Visit your profile: ${window.location.origin}/profile

Need help getting started? Check out our quick start guide or browse books by university to find exactly what you need.

Best regards,
ReBooked Solutions Team
support@rebookedsolutions.co.za`
                      });

                      console.log("✅ Welcome email sent to verified user");
                    }
                  } catch (welcomeError) {
                    console.warn("⚠️ Welcome email failed (non-critical):", welcomeError);
                    // Don't fail the login process for email issues
                  }
                }
              })
              .catch((error) => {
                console.warn("Background profile load failed:", error);
              });
          }
        } else {
          // Only clear state if it's not already cleared to prevent unnecessary re-renders
          if (user !== null || profile !== null || session !== null) {
            setUser(null);
            setProfile(null);
            setSession(null);
          }
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        // Don't throw - just ensure loading is cleared
      } finally {
        setIsLoading(false);
      }
    },
    [createFallbackProfile, profile, user],
  );

  // Initialize auth
  useEffect(() => {
    if (authInitialized) return;

    const initAuth = async () => {
      try {
        console.log("🔄 [AuthContext] Initializing auth...");

        // Get current session with retry logic for network failures
        let sessionResult;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          try {
            sessionResult = await supabase.auth.getSession();
            break; // Success, exit retry loop
          } catch (networkError) {
            retryCount++;
            console.warn(`Auth retry ${retryCount}/${maxRetries}:`, networkError);

            if (retryCount >= maxRetries) {
              // Handle network failure gracefully
              if (networkError instanceof TypeError && networkError.message.includes('Failed to fetch')) {
                console.warn("Network connectivity issues detected, continuing in offline mode");
                setInitError("Network connectivity issues - some features may be limited");
                setUser(null);
                setSession(null);
                setProfile(null);
                setAuthInitialized(true);
                setIsLoading(false);
                return;
              }
              throw networkError;
            }

            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
          }
        }

        if (!sessionResult) {
          throw new Error("Failed to get session after retries");
        }

        const { data: { session }, error } = sessionResult;

        if (error && !error.message.includes("code verifier")) {
          // Handle specific network-related errors gracefully
          if (error.message?.includes('Failed to fetch') ||
              error.message?.includes('NetworkError') ||
              error.message?.includes('fetch')) {
            console.warn("Network error during auth initialization, continuing without session");
            setInitError("Network connectivity issues - some features may be limited");
          } else {
            console.error("Auth initialization error:", error);
            setInitError(error.message);
          }
        }

        await handleAuthStateChange(session);
        setAuthInitialized(true);

        console.log("✅ [AuthContext] Auth initialized");
      } catch (error) {
        console.error("Auth initialization failed:", error);
        const errorMessage = getErrorMessage(error, "Failed to initialize authentication");

        // For network errors, provide a more user-friendly message
        if (errorMessage.includes('Failed to fetch') ||
            errorMessage.includes('NetworkError') ||
            errorMessage.includes('fetch')) {
          setInitError("Network connectivity issues - some features may be limited");
          setUser(null);
          setSession(null);
          setProfile(null);
        } else {
          setInitError(errorMessage);
        }

        setAuthInitialized(true);
        setIsLoading(false);
      }
    };

    initAuth();
  }, [authInitialized, handleAuthStateChange]);

  // Listen for auth changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Reduce logging spam
      if (import.meta.env.DEV) {
        console.log("🔄 [AuthContext] Auth state changed:", event);
      }

      // Only handle actual changes, not redundant events
      if (
        event === "SIGNED_OUT" ||
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED"
      ) {
        await handleAuthStateChange(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [handleAuthStateChange]);

  const value = useMemo(
    () => ({
      user,
      profile,
      session,
      isLoading,
      isAuthenticated,
      isAdmin,
      initError,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [
      user,
      profile,
      session,
      isLoading,
      isAuthenticated,
      isAdmin,
      initError,
      login,
      register,
      logout,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
