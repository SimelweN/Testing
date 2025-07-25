import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, TestTube, AlertCircle, CheckCircle } from 'lucide-react';
import { lockerService } from '@/services/lockerService';
import { toast } from 'sonner';

const LockerApiDebug: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testEdgeFunction = async () => {
    setTesting(true);
    setResults(null);

    try {
      console.log('🧪 Starting edge function test...');

      // First check if edge function URL is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        setResults({
          type: 'edge-function',
          success: false,
          error: 'VITE_SUPABASE_URL not configured'
        });
        toast.error('❌ Supabase URL not configured');
        return;
      }

      const result = await lockerService.testEdgeFunction();

      setResults({
        type: 'edge-function',
        ...result,
        supabaseUrl,
        edgeFunctionUrl: `${supabaseUrl}/functions/v1/courier-guy-lockers`
      });

      if (result.success) {
        toast.success('✅ Edge function is working!');
      } else {
        if (result.error?.includes('502')) {
          toast.error('❌ Edge function deployment issue (502)', {
            description: 'Function may not be deployed or has runtime errors'
          });
        } else {
          toast.error(`❌ Edge function failed: ${result.error}`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResults({
        type: 'edge-function',
        success: false,
        error: errorMessage
      });
      toast.error(`❌ Test failed: ${errorMessage}`);
    } finally {
      setTesting(false);
    }
  };

  const testDirectApi = async () => {
    setTesting(true);
    setResults(null);
    
    try {
      console.log('🧪 Starting direct API test...');
      const result = await lockerService.testRealPudoApi();
      
      setResults({
        type: 'direct-api',
        ...result
      });
      
      if (result.success) {
        toast.success('✅ Direct API is working!');
      } else {
        toast.error(`❌ Direct API failed: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResults({
        type: 'direct-api',
        success: false,
        error: errorMessage
      });
      toast.error(`❌ Test failed: ${errorMessage}`);
    } finally {
      setTesting(false);
    }
  };

  const testConnectivity = async () => {
    setTesting(true);
    setResults(null);
    
    try {
      console.log('🧪 Starting connectivity test...');
      const result = await lockerService.testApiConnectivity();
      
      setResults({
        type: 'connectivity',
        ...result
      });
      
      if (result.success) {
        toast.success('✅ API connectivity test passed!');
      } else {
        toast.error(`❌ Connectivity test failed: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResults({
        type: 'connectivity',
        success: false,
        error: errorMessage
      });
      toast.error(`❌ Test failed: ${errorMessage}`);
    } finally {
      setTesting(false);
    }
  };

  const getLockers = async () => {
    setTesting(true);
    setResults(null);
    
    try {
      console.log('🧪 Fetching all lockers...');
      const lockers = await lockerService.getLockers(true); // Force refresh
      
      setResults({
        type: 'get-lockers',
        success: true,
        lockers: lockers.slice(0, 3), // Show first 3 for preview
        totalCount: lockers.length
      });
      
      toast.success(`✅ Loaded ${lockers.length} lockers`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResults({
        type: 'get-lockers',
        success: false,
        error: errorMessage
      });
      toast.error(`❌ Failed to get lockers: ${errorMessage}`);
    } finally {
      setTesting(false);
    }
  };

  const renderResults = () => {
    if (!results) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {results.success ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            Test Results - {results.type}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={results.success ? "default" : "destructive"}>
                {results.success ? "SUCCESS" : "FAILED"}
              </Badge>
              {results.endpoint && (
                <Badge variant="secondary">{results.endpoint}</Badge>
              )}
            </div>

            {results.error && (
              <Alert variant="destructive">
                <AlertDescription>{results.error}</AlertDescription>
              </Alert>
            )}

            {results.data && (
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm">
                <p className="font-medium mb-2">Response Data:</p>
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(results.data, null, 2)}
                </pre>
              </div>
            )}

            {results.lockers && (
              <div className="space-y-2">
                <p className="font-medium">Sample Lockers ({results.totalCount} total):</p>
                {results.lockers.map((locker: any, index: number) => (
                  <div key={index} className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">
                    <p><strong>{locker.name}</strong></p>
                    <p>{locker.address}</p>
                    <p>{locker.city}, {locker.province}</p>
                    <p>Hours: {locker.opening_hours || 'Not available'}</p>
                  </div>
                ))}
              </div>
            )}

            {results.details && (
              <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded text-sm">
                <p className="font-medium mb-2">Details:</p>
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(results.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Locker API Debug Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button 
              onClick={testEdgeFunction} 
              disabled={testing}
              variant="outline"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Test Edge Function
            </Button>
            
            <Button 
              onClick={testDirectApi} 
              disabled={testing}
              variant="outline"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Test Direct API
            </Button>
            
            <Button 
              onClick={testConnectivity} 
              disabled={testing}
              variant="outline"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Test Connectivity
            </Button>
            
            <Button 
              onClick={getLockers} 
              disabled={testing}
              variant="default"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Get Lockers
            </Button>
          </div>
          
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Use these tools to test different locker API endpoints and identify the source of the issue.
              Check the browser console for detailed logs.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {renderResults()}
    </div>
  );
};

export default LockerApiDebug;
