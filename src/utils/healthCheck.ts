import { supabase } from "@/integrations/supabase/client";

export interface HealthCheckResult {
  isHealthy: boolean;
  error?: string;
  responseTime?: number;
  timestamp: string;
}

/**
 * Perform a quick health check on the database connection
 */
export const checkDatabaseHealth = async (): Promise<HealthCheckResult> => {
  const startTime = Date.now();

  try {
    // Simple query to test database connectivity
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        isHealthy: false,
        error: error.message,
        responseTime,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      isHealthy: true,
      responseTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return {
      isHealthy: false,
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime,
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Check if the user can connect to Supabase
 */
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = (await Promise.race([
      supabase.from("profiles").select("count").limit(1),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Connection timeout")), 5000),
      ),
    ])) as any;

    return !error;
  } catch {
    return false;
  }
};

/**
 * Perform comprehensive health checks
 */
export const performHealthChecks = async () => {
  console.log("🔍 Starting health checks...");

  const dbHealth = await checkDatabaseHealth();
  const canConnect = await checkSupabaseConnection();

  console.log("📊 Health Check Results:");
  console.log(
    "- Database:",
    dbHealth.isHealthy ? "✅ Healthy" : "❌ Unhealthy",
  );
  console.log("- Response Time:", dbHealth.responseTime, "ms");
  console.log("- Connection:", canConnect ? "✅ Connected" : "❌ Disconnected");

  if (!dbHealth.isHealthy) {
    console.error("- Database Health Error:", {
      error: dbHealth.error instanceof Error ? {
        name: dbHealth.error.name,
        message: dbHealth.error.message,
        stack: dbHealth.error.stack
      } : dbHealth.error,
      timestamp: new Date().toISOString()
    });
  }

  return {
    database: dbHealth,
    connection: canConnect,
    overall: dbHealth.isHealthy && canConnect,
  };
};
