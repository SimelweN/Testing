import { createClient } from "@supabase/supabase-js";

// CORS headers for Vercel functions
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Initialize Supabase client
export function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// Error response helper
export function errorResponse(message, status = 500) {
  return {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      success: false,
      error: message,
    }),
  };
}

// Success response helper
export function successResponse(data, status = 200) {
  return {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      success: true,
      ...data,
    }),
  };
}

// Handle CORS preflight
export function handleCORS(req, res) {
  if (req.method === "OPTIONS") {
    res.status(200).setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "authorization, x-client-info, apikey, content-type",
    );
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    return res.end();
  }
}

// Validate required fields
export function validateFields(data, requiredFields) {
  const missing = requiredFields.filter((field) => !data[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }
}

// Email validation
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Rate limiting helper (simple in-memory implementation)
const rateLimitMap = new Map();

export function checkRateLimit(key, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true };
}

// Log event helper
export function logEvent(type, details) {
  const timestamp = new Date().toISOString();
  console.log(
    JSON.stringify({
      timestamp,
      type,
      details: {
        ...details,
        // Remove sensitive data
        auth: undefined,
        password: undefined,
        apiKey: undefined,
      },
    }),
  );
}

// Parse request body safely
export async function parseRequestBody(req) {
  try {
    if (typeof req.body === "string") {
      return JSON.parse(req.body);
    }
    return req.body;
  } catch (error) {
    throw new Error("Invalid JSON in request body");
  }
}
