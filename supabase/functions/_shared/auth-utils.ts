/**
 * Authentication Utilities for Edge Functions
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { errorResponse } from "./response-utils.ts";

export interface AuthResult {
  success: boolean;
  user?: any;
  errorResponse?: Response;
}

export interface EnvValidationResult {
  success: boolean;
  errorResponse?: Response;
}

/**
 * Validate environment variables are properly configured
 */
export function validateEnvironment(): EnvValidationResult {
  const missingVars = [];
  
  if (!Deno.env.get("SUPABASE_URL")) missingVars.push("SUPABASE_URL");
  if (!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) missingVars.push("SUPABASE_SERVICE_ROLE_KEY");

  if (missingVars.length > 0) {
    return {
      success: false,
      errorResponse: errorResponse(
        "ENVIRONMENT_CONFIG_ERROR",
        {
          missing_env_vars: missingVars,
          message: "Required environment variables are not configured"
        },
        { status: 500 }
      )
    };
  }

  return { success: true };
}

/**
 * Extract and validate Bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const bearerPrefix = "Bearer ";
  if (!authHeader.startsWith(bearerPrefix)) return null;
  
  const token = authHeader.slice(bearerPrefix.length).trim();
  return token || null;
}

/**
 * Authenticate user from request headers
 */
export async function authenticateUser(req: Request): Promise<AuthResult> {
  // Validate environment first
  const envValidation = validateEnvironment();
  if (!envValidation.success) {
    return {
      success: false,
      errorResponse: envValidation.errorResponse
    };
  }

  const authHeader = req.headers.get("Authorization");
  const token = extractBearerToken(authHeader);

  if (!token) {
    return {
      success: false,
      errorResponse: errorResponse(
        "AUTHENTICATION_REQUIRED",
        {
          auth_header: authHeader ? "present_but_invalid" : "missing",
          message: "Valid Bearer token required in Authorization header",
          expected_format: "Bearer <token>"
        },
        { status: 401 }
      )
    };
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return {
        success: false,
        errorResponse: errorResponse(
          "AUTHENTICATION_FAILED",
          {
            error_message: error?.message || "User not found",
            error_code: error?.name || "INVALID_TOKEN",
            token_status: "invalid_or_expired",
            message: "Authentication failed - please login again"
          },
          { status: 401 }
        )
      };
    }

    return {
      success: true,
      user
    };
  } catch (error) {
    return {
      success: false,
      errorResponse: errorResponse(
        "AUTH_SERVICE_ERROR",
        {
          error_message: error.message,
          message: "Authentication service is temporarily unavailable"
        },
        { status: 503 }
      )
    };
  }
}

/**
 * Require user to be authenticated - returns user or error response
 */
export async function requireAuth(req: Request): Promise<{ user: any } | { errorResponse: Response }> {
  const authResult = await authenticateUser(req);
  
  if (!authResult.success) {
    return { errorResponse: authResult.errorResponse! };
  }

  return { user: authResult.user };
}

/**
 * Create Supabase client with service role key
 */
export function createServiceClient() {
  const envValidation = validateEnvironment();
  if (!envValidation.success) {
    throw new Error("Environment not properly configured");
  }

  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}
