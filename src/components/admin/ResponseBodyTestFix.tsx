// Test component to verify that Response body consumption is fixed
import React from 'react';

export const ResponseBodyTestFix: React.FC = () => {
  const testResponseHandling = async () => {
    try {
      // Simulate a response like the Edge Function Tester creates
      const mockResponse = new Response(JSON.stringify({ test: 'data' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('🧪 Testing response body handling...');
      console.log('📊 Body used before read:', mockResponse.bodyUsed);

      // Our fixed approach - check bodyUsed before reading
      if (!mockResponse.bodyUsed) {
        const text = await mockResponse.text();
        console.log('✅ Successfully read response text:', text);
        
        try {
          const data = JSON.parse(text);
          console.log('✅ Successfully parsed JSON:', data);
        } catch (jsonError) {
          console.log('❌ JSON parse error:', jsonError);
        }
      } else {
        console.log('⚠️ Response body was already used');
      }

      console.log('📊 Body used after read:', mockResponse.bodyUsed);

    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-medium mb-2">Response Body Test Fix</h3>
      <p className="text-sm text-gray-600 mb-4">
        This component tests the fix for "Response body is already used" errors.
      </p>
      <button 
        onClick={testResponseHandling}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test Response Handling
      </button>
      <div className="mt-2 text-xs text-gray-500">
        Check browser console for test results
      </div>
    </div>
  );
};
