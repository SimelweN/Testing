// Simple mock data completeness checker
// Check if all functions have their basic required fields

const fs = require('fs');

// Read the mock data index file
const mockDataFile = fs.readFileSync('supabase/functions/_mock-data/index.ts', 'utf8');

// Extract the FunctionMockData object
const functionDataMatch = mockDataFile.match(/export const FunctionMockData = \{([\s\S]*?)\};/);
if (!functionDataMatch) {
  console.error('Could not find FunctionMockData');
  process.exit(1);
}

const functionDataContent = functionDataMatch[1];

// Extract function names
const functionNames = [];
const functionRegex = /"([^"]+)":/g;
let match;
while ((match = functionRegex.exec(functionDataContent)) !== null) {
  functionNames.push(match[1]);
}

console.log('🧪 EDGE FUNCTIONS MOCK DATA COMPLETENESS CHECK\n');
console.log(`Found ${functionNames.length} functions with mock data:\n`);

// Check each function for basic completeness
const requiredFieldsMap = {
  'initialize-paystack-payment': ['user_id', 'items', 'total_amount', 'email'],
  'paystack-webhook': ['headers', 'body'],
  'verify-paystack-payment': ['reference'],
  'process-book-purchase': ['user_id', 'book_id', 'email', 'payment_reference'],
  'process-multi-seller-purchase': ['user_id', 'email', 'cart_items'],
  'create-order': ['buyer_id', 'buyer_email', 'cart_items'],
  'send-email': ['to', 'subject'],
  'commit-to-sale': ['order_id', 'seller_id'],
  'decline-commit': ['order_id', 'seller_id'],
  'mark-collected': ['order_id', 'seller_id'],
  // 'pay-seller': removed - no automated seller payments
  'create-paystack-subaccount': ['business_name', 'email', 'bank_name', 'bank_code', 'account_number'],
  'manage-paystack-subaccount': ['action', 'subaccount_code', 'business_name', 'settlement_bank', 'account_number'],
  'courier-guy-quote': ['fromAddress', 'toAddress', 'weight'],
  'courier-guy-shipment': ['order_id', 'pickup_address', 'delivery_address'],
  'fastway-quote': ['fromAddress', 'toAddress', 'weight'],
  'fastway-shipment': ['order_id', 'pickup_address', 'delivery_address'],
  'get-delivery-quotes': ['fromAddress', 'toAddress', 'weight'],
  'automate-delivery': ['order_id', 'seller_address', 'buyer_address'],
  'courier-guy-track': ['tracking_number'],
  'fastway-track': ['consignment_number'],
  'debug-email-template': ['templateName', 'template'],
  'paystack-refund-management': ['action', 'transaction_reference'],
  // 'paystack-transfer-management': removed - no automated transfers
  'paystack-split-management': ['action']
};

let passed = 0;
let failed = 0;
const failedFunctions = [];

functionNames.forEach((functionName, index) => {
  const requiredFields = requiredFieldsMap[functionName] || [];
  
  if (requiredFields.length === 0) {
    console.log(`✅ ${index + 1}. ${functionName} (no specific requirements)`);
    passed++;
    return;
  }

  // Extract the function's mock data
  const functionPattern = new RegExp(`"${functionName}":\\s*\\{([^}]*(?:\\{[^}]*\\}[^}]*)*)?\\}`, 'g');
  const functionMatch = functionPattern.exec(functionDataContent);
  
  if (!functionMatch) {
    console.log(`❌ ${index + 1}. ${functionName} - No mock data found`);
    failed++;
    failedFunctions.push(`${functionName}: No mock data found`);
    return;
  }

  const functionData = functionMatch[1];
  const missingFields = [];

  // Check for required fields
  requiredFields.forEach(field => {
    if (field.includes('.')) {
      // Handle nested fields like fromAddress.suburb - simplified check
      const [parent, child] = field.split('.');
      const parentPattern = new RegExp(`"?${parent}"?\\s*:\\s*\\{`);
      const childPattern = new RegExp(`"?${child}"?\\s*:`);
      
      if (!parentPattern.test(functionData) || !childPattern.test(functionData)) {
        missingFields.push(field);
      }
    } else {
      const fieldPattern = new RegExp(`"?${field}"?\\s*:`);
      if (!fieldPattern.test(functionData)) {
        missingFields.push(field);
      }
    }
  });

  if (missingFields.length === 0) {
    console.log(`✅ ${index + 1}. ${functionName} - Complete`);
    passed++;
  } else {
    console.log(`❌ ${index + 1}. ${functionName} - Missing: ${missingFields.join(', ')}`);
    failed++;
    failedFunctions.push(`${functionName}: Missing ${missingFields.join(', ')}`);
  }
});

console.log('\n📊 SUMMARY:');
console.log(`Total Functions: ${functionNames.length}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${Math.round((passed / functionNames.length) * 100)}%`);

if (failed > 0) {
  console.log('\n❌ FUNCTIONS WITH ISSUES:');
  failedFunctions.forEach(issue => console.log(`  - ${issue}`));
  console.log('\n🔧 ACTION REQUIRED: Fix the missing fields above');
} else {
  console.log('\n🎉 ALL FUNCTIONS HAVE COMPLETE MOCK DATA!');
  console.log('✅ Ready for testing - no missing field errors expected');
}

console.log('\n🧪 TESTING INSTRUCTIONS:');
console.log('Add ?test=true to any Edge Function URL to test with complete mock data:');
console.log('- curl "https://your-project.supabase.co/functions/v1/FUNCTION_NAME?test=true"');
console.log('- Focus on testing business logic instead of input validation');

// Create a status file
const status = {
  timestamp: new Date().toISOString(),
  totalFunctions: functionNames.length,
  passedFunctions: passed,
  failedFunctions: failed,
  successRate: Math.round((passed / functionNames.length) * 100),
  allComplete: failed === 0,
  issues: failedFunctions
};

fs.writeFileSync('mock-data-status.json', JSON.stringify(status, null, 2));
console.log('\n💾 Status saved to: mock-data-status.json');
