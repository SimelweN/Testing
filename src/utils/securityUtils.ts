import { IS_PRODUCTION } from "@/config/environment";

// Input sanitization utilities
export const sanitizeHtml = (input: string): string => {
  const div = document.createElement("div");
  div.textContent = input;
  return div.innerHTML;
};

export const sanitizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error(
        `Invalid protocol: ${parsed.protocol}. Only http and https are allowed.`,
      );
    }

    return parsed.toString();
  } catch (error) {
    // Log the error for debugging purposes
    console.warn(
      `Invalid URL provided to sanitizeUrl: "${url}". Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );

    // Return a safe default URL instead of empty string
    return "about:blank";
  }
};

// CSRF protection
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
};

// Rate limiting utilities (client-side tracking)
export class RateLimiter {
  private static attempts: Map<string, number[]> = new Map();

  static isRateLimited(
    key: string,
    maxAttempts: number,
    windowMs: number,
  ): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Remove attempts outside the time window
    const validAttempts = attempts.filter((time) => now - time < windowMs);

    // Update the attempts array
    this.attempts.set(key, validAttempts);

    return validAttempts.length >= maxAttempts;
  }

  static recordAttempt(key: string): void {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    attempts.push(now);
    this.attempts.set(key, attempts);
  }

  static clearAttempts(key: string): void {
    this.attempts.delete(key);
  }
}

// Content Security Policy utilities
export const setCSPHeader = (): void => {
  if (!IS_PRODUCTION) return;

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://js.paystack.co",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://api.paystack.co",
    "frame-src https://js.paystack.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  const meta = document.createElement("meta");
  meta.httpEquiv = "Content-Security-Policy";
  meta.content = csp;
  document.head.appendChild(meta);
};

// XSS protection utilities
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// Validate file uploads
export const validateFileUpload = (
  file: File,
  allowedTypes: string[] = ["image/jpeg", "image/png", "image/webp"],
  maxSizeBytes: number = 5 * 1024 * 1024, // 5MB
): { valid: boolean; error?: string } => {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${(maxSizeBytes / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  return { valid: true };
};

// Secure local storage utilities
export const secureStorage = {
  setItem: (key: string, value: any, encrypt: boolean = false): void => {
    try {
      let serializedValue = JSON.stringify(value);

      if (encrypt && IS_PRODUCTION) {
        // In production, consider using actual encryption
        // For now, just base64 encode as a basic obfuscation
        serializedValue = btoa(serializedValue);
      }

      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error("Failed to store item:", error);
    }
  },

  getItem: (key: string, decrypt: boolean = false): any => {
    try {
      let value = localStorage.getItem(key);

      if (!value) return null;

      if (decrypt && IS_PRODUCTION) {
        // Decode if it was encoded
        try {
          value = atob(value);
        } catch {
          // If decoding fails, assume it wasn't encoded
        }
      }

      return JSON.parse(value);
    } catch (error) {
      console.error("Failed to retrieve item:", error);
      return null;
    }
  },

  removeItem: (key: string): void => {
    localStorage.removeItem(key);
  },

  clear: (): void => {
    localStorage.clear();
  },
};

// Initialize security measures
export const initSecurity = (): void => {
  if (IS_PRODUCTION) {
    // Set CSP header
    setCSPHeader();

    // Disable right-click context menu (optional)
    // document.addEventListener('contextmenu', (e) => e.preventDefault());

    // Disable F12 and other developer tools shortcuts (optional)
    // document.addEventListener('keydown', (e) => {
    //   if (e.key === 'F12' ||
    //       (e.ctrlKey && e.shiftKey && e.key === 'I') ||
    //       (e.ctrlKey && e.shiftKey && e.key === 'C') ||
    //       (e.ctrlKey && e.key === 'U')) {
    //     e.preventDefault();
    //   }
    // });

    // Clear console in production (optional)
    // console.clear();
    // console.log('%cStop!', 'color: red; font-size: 50px; font-weight: bold;');
    // console.log('%cThis is a browser feature intended for developers. Do not enter any code here.', 'color: red; font-size: 16px;');
  }
};
