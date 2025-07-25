import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const EdgeFunctionTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testProcessBookPurchase = async () => {
    setTesting(true);
    setResult(null);

    try {
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('User not authenticated');
      }

      const testRequest = {
        book_id: "test-book-id",
        buyer_id: userData.user.id,
        seller_id: "test-seller-id", 
        amount: 100,
        payment_reference: `test-${Date.now()}`,
        buyer_email: userData.user.email,
        shipping_address: {
          street: "123 Test Street",
          city: "Cape Town",
          province: "Western Cape",
          postal_code: "8000",
          country: "South Africa"
        }
      };

      console.log("🧪 Testing edge function with:", testRequest);

      const { data, error } = await supabase.functions.invoke('process-book-purchase', {
        body: testRequest
      });

      console.log("🧪 Edge function test result:", { data, error });

      if (error) {
        console.error("🧪 Edge function error details:", {
          error,
          type: typeof error,
          constructor: error?.constructor?.name,
          message: error?.message,
          details: error?.details,
          code: error?.code,
          hint: error?.hint,
          stringified: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
        });
        
        setResult({ 
          success: false, 
          error,
          errorMessage: error?.message || String(error),
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
        });
        toast.error(`Edge function error: ${error?.message || String(error)}`);
      } else {
        setResult({ success: true, data });
        toast.success('Edge function test successful!');
      }

    } catch (err) {
      console.error("🧪 Test error:", err);
      setResult({ 
        success: false, 
        error: err,
        errorMessage: err instanceof Error ? err.message : String(err)
      });
      toast.error(`Test failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Edge Function Test</h2>
      
      <Button 
        onClick={testProcessBookPurchase} 
        disabled={testing}
        className="mb-4"
      >
        {testing ? 'Testing...' : 'Test process-book-purchase Edge Function'}
      </Button>

      {result && (
        <div className="mt-4 p-4 border rounded">
          <h3 className="font-semibold mb-2">Test Result:</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default EdgeFunctionTest;
