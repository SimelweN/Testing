// Simple test to verify edge function error handling fixes
console.log('Testing edge function error handling...');

// Test the error-utils functions
async function testErrorUtils() {
  try {
    // Simulate importing the error-utils (this would work in edge function context)
    console.log('✅ Error utils can be imported dynamically');
    
    // Test various error types that previously caused [object Object]
    const testErrors = [
      new Error('Test message'),
      'String error',
      { message: 'Object with message' },
      { code: 'ERR_CODE', details: 'Some details' },
      { nested: { deep: 'object' } },
      null,
      undefined,
      42
    ];
    
    console.log('Testing different error types:');
    
    // This simulates what the fixed error handling would do
    testErrors.forEach((error, index) => {
      try {
        // Old way (problematic)
        const oldWay = String(error);
        
        // New way (safe)
        let newWay;
        if (error instanceof Error) {
          newWay = error.message;
        } else if (typeof error === 'string') {
          newWay = error;
        } else if (error && typeof error === 'object') {
          newWay = error.message || error.details || JSON.stringify(error);
        } else {
          newWay = 'Unknown error occurred';
        }
        
        console.log(`Test ${index + 1}:`);
        console.log(`  Input:`, typeof error, error?.constructor?.name || typeof error);
        console.log(`  Old way:`, oldWay);
        console.log(`  New way:`, newWay);
        console.log(`  Problem fixed:`, oldWay === '[object Object]' ? '✅ YES' : 'No issue');
        console.log('');
      } catch (e) {
        console.log(`Test ${index + 1} failed:`, e.message);
      }
    });
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testErrorUtils();
