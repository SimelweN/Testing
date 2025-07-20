#!/usr/bin/env node

/**
 * Test script to verify all Edge Functions have complete mock data
 * This runs without needing Supabase local development setup
 */

// Import the mock data validation from our files
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Edge Functions Mock Data Completeness\n');

// Read the index.ts file to extract function names
const indexPath = path.join(__dirname, 'supabase/functions/_mock-data/index.ts');

if (!fs.existsSync(indexPath)) {
  console.error('❌ Mock data index file not found:', indexPath);
  process.exit(1);
}

const indexContent = fs.readFileSync(indexPath, 'utf8');

// Extract function names from FunctionMockData object
const functionDataMatch = indexContent.match(/export const FunctionMockData = \{([\s\S]*?)\};/);
if (!functionDataMatch) {
  console.error('❌ Could not find FunctionMockData in index file');
  process.exit(1);
}

const functionDataContent = functionDataMatch[1];
const functionNames = [];

// Extract function names (quoted strings followed by colon)
const functionRegex = /"([^"]+)":/g;
let match;
while ((match = functionRegex.exec(functionDataContent)) !== null) {
  functionNames.push(match[1]);
}

console.log(`📊 Found ${functionNames.length} Edge Functions with mock data:\n`);

// Test each function's mock data presence
const results = {
  total: functionNames.length,
  passed: 0,
  failed: 0,
  details: []
};

functionNames.forEach((functionName, index) => {
  const hasCompleteData = checkFunctionMockData(functionName, functionDataContent);
  
  if (hasCompleteData) {
    console.log(`✅ ${index + 1}. ${functionName} - Complete mock data`);
    results.passed++;
  } else {
    console.log(`❌ ${index + 1}. ${functionName} - Incomplete mock data`);
    results.failed++;
  }
  
  results.details.push({
    name: functionName,
    passed: hasCompleteData
  });
});

function checkFunctionMockData(functionName, content) {
  // Look for the function definition in the content
  const functionPattern = new RegExp(`"${functionName}":\\s*\\{([^}]*(?:\\{[^}]*\\}[^}]*)*)?\\}`, 'g');
  const match = functionPattern.exec(content);
  
  if (!match) {
    return false;
  }
  
  const functionData = match[1];
  
  // Check for required fields based on function type
  const requiredFields = getRequiredFields(functionName);
  
  if (requiredFields.length === 0) {
    return true; // No specific requirements (like auto-expire functions)
  }
  
  return requiredFields.every(field => {
    const fieldPattern = new RegExp(`"?${field}"?\\s*:`);
    return fieldPattern.test(functionData);
  });
}

function getRequiredFields(functionName) {
  const fieldMap = {
    'initialize-paystack-payment': ['user_id', 'items', 'total_amount', 'email'],
    'paystack-webhook': ['headers', 'body'],
    'verify-paystack-payment': ['reference'],
    'process-book-purchase': ['user_id', 'book_id', 'email', 'payment_reference'],
    'create-order': ['buyer_id', 'buyer_email', 'cart_items'],
    'commit-to-sale': ['order_id', 'seller_id'],
    'get-delivery-quotes': ['fromAddress', 'toAddress', 'weight'],
    'automate-delivery': ['order_id', 'seller_address', 'buyer_address'],
    'send-email': ['to', 'subject', 'html'],
    'courier-guy-quote': ['fromAddress', 'toAddress', 'weight'],
    'courier-guy-shipment': ['order_id', 'pickup_address', 'delivery_address'],
    'fastway-quote': ['fromAddress', 'toAddress', 'weight'],
    'fastway-shipment': ['order_id', 'pickup_address', 'delivery_address'],
    'create-paystack-subaccount': ['business_name', 'settlement_bank', 'account_number'],
  };
  
  return fieldMap[functionName] || [];
}

console.log('\n📈 Test Results Summary:');
console.log(`Total Functions: ${results.total}`);
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`📊 Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);

if (results.failed > 0) {
  console.log('\n❌ Functions with incomplete mock data:');
  results.details
    .filter(detail => !detail.passed)
    .forEach(detail => console.log(`   - ${detail.name}`));
}

console.log('\n🎯 Summary:');
if (results.failed === 0) {
  console.log('🎉 ALL Edge Functions have complete mock data!');
  console.log('✅ You can now test any function by adding ?test=true to the URL');
  console.log('🚀 No more "missing required fields" errors during testing!');
} else {
  console.log(`⚠️  ${results.failed} functions need mock data improvements`);
}

console.log('\n📚 Next Steps:');
console.log('1. Test functions with: curl "https://your-project.supabase.co/functions/v1/FUNCTION_NAME?test=true"');
console.log('2. Use the complete mock data for your integration tests');
console.log('3. Focus on testing business logic instead of input validation');

// Create a simple test status file
const statusFile = {
  timestamp: new Date().toISOString(),
  total_functions: results.total,
  functions_with_complete_mock_data: results.passed,
  functions_needing_improvement: results.failed,
  success_rate: Math.round((results.passed / results.total) * 100),
  all_functions_ready: results.failed === 0,
  testing_instructions: [
    "Add ?test=true to any Edge Function URL for instant testing",
    "All required fields are included in mock data",
    "Focus on testing business logic, not input validation"
  ]
};

fs.writeFileSync('edge-functions-test-status.json', JSON.stringify(statusFile, null, 2));
console.log('\n💾 Test status saved to: edge-functions-test-status.json');
