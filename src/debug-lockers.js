// Quick test script to verify locker data
import { lockerService } from './services/lockerService.ts';

async function testLockerData() {
  console.log('🧪 Testing locker data loading...');
  
  try {
    // Test debug method
    lockerService.debugLockerData();
    
    // Test fetching lockers
    const lockers = await lockerService.getLockers(true);
    console.log(`✅ Successfully loaded ${lockers.length} lockers`);
    
    // Test breakdown by province
    const provinceBreakdown = {};
    lockers.forEach(locker => {
      provinceBreakdown[locker.province] = (provinceBreakdown[locker.province] || 0) + 1;
    });
    
    console.log('📊 Province breakdown:', provinceBreakdown);
    
    // Test filtering
    const gautengLockers = await lockerService.searchLockers({ province: 'Gauteng' });
    console.log(`🏢 Gauteng lockers: ${gautengLockers.length}`);
    
    const capeLockers = await lockerService.searchLockers({ province: 'Western Cape' });
    console.log(`🏖️ Western Cape lockers: ${capeLockers.length}`);
    
    // Test search
    const pickNPayLockers = await lockerService.searchLockers({ search_query: 'Pick n Pay' });
    console.log(`🛒 Pick n Pay lockers: ${pickNPayLockers.length}`);
    
    console.log('🎉 All locker data tests passed!');
    
  } catch (error) {
    console.error('❌ Locker data test failed:', error);
  }
}

// Run test if this file is executed directly
if (typeof window !== 'undefined') {
  window.testLockerData = testLockerData;
  console.log('💡 Run window.testLockerData() in browser console to test');
}

export { testLockerData };
