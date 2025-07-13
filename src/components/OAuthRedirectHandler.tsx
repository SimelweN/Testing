import { useOAuthRedirect } from "@/hooks/useOAuthRedirect";

interface OAuthRedirectHandlerProps {
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
 * Component to handle OAuth redirect using Supabase's built-in session handling
 * Works with both OAuth flows and PKCE flows
 */
export const OAuthRedirectHandler: React.FC<OAuthRedirectHandlerProps> = (
  props,
) => {
  // Use the hook to handle OAuth redirects
  useOAuthRedirect(props);

  return null;
};

export default OAuthRedirectHandler;
