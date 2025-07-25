import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const EdgeFunctionDebug: React.FC = () => {
  const { user } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testProcessBookPurchase = async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    setLoading(true);
    setResult(null);

    const testPayload = {
      book_id: "test-book-123",
      buyer_id: user.id,
      seller_id: "test-seller-456",
      amount: 100,
      payment_reference: `test-${Date.now()}`,
      buyer_email: user.email,
      shipping_address: {
        street: "123 Test Street",
        city: "Cape Town",
        province: "Western Cape", 
        postal_code: "8000",
        country: "South Africa"
      }
    };

    console.log('🧪 Testing with payload:', testPayload);

    try {
      const { data, error } = await supabase.functions.invoke('process-book-purchase', {
        body: testPayload
      });

      console.log('🧪 Raw response data:', data);
      console.log('🧪 Raw response error:', error);

      if (error) {
        console.log('🔍 Error analysis:');
        console.log('  Type:', typeof error);
        console.log('  Constructor:', error?.constructor?.name);
        console.log('  Message:', error?.message);
        console.log('  Details:', error?.details);
        console.log('  Code:', error?.code);
        console.log('  Hint:', error?.hint);
        console.log('  JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        
        setResult({
          success: false,
          type: 'error',
          data: error,
          analysis: {
            type: typeof error,
            constructor: error?.constructor?.name,
            message: error?.message,
            details: error?.details,
            code: error?.code,
            hint: error?.hint,
            stringified: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
          }
        });

        toast.error('Edge function returned error - check console');
      } else {
        console.log('✅ Success:', data);
        setResult({
          success: true,
          type: 'success',
          data: data
        });
        toast.success('Edge function succeeded');
      }

    } catch (invokeError) {
      console.error('💥 Invoke error:', invokeError);
      setResult({
        success: false,
        type: 'invoke_error',
        data: invokeError,
        analysis: {
          type: typeof invokeError,
          constructor: invokeError?.constructor?.name,
          message: invokeError?.message,
          stringified: JSON.stringify(invokeError, Object.getOwnPropertyNames(invokeError), 2)
        }
      });
      toast.error('Function invoke failed - check console');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Edge Function Debug: process-book-purchase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Test the process-book-purchase edge function directly to debug the "[object Object]" error.
          </p>

          <Button 
            onClick={testProcessBookPurchase}
            disabled={loading || !user}
            className="w-full"
          >
            {loading ? '🔄 Testing...' : '🧪 Test Edge Function'}
          </Button>

          {!user && (
            <p className="text-red-600 text-sm">Please log in to test the function</p>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className={`${result.success ? 'text-green-600' : 'text-red-600'}`}>
              {result.success ? '✅ Success' : '❌ Error'} - {result.type}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Raw Data:</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-96">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>

              {result.analysis && (
                <div>
                  <h3 className="font-semibold mb-2">Error Analysis:</h3>
                  <pre className="bg-red-50 p-3 rounded text-sm overflow-auto max-h-96">
                    {JSON.stringify(result.analysis, null, 2)}
                  </pre>
                </div>
              )}

              <div className="text-sm text-gray-600">
                <p><strong>Type:</strong> {result.analysis?.type || typeof result.data}</p>
                <p><strong>Constructor:</strong> {result.analysis?.constructor || result.data?.constructor?.name}</p>
                {result.analysis?.message && (
                  <p><strong>Message:</strong> {result.analysis.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EdgeFunctionDebug;
