import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Debounced auth hook to prevent UI glitching during rapid auth state changes
 */
export const useDebouncedAuth = (delay: number = 100) => {
  const auth = useAuth();
  const [debouncedAuth, setDebouncedAuth] = useState(auth);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAuth(auth);
    }, delay);

    return () => clearTimeout(timer);
  }, [
    auth.isAuthenticated,
    auth.isAdmin,
    auth.user?.id,
    auth.profile?.id,
    delay,
  ]);

  // Return immediately for non-critical states, debounce for critical UI states
  return {
    ...auth,
    // These are debounced to prevent UI flickering
    isAuthenticated: debouncedAuth.isAuthenticated,
    isAdmin: debouncedAuth.isAdmin,
    // These update immediately for better UX
    isLoading: auth.isLoading,
    user: auth.user,
    profile: auth.profile,
  };
};
