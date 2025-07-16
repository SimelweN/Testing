import { corsHeaders } from "./cors.ts";

export interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
  timestamp: string;
}

export function createGlobalErrorHandler(functionName: string) {
  return (handler: (req: Request) => Promise<Response>) => {
    return async (req: Request): Promise<Response> => {
      try {
        return await handler(req);
      } catch (error) {
        console.error(`[${functionName}] Unhandled error:`, {
          message: error.message,
          stack: error.stack,
          url: req.url,
          method: req.method,
          timestamp: new Date().toISOString(),
        });

        const errorResponse: ErrorResponse = {
          success: false,
          error: error.message || "Internal server error",
          timestamp: new Date().toISOString(),
        };

        // Add details for development environment
        if (Deno.env.get("ENVIRONMENT") === "development") {
          errorResponse.details = {
            stack: error.stack,
            functionName,
          };
        }

        let statusCode = 500;

        // Determine appropriate status code based on error type
        if (
          error.message.includes("Missing required fields") ||
          error.message.includes("Invalid") ||
          error.message.includes("required")
        ) {
          statusCode = 400;
        } else if (
          error.message.includes("not found") ||
          error.message.includes("Not found")
        ) {
          statusCode = 404;
        } else if (
          error.message.includes("unauthorized") ||
          error.message.includes("Unauthorized")
        ) {
          statusCode = 401;
        } else if (
          error.message.includes("forbidden") ||
          error.message.includes("Forbidden")
        ) {
          statusCode = 403;
        } else if (
          error.message.includes("rate limit") ||
          error.message.includes("Rate limit")
        ) {
          statusCode = 429;
        }

        return new Response(JSON.stringify(errorResponse), {
          status: statusCode,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    };
  };
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public resetTime?: number,
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}
