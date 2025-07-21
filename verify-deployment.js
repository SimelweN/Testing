/**
 * Deployment Verification Script
 * Tests Edge Function deployment and CORS functionality
 */

// Configuration - Update with your actual Supabase URL
const SUPABASE_URL = 'https://eqamrjcdxdmayamtkpyf.supabase.co'; // Your project URL
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxYW1yamNkeGRtYXlhbXRrcHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5NzI3NjUsImV4cCI6MjA0NzU0ODc2NX0.lG2rtmfZMJ4OLPsQwRnOg8tUV1EKh0b5nYqAZbdU8JU';

// Functions to test
const FUNCTIONS_TO_TEST = [
  'health-test',
  'paystack-split-management',
  'create-order',
  'commit-to-sale',
  'decline-commit'
];

async function testFunction(functionName) {
  console.log(`\n🧪 Testing ${functionName}...`);
  
  try {
    // Test OPTIONS request first (CORS preflight)
    console.log(`   📋 Testing OPTIONS request...`);
    const optionsResponse = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://rebooked-solutions.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });

    console.log(`   📋 OPTIONS Status: ${optionsResponse.status}`);
    console.log(`   📋 CORS Headers:`);
    console.log(`      - Allow-Origin: ${optionsResponse.headers.get('Access-Control-Allow-Origin')}`);
    console.log(`      - Allow-Methods: ${optionsResponse.headers.get('Access-Control-Allow-Methods')}`);
    console.log(`      - Allow-Headers: ${optionsResponse.headers.get('Access-Control-Allow-Headers')}`);

    if (optionsResponse.status !== 200) {
      console.log(`   ❌ OPTIONS failed with status ${optionsResponse.status}`);
      return false;
    }

    // Test actual POST request
    console.log(`   📤 Testing POST request...`);
    const postResponse = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
        'Origin': 'https://rebooked-solutions.vercel.app'
      },
      body: JSON.stringify({ test: true })
    });

    console.log(`   📤 POST Status: ${postResponse.status}`);
    
    if (postResponse.status === 404) {
      console.log(`   ❌ Function not deployed or incorrect URL`);
      return false;
    }

    // Check response body
    const responseText = await postResponse.text();
    console.log(`   📤 Response: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`);

    console.log(`   ✅ ${functionName} is accessible`);
    return true;

  } catch (error) {
    console.log(`   ❌ Network error: ${error.message}`);
    return false;
  }
}

async function runDeploymentVerification() {
  console.log('🚀 Edge Function Deployment Verification');
  console.log('==========================================');
  console.log(`📍 Testing Supabase URL: ${SUPABASE_URL}`);
  console.log(`🔑 Using anon key: ${ANON_KEY.substring(0, 20)}...`);

  let successCount = 0;
  let totalCount = FUNCTIONS_TO_TEST.length;

  for (const functionName of FUNCTIONS_TO_TEST) {
    const success = await testFunction(functionName);
    if (success) successCount++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Results: ${successCount}/${totalCount} functions accessible`);
  
  if (successCount === totalCount) {
    console.log('✅ All Edge Functions are properly deployed and accessible!');
  } else {
    console.log('❌ Some Edge Functions have deployment issues.');
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Run: supabase functions list');
    console.log('2. Deploy missing functions: supabase functions deploy <function-name>');
    console.log('3. Check function logs: supabase functions logs <function-name>');
    console.log('4. Verify project URL and anon key');
  }
  console.log('='.repeat(50));
}

// Run the verification
runDeploymentVerification().catch(console.error);
