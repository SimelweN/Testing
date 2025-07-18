import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseOAuthRedirectOptions {
  /** Optional redirect path after successful OAuth authentication */
  redirectTo?: string;
  /** Whether to show toast notifications */
  showNotifications?: boolean;
  /** Custom success message */
  successMessage?: string;
  /** Custom error message */
  errorMessage?: string;
}

/**
 * Custom hook to handle OAuth redirect using Supabase's built-in session handling
 * This works with both OAuth flows and PKCE flows
 */
export const useOAuthRedirect = (options: UseOAuthRedirectOptions = {}) => {
  const {
    redirectTo = "/",
    showNotifications = true,
    successMessage = "Login successful! Welcome to ReBooked Solutions!",
    errorMessage = "Authentication failed. Please try again.",
  } = options;

  const navigate = useNavigate();
  const hasProcessed = useRef(false);
  const hasSetupListener = useRef(false);

  useEffect(() => {
    // Prevent processing multiple times
    if (hasProcessed.current || hasSetupListener.current) return;

    // Check if we're on an OAuth redirect page (has hash or code parameter)
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const error_description = searchParams.get("error_description");

    // Only proceed if this looks like an actual OAuth redirect
    const hasOAuthIndicators =
      hash.includes("access_token") ||
      hash.includes("refresh_token") ||
      code ||
      error ||
      error_description;

    if (!hasOAuthIndicators) {
      // No OAuth parameters found, don't set up any listeners
      return;
    }

    hasSetupListener.current = true;

    const handleOAuthRedirect = async () => {
      try {
        // Handle OAuth errors from query params
        if (error) {
          console.error(
            "OAuth error from query params:",
            error,
            error_description,
          );
          hasProcessed.current = true;

          if (showNotifications) {
            toast.error(error_description || errorMessage);
          }

          navigate("/login", { replace: true });
          return;
        }

        // If we have a hash or code, this might be an OAuth redirect
        if (hash || code) {
          console.log(
            "Potential OAuth redirect detected, letting Supabase handle it...",
          );

          // Set up a one-time listener for auth state changes
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth state change during OAuth:", event, !!session);

            if (hasProcessed.current) return;

            if (event === "SIGNED_IN" && session) {
              hasProcessed.current = true;
              console.log("OAuth sign-in successful");

              if (showNotifications) {
                toast.success(successMessage);
              }

              // Clean up URL
              window.history.replaceState(null, "", window.location.pathname);

              // Redirect to specified path
              navigate(redirectTo, { replace: true });

              // Unsubscribe after successful handling
              subscription.unsubscribe();
            } else if (
              event === "SIGNED_OUT" ||
              (event === "TOKEN_REFRESHED" && !session)
            ) {
              // Handle sign out or failed refresh
              console.log("OAuth flow resulted in sign out or failed session");
              hasProcessed.current = true;

              if (showNotifications) {
                toast.error(errorMessage);
              }

              window.history.replaceState(null, "", window.location.pathname);
              navigate("/login", { replace: true });
              subscription.unsubscribe();
            }
          });

          // Also try to get the current session in case it's already available
          setTimeout(async () => {
            if (hasProcessed.current) return;

            try {
              const {
                data: { session },
                error: sessionError,
              } = await supabase.auth.getSession();

              if (sessionError) {
                console.error(
                  "Error getting session after OAuth:",
                  sessionError,
                );
                hasProcessed.current = true;

                if (showNotifications) {
                  toast.error(errorMessage);
                }

                window.history.replaceState(null, "", window.location.pathname);
                navigate("/login", { replace: true });
                subscription.unsubscribe();
                return;
              }

              if (session && !hasProcessed.current) {
                hasProcessed.current = true;
                console.log("Found existing session after OAuth redirect");

                if (showNotifications) {
                  toast.success(successMessage);
                }

                window.history.replaceState(null, "", window.location.pathname);
                navigate(redirectTo, { replace: true });
                subscription.unsubscribe();
              }
            } catch (error) {
              console.error("Error checking session after OAuth:", error);
            }
          }, 100);

          // Cleanup subscription after a timeout if nothing happened
          const timeoutId = setTimeout(() => {
            if (!hasProcessed.current) {
              console.log("OAuth handling timeout, cleaning up...");
              subscription.unsubscribe();
            }
          }, 10000);

          return () => {
            clearTimeout(timeoutId);
            subscription.unsubscribe();
          };
        }
      } catch (error) {
        console.error("OAuth redirect handling error:", error);
        hasProcessed.current = true;

        if (showNotifications) {
          toast.error(errorMessage);
        }

        window.history.replaceState(null, "", window.location.pathname);
        navigate("/login", { replace: true });
      }
    };

    handleOAuthRedirect();
  }, [navigate, redirectTo, showNotifications, successMessage, errorMessage]);

  return null;
};
