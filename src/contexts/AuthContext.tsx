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
    throw new Error("useAuth must be used within an AuthProvider");
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
        return result;
      } catch (error) {
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

        const result = await registerUser(name, email, password);
        console.log("🔄 registerUser returned:", result);

        // For successful registration that requires email verification,
        // Supabase returns a user but no session
        if (result.user && !result.session) {
          console.log(
            "✅ Registration successful, email verification required",
          );
          return { needsVerification: true };
        }

        // For successful registration with auto-login
        if (result.user && result.session) {
          console.log("✅ Registration successful with auto-login");
          return { needsVerification: false };
        }

        console.log("⚠️ Unexpected result from registerUser:", result);
        return result;
      } catch (error) {
        console.log("❌ AuthContext register caught error:", error);
        handleError(error, "Registration");
      } finally {
        setIsLoading(false);
      }
    },
    [handleError],
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
              .then((userProfile) => {
                if (userProfile && userProfile.id === session.user?.id) {
                  setProfile(userProfile);
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
    [createFallbackProfile],
  );

  // Initialize auth
  useEffect(() => {
    if (authInitialized) return;

    const initAuth = async () => {
      try {
        console.log("🔄 [AuthContext] Initializing auth...");

        // Get current session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error && !error.message.includes("code verifier")) {
          console.error("Auth initialization error:", error);
          setInitError(error.message);
        }

        await handleAuthStateChange(session);
        setAuthInitialized(true);

        console.log("✅ [AuthContext] Auth initialized");
      } catch (error) {
        console.error("Auth initialization failed:", error);
        setInitError(
          getErrorMessage(error, "Failed to initialize authentication"),
        );
        setIsLoading(false);
      }
    };

    initAuth();
  }, [authInitialized]);

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
