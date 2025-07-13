import { supabase } from "@/integrations/supabase/client";
import type { Provider } from "@supabase/supabase-js";

/**
 * OAuth service for handling third-party authentication
 */
export class OAuthService {
  /**
   * Get the redirect URL for OAuth flows
   * Defaults to current origin for development and production
   */
  private static getRedirectUrl(): string {
    const isDevelopment = process.env.NODE_ENV === "development";
    const developmentUrl = "http://localhost:8080";
    const productionUrl = "https://rebookedsolutions.co.za";

    // Use the current origin if available, otherwise fallback to predefined URLs
    if (typeof window !== "undefined") {
      return window.location.origin;
    }

    return isDevelopment ? developmentUrl : productionUrl;
  }

  /**
   * Initiate OAuth sign-in with a provider
   * @param provider - OAuth provider (google, github, etc.)
   * @param redirectTo - Optional path to redirect to after successful auth
   */
  static async signInWithProvider(
    provider: Provider,
    redirectTo: string = "/",
  ) {
    try {
      const redirectUrl = `${this.getRedirectUrl()}${redirectTo}`;

      console.log(
        `Initiating ${provider} OAuth with redirect URL:`,
        redirectUrl,
      );

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        console.error(`${provider} OAuth error:`, error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`Error initiating ${provider} OAuth:`, error);
      throw error;
    }
  }

  /**
   * Check if current URL contains OAuth callback parameters
   */
  static isOAuthCallback(): boolean {
    if (typeof window === "undefined") return false;

    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    // Check for either hash-based tokens or code-based PKCE flow
    return !!(hash || code || error);
  }

  /**
   * Get current Supabase session
   */
  static async getCurrentSession() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting current session:", error);
        return null;
      }

      return session;
    } catch (error) {
      console.error("Failed to get current session:", error);
      return null;
    }
  }

  /**
   * Clean up OAuth parameters from URL
   */
  static cleanupOAuthUrl(): void {
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }

  /**
   * Wait for authentication state to settle after OAuth redirect
   * @param timeoutMs - Maximum time to wait in milliseconds
   */
  static async waitForAuthState(timeoutMs: number = 5000): Promise<boolean> {
    return new Promise((resolve) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          subscription.unsubscribe();
          resolve(false);
        }
      }, timeoutMs);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (!resolved && (event === "SIGNED_IN" || event === "SIGNED_OUT")) {
          resolved = true;
          clearTimeout(timeout);
          subscription.unsubscribe();
          resolve(!!session);
        }
      });
    });
  }
}

export default OAuthService;
