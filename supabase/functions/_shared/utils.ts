import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./cors.ts";
import { ENV, validateSupabaseConfig } from "./config.ts";

export function createSupabaseClient() {
  validateSupabaseConfig();
  return createClient(ENV.SUPABASE_URL!, ENV.SUPABASE_SERVICE_KEY!);
}

export function createErrorResponse(error: string, status: number = 500) {
  console.error("Function error:", error);
  return new Response(JSON.stringify({ success: false, error }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function createSuccessResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify({ success: true, ...data }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function handleCORSPreflight(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }
  return null;
}

export function validateRequestMethod(req: Request, allowedMethods: string[]) {
  if (!allowedMethods.includes(req.method)) {
    throw new Error(
      `Method not allowed. Allowed methods: ${allowedMethods.join(", ")}`,
    );
  }
}

export async function parseRequestBody(req: Request) {
  try {
    return await req.json();
  } catch (error) {
    throw new Error("Invalid JSON in request body");
  }
}

export function validateRequiredFields(data: any, fields: string[]) {
  const missing = fields.filter((field) => !data[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  backoffMs: number = 1000,
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;

      const delay = backoffMs * Math.pow(2, i);
      console.warn(
        `Attempt ${i + 1} failed, retrying in ${delay}ms:`,
        error.message,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
}

export async function handleSupabaseError(error: any, operation: string) {
  if (error) {
    console.error(`Supabase error during ${operation}:`, error);
    throw new Error(`Database error: ${error.message || error}`);
  }
}

// Crypto utilities for Deno (replaces node:crypto)
export async function createHmacSignature(
  data: string,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function logFunction(
  functionName: string,
  operation: string,
  data?: any,
) {
  console.log(
    `[${functionName}] ${operation}`,
    data ? JSON.stringify(data) : "",
  );
}
