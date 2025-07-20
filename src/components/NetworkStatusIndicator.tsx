import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { WifiOff, Wifi, RefreshCw, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface NetworkStatusProps {
  onRetry?: () => void;
  className?: string;
}

export default function NetworkStatusIndicator({ onRetry, className = "" }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [lastError, setLastError] = useState<string>("");

  const checkSupabaseConnection = async () => {
    try {
      setIsChecking(true);
      
      // Quick health check - just check if we can reach the profiles table
      const { error } = await supabase
        .from("profiles")
        .select("id")
        .limit(1);
      
      if (error) {
        setIsSupabaseConnected(false);
        setLastError(error.message);
      } else {
        setIsSupabaseConnected(true);
        setLastError("");
      }
    } catch (error) {
      setIsSupabaseConnected(false);
      setLastError(error instanceof Error ? error.message : "Network error");
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkSupabaseConnection();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setIsSupabaseConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (navigator.onLine) {
      checkSupabaseConnection();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    checkSupabaseConnection();
    if (onRetry) {
      onRetry();
    }
  };

  // Don't show anything if everything is working
  if (isOnline && isSupabaseConnected && !lastError) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md ${className}`}>
      <Alert variant="destructive" className="border-orange-500 bg-orange-50 text-orange-800">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <WifiOff className="h-4 w-4" />
          ) : !isSupabaseConnected ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <Wifi className="h-4 w-4" />
          )}
          <AlertDescription className="flex-1">
            {!isOnline ? (
              "No internet connection"
            ) : !isSupabaseConnected ? (
              <>
                Database connection issue
                {lastError && (
                  <div className="text-xs mt-1 opacity-75">
                    {lastError.includes('Failed to fetch') ? 'Network timeout' : lastError}
                  </div>
                )}
              </>
            ) : (
              "Connection restored"
            )}
          </AlertDescription>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={isChecking || !isOnline}
            className="border-orange-300 hover:bg-orange-100"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </div>
      </Alert>
    </div>
  );
}

export { NetworkStatusIndicator };
