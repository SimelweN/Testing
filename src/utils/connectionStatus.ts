import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConnectionStatus {
  isOnline: boolean;
  supabaseConnected: boolean;
  lastChecked: Date;
}

let connectionStatus: ConnectionStatus = {
  isOnline: navigator.onLine,
  supabaseConnected: true,
  lastChecked: new Date()
};

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Test Supabase connectivity
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    // Simple query to test connectivity
    const { error } = await supabase
      .from("books")
      .select("id")
      .limit(1)
      .maybeSingle();
    
    connectionStatus.supabaseConnected = !error;
    connectionStatus.lastChecked = new Date();
    
    return !error;
  } catch (error) {
    console.warn("Supabase connection test failed:", error);
    connectionStatus.supabaseConnected = false;
    connectionStatus.lastChecked = new Date();
    return false;
  }
}

/**
 * Get current connection status
 */
export function getConnectionStatus(): ConnectionStatus {
  connectionStatus.isOnline = navigator.onLine;
  return { ...connectionStatus };
}

/**
 * Setup connection monitoring
 */
export function setupConnectionMonitoring(): void {
  // Monitor online/offline status
  window.addEventListener('online', () => {
    connectionStatus.isOnline = true;
    console.log("🌐 Browser is back online");
    toast.success("Connection restored", {
      description: "You're back online!",
      duration: 3000,
    });
    
    // Test Supabase connection when back online
    testSupabaseConnection();
  });

  window.addEventListener('offline', () => {
    connectionStatus.isOnline = false;
    console.log("🌐 Browser is offline");
    toast.warning("Connection lost", {
      description: "You're currently offline. Some features may not work.",
      duration: 5000,
    });
  });

  // Periodic Supabase connectivity check (every 5 minutes when online)
  setInterval(() => {
    if (navigator.onLine) {
      testSupabaseConnection().catch(() => {
        // Silent fail - we don't want to spam the user
      });
    }
  }, 5 * 60 * 1000);
}

/**
 * Show connection status to user
 */
export function showConnectionStatus(): void {
  const status = getConnectionStatus();
  
  if (!status.isOnline) {
    toast.error("No Internet Connection", {
      description: "Please check your internet connection.",
      duration: 8000,
    });
  } else if (!status.supabaseConnected) {
    toast.warning("Service Connection Issue", {
      description: "Having trouble connecting to our servers. Please try again.",
      duration: 8000,
    });
  } else {
    toast.success("All systems connected", {
      description: "Internet and service connections are working properly.",
      duration: 3000,
    });
  }
}

/**
 * Wait for connection to be restored
 */
export async function waitForConnection(maxWaitTime: number = 30000): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    if (navigator.onLine) {
      const supabaseConnected = await testSupabaseConnection();
      if (supabaseConnected) {
        return true;
      }
    }
    
    // Wait 2 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return false;
}

export default {
  isOnline,
  testSupabaseConnection,
  getConnectionStatus,
  setupConnectionMonitoring,
  showConnectionStatus,
  waitForConnection
};
