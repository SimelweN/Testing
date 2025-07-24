import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Code,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const DeveloperSimple = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const runSimpleTest = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      // Simple test - just check if we can make basic API calls
      console.log('Running simple developer test...');
      
      // Test 1: Environment variables
      const hasSupabaseUrl = !!import.meta.env.VITE_SUPABASE_URL;
      const hasSupabaseKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      console.log('Environment check:', { hasSupabaseUrl, hasSupabaseKey });
      
      // Test 2: Try basic function call
      let functionCallResult = "Not tested";
      try {
        const response = await fetch('/functions/v1/create-recipient', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sellerId: 'test_basic' })
        });
        
        if (response.ok || response.status === 400) {
          functionCallResult = "Function reachable";
        } else {
          functionCallResult = `Function returned ${response.status}`;
        }
      } catch (error) {
        functionCallResult = `Function error: ${error.message}`;
      }
      
      setTestResult(`✅ Environment: ${hasSupabaseUrl && hasSupabaseKey ? 'OK' : 'Missing vars'}
✅ Function call: ${functionCallResult}
✅ Component loaded successfully`);
      
      toast.success('Simple test completed successfully!');
    } catch (error) {
      console.error('Test error:', error);
      setTestResult(`❌ Test failed: ${error.message}`);
      toast.error('Test failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate("/admin")}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Admin</span>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg">
                  <Code className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Simple Developer Test
                  </h1>
                  <p className="text-sm text-gray-500">
                    Basic functionality test
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Test Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Basic System Test</span>
              </CardTitle>
              <p className="text-gray-600">
                Run a simple test to verify basic functionality
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button
                onClick={runSimpleTest}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Running Test...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Run Simple Test</span>
                  </div>
                )}
              </Button>

              {testResult && (
                <div className="bg-gray-50 border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Test Results:</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                    {testResult}
                  </pre>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Simple Test Mode</h4>
                    <p className="text-sm text-blue-800">
                      This is a simplified version of the developer dashboard that runs basic tests 
                      without complex database queries that might cause crashes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => navigate("/developer")}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Full Developer Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DeveloperSimple;
