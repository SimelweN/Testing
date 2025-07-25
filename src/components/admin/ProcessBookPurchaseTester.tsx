import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  RefreshCw,
  User,
  Book,
  DollarSign,
  Package,
  Loader2
} from 'lucide-react';

interface TestResult {
  success: boolean;
  timestamp: string;
  duration: number;
  request: any;
  response: any;
  error?: any;
  status?: number;
}

const ProcessBookPurchaseTester: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    book_id: '',
    buyer_id: user?.id || '',
    seller_id: '',
    amount: '',
    payment_reference: '',
    buyer_email: user?.email || '',
    shipping_address: JSON.stringify({
      street: "123 Test Street",
      city: "Cape Town",
      province: "Western Cape",
      postal_code: "8000",
      country: "South Africa"
    }, null, 2)
  });

  // Update form when user changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        buyer_id: user.id,
        buyer_email: user.email || ''
      }));
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateTestData = () => {
    const timestamp = Date.now();
    setFormData(prev => ({
      ...prev,
      book_id: `test-book-${timestamp}`,
      seller_id: `test-seller-${timestamp}`,
      amount: '150.00',
      payment_reference: `TEST_PAY_${timestamp}`
    }));
    toast.info('Test data generated');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const testFunction = async () => {
    if (!user) {
      toast.error('Please log in to test the function');
      return;
    }

    setIsLoading(true);
    const startTime = performance.now();

    try {
      // Parse shipping address JSON
      let shippingAddress;
      try {
        shippingAddress = JSON.parse(formData.shipping_address);
      } catch (e) {
        throw new Error('Invalid shipping address JSON format');
      }

      // Prepare request body
      const requestBody = {
        book_id: formData.book_id,
        buyer_id: formData.buyer_id,
        seller_id: formData.seller_id,
        amount: parseFloat(formData.amount),
        payment_reference: formData.payment_reference,
        buyer_email: formData.buyer_email,
        shipping_address: shippingAddress
      };

      console.log('🧪 Testing process-book-purchase with:', requestBody);

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('process-book-purchase', {
        body: requestBody
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      const result: TestResult = {
        success: !error,
        timestamp: new Date().toISOString(),
        duration: Math.round(duration),
        request: requestBody,
        response: data,
        error: error
      };

      setTestResult(result);

      if (error) {
        console.error('❌ Function returned error:', error);
        toast.error('Function returned an error - check response below');
      } else {
        console.log('✅ Function succeeded:', data);
        toast.success(`Function succeeded in ${duration.toFixed(0)}ms`);
      }

    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.error('💥 Test failed:', error);
      
      const result: TestResult = {
        success: false,
        timestamp: new Date().toISOString(),
        duration: Math.round(duration),
        request: formData,
        response: null,
        error: error instanceof Error ? error.message : String(error)
      };

      setTestResult(result);
      toast.error(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResult(null);
    toast.info('Results cleared');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Process Book Purchase Function Tester
          </CardTitle>
          <p className="text-sm text-gray-600">
            Test the process-book-purchase edge function with custom parameters and view the full response.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="book_id">Book ID</Label>
              <Input
                id="book_id"
                value={formData.book_id}
                onChange={(e) => handleInputChange('book_id', e.target.value)}
                placeholder="test-book-123"
              />
            </div>
            
            <div>
              <Label htmlFor="seller_id">Seller ID</Label>
              <Input
                id="seller_id"
                value={formData.seller_id}
                onChange={(e) => handleInputChange('seller_id', e.target.value)}
                placeholder="test-seller-456"
              />
            </div>

            <div>
              <Label htmlFor="buyer_id">Buyer ID</Label>
              <Input
                id="buyer_id"
                value={formData.buyer_id}
                onChange={(e) => handleInputChange('buyer_id', e.target.value)}
                placeholder="Auto-filled from current user"
                disabled
              />
            </div>

            <div>
              <Label htmlFor="amount">Amount (R)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="150.00"
              />
            </div>

            <div>
              <Label htmlFor="payment_reference">Payment Reference</Label>
              <Input
                id="payment_reference"
                value={formData.payment_reference}
                onChange={(e) => handleInputChange('payment_reference', e.target.value)}
                placeholder="TEST_PAY_123"
              />
            </div>

            <div>
              <Label htmlFor="buyer_email">Buyer Email</Label>
              <Input
                id="buyer_email"
                value={formData.buyer_email}
                onChange={(e) => handleInputChange('buyer_email', e.target.value)}
                placeholder="Auto-filled from current user"
                disabled
              />
            </div>
          </div>

          <div>
            <Label htmlFor="shipping_address">Shipping Address (JSON)</Label>
            <Textarea
              id="shipping_address"
              value={formData.shipping_address}
              onChange={(e) => handleInputChange('shipping_address', e.target.value)}
              placeholder="JSON object with address details"
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={testFunction}
              disabled={isLoading || !user}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Test Function
            </Button>

            <Button
              onClick={generateTestData}
              variant="outline"
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate Test Data
            </Button>

            <Button
              onClick={clearResults}
              variant="ghost"
              disabled={!testResult}
            >
              Clear Results
            </Button>
          </div>

          {!user && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                Please log in to test the function with real user data.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                Test Results
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                {testResult.duration}ms
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-4">
              <Badge 
                variant={testResult.success ? "default" : "destructive"}
                className="px-3 py-1"
              >
                {testResult.success ? "SUCCESS" : "FAILED"}
              </Badge>
              <span className="text-sm text-gray-600">
                {new Date(testResult.timestamp).toLocaleString()}
              </span>
            </div>

            {/* Request Data */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Request Data
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(testResult.request, null, 2))}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-64">
                {JSON.stringify(testResult.request, null, 2)}
              </pre>
            </div>

            <Separator />

            {/* Response Data */}
            {testResult.response && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Response Data
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(testResult.response, null, 2))}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <pre className="bg-green-50 border border-green-200 p-4 rounded-lg text-sm overflow-auto max-h-64">
                  {JSON.stringify(testResult.response, null, 2)}
                </pre>
              </div>
            )}

            {/* Error Data */}
            {testResult.error && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold flex items-center gap-2 text-red-600">
                    <XCircle className="w-4 h-4" />
                    Error Data
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(testResult.error, null, 2))}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <pre className="bg-red-50 border border-red-200 p-4 rounded-lg text-sm overflow-auto max-h-64">
                  {typeof testResult.error === 'string' 
                    ? testResult.error 
                    : JSON.stringify(testResult.error, null, 2)
                  }
                </pre>
              </div>
            )}

            {/* Raw Console Logs Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> Check the browser console for detailed edge function logs including 
                step-by-step processing, database queries, and internal function behavior.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProcessBookPurchaseTester;
