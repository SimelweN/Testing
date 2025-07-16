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
import loadingStateManager from "@/utils/loadingStateManager";

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

  // Debug logging
  console.log("🔍 [AuthContext] Current loading state:", isLoading);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Ref to track current state and prevent duplicate updates
  const currentUserIdRef = useRef<string | null>(null);

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

  const refreshProfile = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const updatedProfile = await fetchUserProfileQuick(user);

      if (updatedProfile) {
        setProfile(updatedProfile);
        console.log("✅ Profile refreshed successfully");
      } else {
        // Use fallback profile
        const fallbackProfile = createFallbackProfile(user);
        setProfile(fallbackProfile);
        console.log("ℹ️ Using fallback profile after refresh");
      }
    } catch (error) {
      logError("Profile refresh failed", error);
      // Keep existing profile on error
    } finally {
      setIsLoading(false);
    }
  }, [user, createFallbackProfile]);

  const upgradeProfileIfNeeded = useCallback(
    async (currentUser: User) => {
      try {
        // Only upgrade if we have a basic fallback profile
        if (profile && !profile.bio && !profile.profile_picture_url) {
          const fullProfile = await fetchUserProfileQuick(currentUser);
          if (fullProfile && fullProfile !== profile) {
            setProfile(fullProfile);
            console.log("✅ Profile upgraded successfully");
          }
        }
      } catch (error) {
        // Don't log upgrade failures as errors since it's not critical
        console.log("ℹ️ Profile upgrade skipped");
      }
    },
    [profile],
  );

  const handleAuthStateChange = useCallback(
    async (session: Session, event?: string) => {
      try {
        console.log("🔄 [AuthContext] Handling auth state change:", {
          event,
          userId: session.user?.id,
        });

        if (session.user) {
          // Check if this is actually a new user to prevent unnecessary updates
          if (currentUserIdRef.current !== session.user.id) {
            currentUserIdRef.current = session.user.id;

            // Batch state updates to prevent multiple re-renders and glitching
            const fallbackProfile = createFallbackProfile(session.user);

            // Use React's automatic batching by updating state synchronously
            setSession(session);
            setUser(session.user);
            setProfile(fallbackProfile);
            setIsLoading(false); // Immediately stop loading for UI responsiveness

            console.log(
              "ℹ️ [AuthContext] Auth state updated for new user:",
              session.user.id,
            );
          } else {
            console.log(
              "ℹ️ [AuthContext] Skipping duplicate auth update for same user",
            );
          }

          // Try to load full profile in background (non-blocking)
          fetchUserProfileQuick(session.user)
            .then((userProfile) => {
              if (userProfile && userProfile.id === session.user?.id) {
                // Only update if profile belongs to the same user (prevent race conditions)
                setProfile(userProfile);
                console.log(
                  "✅ [AuthContext] Background profile load successful",
                );
              }
            })
            .catch((profileError) => {
              console.log(
                "ℹ️ [AuthContext] Background profile load failed, keeping fallback",
              );
            });

          // Add welcome notification for NEW sign-ups only (not existing logins)
          if (event === "SIGNED_UP" && !isInitializing) {
            try {
              const welcomeKey = `firstTimeWelcome_${session.user.id}`;
              const hasReceivedWelcome = localStorage.getItem(welcomeKey);

              // Only send welcome notification for first-time users who haven't received it before
              if (!hasReceivedWelcome) {
                localStorage.setItem(welcomeKey, Date.now().toString());

                addNotification({
                  userId: session.user.id,
                  title: "Welcome to ReBooked Solutions!",
                  message: `Thanks for joining us! Explore books, campus resources, and connect with students.`,
                  type: "success",
                  read: false,
                }).catch((notifError) => {
                  console.warn(
                    "[AuthContext] Welcome notification failed:",
                    notifError,
                  );
                  // Remove the flag if notification failed
                  localStorage.removeItem(welcomeKey);
                });
              }
            } catch (notifError) {
              console.warn(
                "[AuthContext] Welcome notification setup failed:",
                notifError,
              );
            }
          }

          // Background profile maintenance (every 30 seconds)
          setTimeout(() => {
            if (session?.user) {
              upgradeProfileIfNeeded(session.user);
            }
          }, 2000);

          const upgradeInterval = setInterval(() => {
            if (session?.user) {
              upgradeProfileIfNeeded(session.user);
            }
          }, 30000);

          return () => clearInterval(upgradeInterval);
        }
      } catch (error) {
        console.error("[AuthContext] Auth state change failed:", {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          type: error instanceof Error ? error.constructor.name : typeof error,
        });

        // Don't throw - use fallback profile and ensure loading resolves
        if (session.user) {
          const fallbackProfile = createFallbackProfile(session.user);
          setProfile(fallbackProfile);
        }
        setIsLoading(false);
      }
    },
    [createFallbackProfile, upgradeProfileIfNeeded, isInitializing],
  );

    const initializeAuth = useCallback(async () => {
    if (authInitialized) return;

    console.log("🔄 [AuthContext] Initializing auth...");

    try {
      setIsLoading(true);
      setInitError(null);
      setIsInitializing(true);

      // Simplified auth initialization - just get the current session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error && !error.message.includes("code verifier")) {
        throw new Error(`Auth initialization failed: ${error.message}`);
      }

      if (session) {
        await handleAuthStateChange(session, "SESSION_RESTORED");
      } else {
        // No session found - user is not authenticated
        setUser(null);
        setProfile(null);
        setSession(null);
        setIsLoading(false);
      }
        console.log(
          "🔗 [AuthContext] Auth code detected in URL, attempting code exchange...",
        );

        try {
          // Try to exchange the code for a session
          const { data, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(window.location.href);

          if (exchangeError) {
            console.warn(
              "⚠️ [AuthContext] Code exchange failed:",
              exchangeError.message,
            );

            // If code exchange fails due to PKCE issues, clear URL and get regular session
            if (
              exchangeError.message.includes("code verifier") ||
              exchangeError.message.includes("invalid request")
            ) {
              console.log(
                "🧹 [AuthContext] Clearing auth parameters from URL due to PKCE error",
              );
              // Clear the URL parameters to prevent repeated failed attempts
              window.history.replaceState(
                {},
                document.title,
                window.location.pathname,
              );

              // Fall back to getting existing session
              const { data: sessionData, error: sessionError } =
                await supabase.auth.getSession();
              if (sessionError) {
                throw sessionError;
              }

              if (sessionData.session) {
                await handleAuthStateChange(
                  sessionData.session,
                  "SESSION_RESTORED",
                );
              } else {
                setUser(null);
                setProfile(null);
                setSession(null);
                setIsLoading(false);
              }
            } else {
              throw exchangeError;
            }
          } else if (data.session) {
            console.log("✅ [AuthContext] Code exchange successful");
            await handleAuthStateChange(data.session, "SIGNED_IN");
          }
        } catch (codeExchangeError) {
          console.warn(
            "⚠️ [AuthContext] Code exchange attempt failed, falling back to session check:",
            codeExchangeError instanceof Error
              ? codeExchangeError.message
              : String(codeExchangeError),
          );

          // Clear problematic URL parameters
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );

          // Fall back to regular session check
          const { data: sessionData, error: sessionError } =
            await supabase.auth.getSession();
          if (sessionError && !sessionError.message.includes("code verifier")) {
            throw sessionError;
          }

          if (sessionData?.session) {
            await handleAuthStateChange(
              sessionData.session,
              "SESSION_RESTORED",
            );
          } else {
            setUser(null);
            setProfile(null);
            setSession(null);
            setIsLoading(false);
          }
        }
      } else if (hasError) {
        // Handle auth errors in URL
        const error = urlParams.get("error");
        const errorDescription = urlParams.get("error_description");
        console.warn(
          "🚨 [AuthContext] Auth error in URL:",
          error,
          errorDescription,
        );

        // Clear error from URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );

        // Still try to get existing session
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          await handleAuthStateChange(sessionData.session, "SESSION_RESTORED");
        } else {
          setUser(null);
          setProfile(null);
          setSession(null);
          setIsLoading(false);
        }
      } else {
        // Normal session check
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error && !error.message.includes("code verifier")) {
          throw new Error(`Auth initialization failed: ${error.message}`);
        }

        if (session) {
          await handleAuthStateChange(session, "SESSION_RESTORED");
        } else {
          // No session found - user is not authenticated
          setUser(null);
          setProfile(null);
          setSession(null);
          setIsLoading(false);
        }
      }

      setAuthInitialized(true);
      console.log("✅ [AuthContext] Auth initialized successfully");
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to initialize authentication",
      );

      // Don't show PKCE errors to users as they're not actionable
      if (error instanceof Error && error.message.includes("code verifier")) {
        console.warn(
          "⚠️ [AuthContext] PKCE error handled silently:",
          error.message,
        );
        setInitError(null);

        // Clear URL and set to unauthenticated state
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
        setUser(null);
        setProfile(null);
        setSession(null);
      } else {
        setInitError(errorMessage);
        logError("Auth initialization failed", error);
      }

      // Ensure loading is turned off on error to prevent infinite loading
      setIsLoading(false);
    } finally {
      setIsInitializing(false);
      loadingStateManager.clearLoading(loadingId);
    }
  }, [authInitialized, handleAuthStateChange]);

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
        // Auth state change will be handled by the listener
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
        const result = await registerUser(email, password, name);
        return result;
      } catch (error) {
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
      if (error) throw error;

      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (error) {
      handleError(error, "Logout");
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

    useEffect(() => {
    console.log("🔄 [AuthContext] Auth initialization useEffect triggered");

    // Force completion of auth initialization after a timeout to prevent infinite loading
    const forceCompleteTimer = setTimeout(() => {
      if (isLoading) {
        console.warn("⚠️ [AuthContext] Forcing auth initialization completion due to timeout");
        setIsLoading(false);
        setAuthInitialized(true);
      }
    }, 10000); // 10 second timeout

    initializeAuth();

    return () => {
      clearTimeout(forceCompleteTimer);
    };
  }, [initializeAuth, isLoading]);

  // Separate effect for loading timeout to prevent infinite re-renders
  useEffect(() => {
    if (isLoading) {
      const loadingTimeout = setTimeout(() => {
        console.warn("⚠️ [AuthContext] Loading timeout - forcing resolution");
        setIsLoading(false);
      }, 5000); // 5 second timeout

      return () => clearTimeout(loadingTimeout);
    }
  }, [isLoading]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 [AuthContext] Auth state changed:", {
        event,
        hasSession: !!session,
      });

      try {
        if (session) {
          await handleAuthStateChange(session, event);
        } else {
          // Clear user tracking ref
          currentUserIdRef.current = null;

          // Batch clear all auth state to prevent UI flickering
          setUser(null);
          setProfile(null);
          setSession(null);
          setIsLoading(false);
          console.log("✅ [AuthContext] Auth state cleared");
        }
      } catch (error) {
        console.warn(
          "⚠️ [AuthContext] Auth state change error:",
          error instanceof Error ? error.message : String(error),
        );

        // Handle PKCE errors silently
        if (error instanceof Error && error.message.includes("code verifier")) {
          console.log(
            "🧹 [AuthContext] Handling PKCE error in auth state change",
          );

          // Clear URL parameters if they exist
          const url = new URL(window.location.href);
          if (url.searchParams.has("code") || url.searchParams.has("error")) {
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname,
            );
          }

          // Set to unauthenticated state
          setUser(null);
          setProfile(null);
          setSession(null);
        }

        setIsLoading(false);
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