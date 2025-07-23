import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";

export default function SafeEnvironmentDebug() {
  const [showValues, setShowValues] = useState(false);

  // Safely check environment variables
  const checkEnvVar = (key: string): { status: 'set' | 'missing'; value?: string } => {
    try {
      const value = import.meta.env[key];
      if (!value || value.trim() === "" || value === "undefined") {
        return { status: 'missing' };
      }
      return { status: 'set', value };
    } catch (error) {
      console.warn(`Error checking ${key}:`, error);
      return { status: 'missing' };
    }
  };

  const envVars = [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY", 
    "VITE_PAYSTACK_PUBLIC_KEY",
    "VITE_APP_URL",
    "VITE_COURIER_GUY_API_KEY",
    "VITE_FASTWAY_API_KEY",
    "VITE_GOOGLE_MAPS_API_KEY",
    "VITE_DISABLE_GOOGLE_MAPS"
  ];

  const envStatus = envVars.map(key => ({
    key,
    ...checkEnvVar(key)
  }));

  const setCount = envStatus.filter(env => env.status === 'set').length;
  const missingCount = envStatus.filter(env => env.status === 'missing').length;

  const maskValue = (value: string) => {
    if (!value || value.length < 8) return value;
    return value.substring(0, 8) + "..." + value.substring(value.length - 4);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Environment Variables</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowValues(!showValues)}
        >
          {showValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showValues ? "Hide Values" : "Show Values"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{setCount}</p>
                <p className="text-sm text-gray-600">Variables Set</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{missingCount}</p>
                <p className="text-sm text-gray-600">Missing</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{envVars.length}</p>
                <p className="text-sm text-gray-600">Total Tracked</p>
              </div>
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Environment Variables Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {envStatus.map(({ key, status, value }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={status === 'set' ? 'default' : 'destructive'}>
                    {status === 'set' ? 'SET' : 'MISSING'}
                  </Badge>
                  <span className="font-mono text-sm">{key}</span>
                </div>
                {showValues && value && (
                  <span className="text-sm text-gray-600 font-mono">
                    {maskValue(value)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {missingCount > 0 && (
        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{missingCount} environment variables are missing.</strong> 
            This may cause some features to not work properly. Check your .env file or deployment configuration.
          </AlertDescription>
        </Alert>
      )}

      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <strong>Environment Debug:</strong> This component safely checks environment variables without causing errors.
          Missing variables will show as 'MISSING' instead of crashing the app.
        </AlertDescription>
      </Alert>
    </div>
  );
}
