import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Eye, EyeOff, Copy } from "lucide-react";
import { ENV } from "@/config/environment";
import { toast } from "sonner";

export default function EnvironmentDebug() {
  const [showValues, setShowValues] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Environment variables that should be set for different purposes
  const envGroups = {
    "Client-side (VITE_*)": [
      "VITE_SUPABASE_URL",
      "VITE_SUPABASE_ANON_KEY",
      "VITE_PAYSTACK_PUBLIC_KEY",
      "VITE_APP_URL",
      "VITE_COURIER_GUY_API_KEY",
VITE_FASTWAY_API_KEY
    ],
    "Server-side API Functions": [
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "PAYSTACK_SECRET_KEY"
    ],
    "Runtime Info": [
      "NODE_ENV"
    ]
  };

  const getEnvValue = (key: string) => {
    // Check both import.meta.env and our ENV object
    const viteValue = import.meta.env[key];
    const envValue = ENV[key as keyof typeof ENV];
    return viteValue || envValue || undefined;
  };

  const getEnvStatus = (key: string) => {
    const value = getEnvValue(key);
    if (!value || value.trim() === "" || value === "undefined") {
      return "missing";
    }
    return "set";
  };

  const maskValue = (value: string) => {
    if (!value || value.length < 8) return value;
    return value.substring(0, 8) + "..." + value.substring(value.length - 4);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Environment Variables Debug</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowValues(!showValues)}
            variant="outline"
            size="sm"
          >
            {showValues ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showValues ? "Hide Values" : "Show Values"}
          </Button>
        </div>
      </div>

      <Alert className="border-yellow-500 bg-yellow-50 text-yellow-800">
        <AlertDescription>
          <strong>API Function Issue:</strong> Your API functions expect server-side environment variables 
          (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) but you may only have client-side variables set 
          (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
        </AlertDescription>
      </Alert>

      {Object.entries(envGroups).map(([groupName, variables]) => (
        <Card key={groupName} className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{groupName}</CardTitle>
            <CardDescription>
              {groupName === "Server-side API Functions" && 
                "These are needed for /api functions to work on Fly.dev"}
              {groupName === "Client-side (VITE_*)" && 
                "These work in the browser and are available"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {variables.map((varName) => {
                const status = getEnvStatus(varName);
                const value = getEnvValue(varName);
                
                return (
                  <div key={varName} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant={status === "set" ? "default" : "destructive"}>
                        {status === "set" ? "SET" : "MISSING"}
                      </Badge>
                      <code className="text-sm">{varName}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      {showValues && (
                        <code className="text-xs text-gray-600">
                          {value ? (varName.includes("KEY") || varName.includes("SECRET") ? maskValue(value) : value) : "undefined"}
                        </code>
                      )}
                      {value && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(value)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base">How to Fix API Function Environment Variables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>For Fly.dev deployment:</strong>
            <pre className="mt-2 p-2 bg-white rounded text-xs overflow-x-auto">
{`fly secrets set SUPABASE_URL="https://kbpjqzaqbqukutflwixf.supabase.co"
fly secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
fly secrets set PAYSTACK_SECRET_KEY="your-paystack-secret-key"`}
            </pre>
          </div>
          
          <div>
            <strong>Note:</strong> SUPABASE_SERVICE_ROLE_KEY is different from SUPABASE_ANON_KEY. 
            You can find it in your Supabase project settings under "API" → "Project API keys" → "service_role".
          </div>
          
          <div>
            <strong>Current Issue:</strong> Your client-side VITE_ variables work fine, but the API functions 
            need the server-side variables to be set in your Fly.dev deployment.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
