import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { WifiOff, Wifi, RefreshCw, AlertTriangle } from "lucide-react";
import {
  checkConnectionHealth,
  ConnectionHealthResult,
} from "@/utils/connectionHealthCheck";

const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionHealth, setConnectionHealth] =
    useState<ConnectionHealthResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Check connection health when coming back online
      checkConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial connection check
    checkConnection();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const health = await checkConnectionHealth();
      setConnectionHealth(health);
    } catch (error) {
      console.error("Connection check failed:", error);
    } finally {
      setIsChecking(false);
    }
  };

  // Don't show anything if everything is working fine
  if (
    isOnline &&
    connectionHealth?.supabaseConnected &&
    connectionHealth?.authStatus === "connected"
  ) {
    return null;
  }

  // Show offline indicator
  if (!isOnline) {
    return (
      <div className="fixed top-4 right-4 z-50 max-w-sm">
        <Alert className="border-red-200 bg-red-50">
          <WifiOff className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="flex items-center justify-between">
              <span className="font-medium">You're offline</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={checkConnection}
                disabled={isChecking}
                className="h-auto p-1 text-red-600 hover:text-red-700"
              >
                <RefreshCw
                  className={`h-3 w-3 ${isChecking ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
            <p className="text-xs mt-1">Check your internet connection</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show connection issues
  if (
    connectionHealth &&
    (!connectionHealth.supabaseConnected ||
      connectionHealth.authStatus === "error")
  ) {
    return (
      <div className="fixed top-4 right-4 z-50 max-w-sm">
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="flex items-center justify-between">
              <span className="font-medium">Connection Issues</span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDetails(!showDetails)}
                  className="h-auto p-1 text-yellow-600 hover:text-yellow-700"
                >
                  <Wifi className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={checkConnection}
                  disabled={isChecking}
                  className="h-auto p-1 text-yellow-600 hover:text-yellow-700"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${isChecking ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </div>
            <p className="text-xs mt-1">
              {connectionHealth.error || "Some features may not work properly"}
            </p>

            {showDetails && (
              <div className="mt-2 text-xs space-y-1 border-t border-yellow-200 pt-2">
                <div>
                  Database: {connectionHealth.supabaseConnected ? "✅" : "❌"}
                </div>
                <div>Auth: {connectionHealth.authStatus}</div>
                {connectionHealth.latency && (
                  <div>Latency: {connectionHealth.latency}ms</div>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return null;
};

export default ConnectionStatus;
