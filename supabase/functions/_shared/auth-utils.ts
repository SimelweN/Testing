/**
 * Authentication Utilities for Edge Functions
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse } from "./response-utils.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export interface AuthResult {
  success: boolean;
  user?: any;
  session?: any;
  error?: string;
  errorResponse?: Response;
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }

  return parts[1];
}

/**
 * Validate user authentication using Bearer token
 */
export async function validateUserAuth(req: Request): Promise<AuthResult> {
  const token = extractBearerToken(req);
  
  if (!token) {
    return {
      success: false,
      error: "Missing or invalid authorization header",
      errorResponse: jsonResponse({
        success: false,
        error: "AUTHENTICATION_REQUIRED",
        details: {
          message: "Missing or invalid authorization header",
          expected: "Bearer <token>",
          provided: req.headers.get("authorization")
        }
      }, { status: 401 })
    };
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return {
        success: false,
        error: "Invalid token or user not found",
        errorResponse: jsonResponse({
          success: false,
          error: "AUTHENTICATION_FAILED",
          details: {
            message: "Invalid token or user not found",
            supabase_error: error?.message
          }
        }, { status: 401 })
      };
    }

    return {
      success: true,
      user: data.user,
      session: data
    };
  } catch (error) {
    return {
      success: false,
      error: `Authentication error: ${error.message}`,
      errorResponse: jsonResponse({
        success: false,
        error: "AUTHENTICATION_ERROR",
        details: {
          message: `Authentication error: ${error.message}`
        }
      }, { status: 500 })
    };
  }
}

/**
 * Check if request requires authentication and validate if needed
 */
export async function checkAuthIfRequired(req: Request, requireAuth: boolean = false): Promise<AuthResult> {
  if (!requireAuth) {
    return { success: true };
  }

  return await validateUserAuth(req);
}

/**
 * Create an authenticated Supabase client using user token
 */
export function createAuthenticatedClient(token: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

/**
 * Create a service role Supabase client (for admin operations)
 */
export function createServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

/**
 * Validate environment variables are present
 */
export function validateEnvironment(): { success: boolean; errorResponse?: Response } {
  const missing = [];
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SUPABASE_ANON_KEY) missing.push("SUPABASE_ANON_KEY");
  if (!SUPABASE_SERVICE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  if (missing.length > 0) {
    return {
      success: false,
      errorResponse: jsonResponse({
        success: false,
        error: "ENVIRONMENT_CONFIG_ERROR",
        details: {
          missing_env_vars: missing,
          message: "Required environment variables are not configured"
        }
      }, { status: 500 })
    };
  }

  return { success: true };
}
