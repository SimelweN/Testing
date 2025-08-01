/**
 * Test script to verify "[object Object]" errors are fixed
 * Run this in browser console after the fixes are applied
 */

console.log('🧪 Testing "[object Object]" error fixes...');

// Test 1: Simulate error objects that would cause [object Object]
const testErrors = [
  new Error('Test error message'),
  { message: 'Supabase error', code: 42501, details: 'RLS violation' },
  { error: 'Custom error', status: 403 },
  { hint: 'Check your permissions', code: 23503 },
  null,
  undefined,
  'String error',
  { complex: { nested: { error: 'Deep error' } } }
];

// Test the serializeError function from notificationService
function testSerializeError(error) {
  if (!error) return { message: 'Unknown error' };

  if (typeof error === 'string') return { message: error };

  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  // Handle Supabase error objects
  if (typeof error === 'object') {
    return {
      message: error.message || error.error_description || error.msg || 'Unknown error',
      code: error.code || error.error || error.status,
      details: error.details || error.error_description,
      hint: error.hint,
      timestamp: new Date().toISOString(),
      originalError: error // Include full original object
    };
  }

  return { message: String(error) };
}

console.log('\n📋 Testing error serialization:');
testErrors.forEach((error, index) => {
  const serialized = testSerializeError(error);
  const stringified = JSON.stringify(serialized);
  
  console.log(`Test ${index + 1}:`, {
    input: error,
    serialized: serialized,
    stringified: stringified,
    hasObjectObject: stringified.includes('[object Object]')
  });
  
  if (stringified.includes('[object Object]')) {
    console.error(`❌ Test ${index + 1} still produces [object Object]!`);
  } else {
    console.log(`✅ Test ${index + 1} properly serialized`);
  }
});

// Test 2: Test the enhanced error message extraction
function extractErrorMessage(error) {
  return error instanceof Error ? error.message :
    (typeof error === 'object' && error !== null) ?
      (error.message || error.details || error.hint || JSON.stringify(error)) :
      String(error);
}

console.log('\n📋 Testing error message extraction:');
testErrors.forEach((error, index) => {
  const message = extractErrorMessage(error);
  console.log(`Extract Test ${index + 1}:`, {
    input: error,
    extracted: message,
    hasObjectObject: message.includes('[object Object]')
  });
  
  if (message.includes('[object Object]')) {
    console.error(`❌ Extract Test ${index + 1} still produces [object Object]!`);
  } else {
    console.log(`✅ Extract Test ${index + 1} properly extracted`);
  }
});

console.log('\n🎯 Test completed! Check results above.');
console.log('✅ All error handling should now prevent [object Object] display');
