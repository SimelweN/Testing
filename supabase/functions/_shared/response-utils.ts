import { corsHeaders } from "./cors.ts";

// Standardized response interface
export interface StandardResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  timestamp: string;
}

// Standard headers for all responses
const getStandardHeaders = () => ({
  ...corsHeaders,
  "Content-Type": "application/json",
});

// Success response (always 200)
export function createSuccessResponse(data?: any, message?: string): Response {
  const response: StandardResponse = {
    success: true,
    timestamp: new Date().toISOString(),
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (message) {
    response.message = message;
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: getStandardHeaders(),
  });
}

// Error response with proper status codes
export function createErrorResponse(
  error: string,
  status: number = 400,
  details?: any,
): Response {
  const response: StandardResponse = {
    success: false,
    error: error,
    timestamp: new Date().toISOString(),
  };

  if (details) {
    response.data = details;
  }

  return new Response(JSON.stringify(response), {
    status: status,
    headers: getStandardHeaders(),
  });
}

// Validation error (400)
export function createValidationError(
  message: string,
  details?: any,
): Response {
  return createErrorResponse(message, 400, details);
}

// Not found error (404)
export function createNotFoundError(message: string, details?: any): Response {
  return createErrorResponse(message, 404, details);
}

// Server error (500)
export function createServerError(message: string, details?: any): Response {
  return createErrorResponse(message, 500, details);
}

// Unauthorized error (401)
export function createUnauthorizedError(
  message: string = "Unauthorized",
): Response {
  return createErrorResponse(message, 401);
}

// Configuration error (503)
export function createConfigError(message: string): Response {
  return createErrorResponse(`Configuration Error: ${message}`, 503);
}

// Global error handler wrapper
export function withErrorHandling(
  handler: (req: Request) => Promise<Response>,
  functionName: string,
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    try {
      // Handle CORS preflight
      if (req.method === "OPTIONS") {
        return new Response(null, {
          status: 200,
          headers: corsHeaders,
        });
      }

      const response = await handler(req);

      // Ensure response has proper headers
      if (!response.headers.get("Content-Type")) {
        return new Response(response.body, {
          status: response.status,
          headers: getStandardHeaders(),
        });
      }

      return response;
    } catch (error) {
      console.error(`[${functionName}] Unhandled error:`, {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString(),
      });

      // Return standardized error response
      let errorMessage = "Internal server error";
      let statusCode = 500;

      if (error.message) {
        errorMessage = error.message;

        // Determine appropriate status code based on error message
        if (
          error.message.includes("not found") ||
          error.message.includes("Not found")
        ) {
          statusCode = 404;
        } else if (
          error.message.includes("Missing") ||
          error.message.includes("required")
        ) {
          statusCode = 400;
        } else if (
          error.message.includes("Unauthorized") ||
          error.message.includes("unauthorized")
        ) {
          statusCode = 401;
        } else if (
          error.message.includes("not configured") ||
          error.message.includes("environment")
        ) {
          statusCode = 503;
        }
      }

      return createErrorResponse(errorMessage, statusCode, {
        functionName,
        timestamp: new Date().toISOString(),
      });
    }
  };
}

// Request body parser with validation
export async function parseAndValidateRequest(
  req: Request,
  requiredFields: string[] = [],
): Promise<any> {
  let body;

  try {
    body = await req.json();
  } catch (error) {
    throw new Error("Invalid JSON in request body");
  }

  // Validate required fields
  const missingFields = requiredFields.filter(
    (field) =>
      body[field] === undefined || body[field] === null || body[field] === "",
  );

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }

  return body;
}

// Log function activity
export function logFunctionActivity(
  functionName: string,
  action: string,
  data?: any,
  error?: any,
) {
  const logEntry = {
    function: functionName,
    action,
    timestamp: new Date().toISOString(),
    ...(data && { data }),
    ...(error && { error: error.message || error }),
  };

  if (error) {
    console.error(`[${functionName}] ${action}:`, logEntry);
  } else {
    console.log(`[${functionName}] ${action}:`, logEntry);
  }
}
