/**
 * Test script to verify error handling fixes
 * Tests that edge functions no longer return "[object Object]" errors
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eqamrjcdxdmayamtkpyf.supabase.co';

async function testErrorHandling() {
  console.log('🧪 Testing Edge Function Error Handling Fixes\n');

  // Test functions that are likely to have errors with invalid data
  const testCases = [
    {
      function: 'commit-to-sale',
      payload: { order_id: 'invalid_uuid' }, // This should trigger UUID validation error
      expectedErrorPattern: /UUID_VALIDATION_FAILED|VALIDATION_FAILED/
    },
    {
      function: 'create-order',
      payload: { invalid: 'data' }, // This should trigger validation error
      expectedErrorPattern: /VALIDATION_FAILED|ORDER_CREATION_FAILED/
    },
    {
      function: 'decline-commit',
      payload: { order_id: 'invalid_uuid' }, // This should trigger UUID validation error
      expectedErrorPattern: /UUID_VALIDATION_FAILED|VALIDATION_FAILED/
    }
  ];

  let allTestsPassed = true;

  for (const testCase of testCases) {
    console.log(`\n📤 Testing ${testCase.function} with invalid data...`);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${testCase.function}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxYW1yamNkeGRtYXlhbXRrcHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5NzI3NjUsImV4cCI6MjA0NzU0ODc2NX0.lG2rtmfZMJ4OLPsQwRnOg8tUV1EKh0b5nYqAZbdU8JU'}`
        },
        body: JSON.stringify(testCase.payload)
      });

      if (!response.ok) {
        // For edge function errors, check the response body
        const responseText = await response.text();
        console.log(`📝 Response Status: ${response.status}`);
        console.log(`📝 Response Body: ${responseText}`);
        
        // Check if the response contains "[object Object]"
        if (responseText.includes('[object Object]')) {
          console.log(`❌ FAIL: ${testCase.function} still returns "[object Object]" error`);
          allTestsPassed = false;
        } else {
          console.log(`✅ PASS: ${testCase.function} returns proper error message (not "[object Object]")`);
          
          // Try to parse as JSON to check error structure
          try {
            const errorData = JSON.parse(responseText);
            if (errorData.error || errorData.details?.error_message) {
              console.log(`✅ Structured error response: ${errorData.error || errorData.details?.error_message}`);
            }
          } catch {
            console.log(`✅ Non-JSON error response: ${responseText.substring(0, 100)}...`);
          }
        }
      } else {
        const responseData = await response.json();
        console.log(`✅ PASS: ${testCase.function} returned successful response (unexpected but not an error)`);
      }

    } catch (fetchError) {
      console.log(`❌ Network error testing ${testCase.function}:`, fetchError.message);
      allTestsPassed = false;
    }
  }

  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('✅ All error handling tests passed! No more "[object Object]" errors.');
  } else {
    console.log('❌ Some tests failed. "[object Object]" errors may still exist.');
  }
  console.log('='.repeat(50));
}

// Run the test
testErrorHandling().catch(console.error);
