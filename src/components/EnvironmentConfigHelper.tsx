/**
 * Helper component to guide users through environment configuration
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink, 
  Copy, 
  RefreshCw,
  Database,
  Key,
  Settings
} from "lucide-react";

interface EnvironmentStatus {
  supabaseUrl: boolean;
  supabaseKey: boolean;
  canConnect: boolean;
}

const EnvironmentConfigHelper: React.FC = () => {
  const [envStatus, setEnvStatus] = useState<EnvironmentStatus>({
    supabaseUrl: false,
    supabaseKey: false,
    canConnect: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkEnvironment = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const status = {
      supabaseUrl: !!(supabaseUrl && supabaseUrl.trim() !== "" && supabaseUrl !== "undefined"),
      supabaseKey: !!(supabaseKey && supabaseKey.trim() !== "" && supabaseKey !== "undefined"),
      canConnect: false
    };
    
    status.canConnect = status.supabaseUrl && status.supabaseKey;
    
    setEnvStatus(status);
    setLastChecked(new Date());
    
    return status;
  };

  const testConnection = async () => {
    if (!envStatus.canConnect) return;
    
    setIsLoading(true);
    try {
      // Simple test to see if we can reach Supabase
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });
      
      if (response.ok) {
        console.log("✅ Supabase connection successful");
        // Refresh the page to apply the working configuration
        window.location.reload();
      } else {
        console.log("❌ Supabase responded with error:", response.status);
      }
    } catch (error) {
      console.log("❌ Failed to connect to Supabase:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  useEffect(() => {
    checkEnvironment();
  }, []);

  const allConfigured = envStatus.supabaseUrl && envStatus.supabaseKey;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Environment Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              The application is missing required environment variables. This causes the "Failed to fetch" error you're seeing.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configuration Status</h3>
            
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span>VITE_SUPABASE_URL</span>
                </div>
                {envStatus.supabaseUrl ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Missing
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  <span>VITE_SUPABASE_ANON_KEY</span>
                </div>
                {envStatus.supabaseKey ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Missing
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">How to Fix</h3>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Option 1: Connect via MCP (Recommended)</h4>
              <p className="text-blue-800 text-sm mb-3">
                Use the built-in Supabase integration to automatically configure your environment.
              </p>
              <Button 
                onClick={() => {
                  // This will be handled by the MCP system
                  console.log("Opening MCP popover...");
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect to Supabase
              </Button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Option 2: Manual Configuration</h4>
              <p className="text-gray-700 text-sm mb-3">
                If you have your Supabase credentials, you can set them manually:
              </p>
              <div className="space-y-2 text-sm font-mono bg-gray-900 text-green-400 p-3 rounded">
                <div className="flex items-center justify-between">
                  <span>VITE_SUPABASE_URL=https://your-project.supabase.co</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyToClipboard("VITE_SUPABASE_URL=https://your-project.supabase.co")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span>VITE_SUPABASE_ANON_KEY=your-anon-key</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyToClipboard("VITE_SUPABASE_ANON_KEY=your-anon-key")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={checkEnvironment}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Recheck Configuration
            </Button>
            
            {allConfigured && (
              <Button 
                onClick={testConnection}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Test & Apply
              </Button>
            )}
          </div>

          {lastChecked && (
            <p className="text-xs text-gray-500 text-center">
              Last checked: {lastChecked.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnvironmentConfigHelper;
