/**
 * Safe fetch utility that prevents "body stream already read" errors
 * by cloning responses before reading them
 */

export interface SafeFetchOptions extends RequestInit {
  timeout?: number;
}

export interface SafeFetchResult<T = any> {
  data: T;
  status: number;
  statusText: string;
  ok: boolean;
}

/**
 * Safe fetch that handles response cloning properly to prevent body stream errors
 */
export async function safeFetch<T = any>(
  url: string, 
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult<T>> {
  const { timeout = 30000, ...fetchOptions } = options;

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Clone BEFORE any reading operations
    const responseClone = response.clone();
    
    const result: SafeFetchResult<T> = {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      data: null as T,
    };

    try {
      // Try to read as JSON first
      result.data = await response.json();
    } catch (jsonError) {
      // If JSON parsing fails, try reading as text from the clone
      try {
        const textData = await responseClone.text();
        result.data = (textData || "Empty response") as T;
      } catch (textError) {
        result.data = "Failed to read response" as T;
      }
    }

    return result;

  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout: ${url}`);
    }
    
    console.error("SafeFetch Error:", error);
    throw new Error(`Fetch failed: ${error.message}`);
  }
}

/**
 * Simplified safe fetch that just returns the data (for backward compatibility)
 */
export async function simpleSafeFetch<T = any>(
  url: string, 
  options: SafeFetchOptions = {}
): Promise<T> {
  const result = await safeFetch<T>(url, options);
  
  if (!result.ok) {
    throw new Error(`Request failed: ${result.status} ${result.statusText}`);
  }
  
  return result.data;
}

/**
 * Safe fetch for edge functions with proper error handling
 */
export async function fetchEdgeFunction<T = any>(
  functionName: string,
  payload: any = {},
  options: SafeFetchOptions = {}
): Promise<T> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  if (!supabaseUrl) {
    throw new Error("VITE_SUPABASE_URL environment variable is not set");
  }

  const url = `${supabaseUrl}/functions/v1/${functionName}`;
  
  const result = await safeFetch<T>(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: JSON.stringify(payload),
    ...options,
  });

  if (!result.ok) {
    throw new Error(`Edge function ${functionName} failed: ${result.status} ${result.statusText}`);
  }

  return result.data;
}
