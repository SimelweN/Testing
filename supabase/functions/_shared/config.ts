// Shared configuration for all edge functions
export const ENV = {
  SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
  SUPABASE_SERVICE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  SUPABASE_ANON_KEY: Deno.env.get("SUPABASE_ANON_KEY"),
  PAYSTACK_SECRET_KEY: Deno.env.get("PAYSTACK_SECRET_KEY"),
  PAYSTACK_PUBLIC_KEY: Deno.env.get("PAYSTACK_PUBLIC_KEY"),
  BREVO_SMTP_KEY: Deno.env.get("BREVO_SMTP_KEY"),
  BREVO_SMTP_USER: Deno.env.get("BREVO_SMTP_USER"),
  DEFAULT_FROM_EMAIL: Deno.env.get("DEFAULT_FROM_EMAIL"),
  COURIER_GUY_API_KEY: Deno.env.get("COURIER_GUY_API_KEY"),
  FASTWAY_API_KEY: Deno.env.get("FASTWAY_API_KEY"),
};

export function validateSupabaseConfig(): void {
  if (!ENV.SUPABASE_URL || !ENV.SUPABASE_SERVICE_KEY) {
    throw new Error(
      "Supabase credentials not configured. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
    );
  }
}

export function validatePaystackConfig(): void {
  if (!ENV.PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY environment variable is required");
  }
}

export function validateEmailConfig(): void {
  if (!ENV.BREVO_SMTP_KEY) {
    throw new Error("BREVO_SMTP_KEY environment variable is required");
  }
}

export function validateCourierGuyConfig(): void {
  if (!ENV.COURIER_GUY_API_KEY) {
    throw new Error("COURIER_GUY_API_KEY environment variable is required");
  }
}

export function validateFastwayConfig(): void {
  if (!ENV.FASTWAY_API_KEY) {
    throw new Error("FASTWAY_API_KEY environment variable is required");
  }
}
