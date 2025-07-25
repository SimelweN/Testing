import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Loader2,
  Zap,
  AlertCircle
} from "lucide-react";

interface EdgeFunctionTest {
  name: string;
  displayName: string;
  description: string;
  testData: any;
  expectedResult?: string;
}

const EdgeFunctionTester: React.FC = () => {
  const [selectedFunction, setSelectedFunction] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [customData, setCustomData] = useState<string>("");

  const edgeFunctions: EdgeFunctionTest[] = [
    {
      name: "enhanced-commit-to-sale",
      displayName: "🆕 Enhanced Commit (Locker-to-Door)",
      description: "Test the new locker-to-door commit functionality",
      testData: {
        order_id: "test-order-123",
        seller_id: "test-seller-456",
        delivery_method: "locker",
        locker_id: "CG_SANDTON_001",
        use_locker_api: true
      },
      expectedResult: "Locker shipment created with QR code"
    },
    {
      name: "commit-to-sale",
      displayName: "Standard Commit to Sale",
      description: "Test the original commit functionality",
      testData: {
        order_id: "test-order-123",
        seller_id: "test-seller-456"
      },
      expectedResult: "Order committed successfully"
    },
    {
      name: "initialize-paystack-payment",
      displayName: "Paystack Payment Init",
      description: "Test payment initialization",
      testData: {
        email: "test@example.com",
        amount: 10000,
        order_id: "test-order-123"
      },
      expectedResult: "Payment URL generated"
    },
    {
      name: "courier-guy-quote",
      displayName: "Courier Guy Quote",
      description: "Test delivery quote generation",
      testData: {
        pickup_address: "123 Test Street, Cape Town",
        delivery_address: "456 Main Road, Johannesburg",
        weight: 0.5
      },
      expectedResult: "Quote with price and delivery time"
    },
    {
      name: "courier-guy-shipment",
      displayName: "Courier Guy Shipment",
      description: "Test shipment creation",
      testData: {
        sender_name: "Test Seller",
        sender_phone: "0123456789",
        receiver_name: "Test Buyer",
        receiver_phone: "0987654321",
        pickup_address: "123 Test Street, Cape Town",
        delivery_address: "456 Main Road, Johannesburg"
      },
      expectedResult: "Tracking number generated"
    },
    {
      name: "health-test",
      displayName: "Health Check",
      description: "Test basic edge function connectivity",
      testData: { test: true },
      expectedResult: "Health check passed"
    }
  ];

  const selectedFunctionData = edgeFunctions.find(f => f.name === selectedFunction);

  const runTest = async () => {
    if (!selectedFunction) {
      toast.error("Please select a function to test");
      return;
    }

    setIsLoading(true);
    
    try {
      const testData = customData 
        ? JSON.parse(customData)
        : selectedFunctionData?.testData || {};

      console.log(`🧪 Testing edge function: ${selectedFunction}`, testData);

      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke(selectedFunction, {
        body: testData,
      });

      const duration = Date.now() - startTime;

      const result = {
        function: selectedFunction,
        timestamp: new Date().toLocaleTimeString(),
        duration: `${duration}ms`,
        success: !error,
        data: data,
        error: error,
        testData: testData
      };

      setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results

      if (error) {
        console.error(`❌ Function ${selectedFunction} failed:`, error);
        toast.error(`Test Failed: ${error.message || 'Unknown error'}`);
      } else {
        console.log(`✅ Function ${selectedFunction} succeeded:`, data);
        toast.success(`Test Passed: ${selectedFunction} (${duration}ms)`);
      }

    } catch (error) {
      console.error(`💥 Test error for ${selectedFunction}:`, error);
      
      const result = {
        function: selectedFunction,
        timestamp: new Date().toLocaleTimeString(),
        duration: 'N/A',
        success: false,
        data: null,
        error: error instanceof Error ? error.message : String(error),
        testData: customData ? JSON.parse(customData) : selectedFunctionData?.testData
      };

      setTestResults(prev => [result, ...prev.slice(0, 9)]);
      toast.error(`Test Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runAllTests = async () => {
    toast.info("Running all edge function tests...");
    
    for (const func of edgeFunctions) {
      setSelectedFunction(func.name);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
      await runTest();
    }
    
    toast.success("All tests completed!");
  };

  const clearResults = () => {
    setTestResults([]);
    toast.info("Test results cleared");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <span>Edge Function Tester</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="function-select">Select Function</Label>
              <Select value={selectedFunction} onValueChange={setSelectedFunction}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a function to test" />
                </SelectTrigger>
                <SelectContent>
                  {edgeFunctions.map((func) => (
                    <SelectItem key={func.name} value={func.name}>
                      {func.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end space-x-2">
              <Button
                onClick={runTest}
                disabled={!selectedFunction || isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Run Test
              </Button>
              
              <Button
                onClick={runAllTests}
                disabled={isLoading}
                variant="outline"
              >
                <Package className="w-4 h-4 mr-2" />
                Test All
              </Button>

              <Button
                onClick={clearResults}
                disabled={isLoading}
                variant="ghost"
                size="sm"
              >
                Clear
              </Button>
            </div>
          </div>

          {selectedFunctionData && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">{selectedFunctionData.displayName}</h4>
              <p className="text-sm text-gray-600 mb-2">{selectedFunctionData.description}</p>
              <p className="text-xs text-green-600">Expected: {selectedFunctionData.expectedResult}</p>
            </div>
          )}

          <div>
            <Label htmlFor="custom-data">Custom Test Data (JSON)</Label>
            <Input
              id="custom-data"
              value={customData}
              onChange={(e) => setCustomData(e.target.value)}
              placeholder='{"order_id": "custom-test-123"}'
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use default test data for selected function
            </p>
          </div>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Test Results</span>
              <Badge variant="outline">{testResults.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {result.success ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="font-medium">{result.function}</span>
                      <Badge variant="outline" className="text-xs">
                        {result.duration}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">{result.timestamp}</span>
                  </div>

                  {result.success ? (
                    <div className="text-sm">
                      <p className="text-green-700 mb-1">✅ Test passed</p>
                      {result.data && (
                        <pre className="bg-green-100 p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm">
                      <p className="text-red-700 mb-1">❌ {result.error}</p>
                      {result.testData && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-600 cursor-pointer">
                            Test Data Used
                          </summary>
                          <pre className="bg-red-100 p-2 rounded text-xs overflow-x-auto mt-1">
                            {JSON.stringify(result.testData, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <AlertCircle className="w-5 h-5" />
            <span>🆕 Locker-to-Door Testing Notes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• The "Enhanced Commit (Locker-to-Door)" function tests the new locker delivery system</li>
            <li>• It should generate QR codes and waybill URLs for locker drop-off</li>
            <li>• Test with different locker IDs: CG_SANDTON_001, CG_CANALWALK_001, etc.</li>
            <li>• Verify that early payment dates are set (3 days earlier than standard)</li>
            <li>• Check that proper notifications are created for buyers</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default EdgeFunctionTester;
