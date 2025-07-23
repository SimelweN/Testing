import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff, Wifi } from "lucide-react";

const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Only show alert when offline
  if (isOnline) {
    return null;
  }

  return (
    <Alert className="border-red-200 bg-red-50">
      <WifiOff className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">
        You appear to be offline. Some features may not work properly.
      </AlertDescription>
    </Alert>
  );
};

export default ConnectionStatus;
