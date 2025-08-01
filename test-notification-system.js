/**
 * Test script for notification system debugging
 * Run this in the browser console on the notifications page
 */

async function testNotificationSystem() {
  console.log('🧪 Testing Notification System...');
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    console.error('❌ Auth Error:', authError);
    return;
  }
  
  if (!user) {
    console.error('❌ No user logged in');
    return;
  }
  
  console.log('✅ User ID:', user.id);
  
  // Test 1: Check table access
  console.log('\n1️⃣ Testing table access...');
  try {
    const { data: existingNotifications, error: selectError } = await supabase
      .from('notifications')
      .select('id, title')
      .eq('user_id', user.id)
      .limit(5);
      
    if (selectError) {
      console.error('❌ SELECT Error:', selectError);
    } else {
      console.log('✅ Can read notifications:', existingNotifications?.length || 0, 'found');
    }
  } catch (err) {
    console.error('❌ SELECT Exception:', err);
  }
  
  // Test 2: Try to insert notification
  console.log('\n2️⃣ Testing notification creation...');
  try {
    const { data: insertData, error: insertError } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'test',
        title: 'Direct Insert Test',
        message: `Test notification created at ${new Date().toISOString()}`,
        read: false
      })
      .select();
      
    if (insertError) {
      console.error('❌ INSERT Error Details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
    } else {
      console.log('✅ Notification created successfully:', insertData);
    }
  } catch (err) {
    console.error('❌ INSERT Exception:', err);
  }
  
  // Test 3: Check RLS policies
  console.log('\n3️⃣ Testing RLS policies...');
  try {
    // Try to insert for a different user (should fail)
    const { data: rlsData, error: rlsError } = await supabase
      .from('notifications')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Fake UUID
        type: 'test',
        title: 'RLS Test (Should Fail)',
        message: 'This should be blocked by RLS',
        read: false
      });
      
    if (rlsError) {
      console.log('✅ RLS is working - blocked unauthorized insert:', rlsError.message);
    } else {
      console.warn('⚠️ RLS might not be working - unauthorized insert succeeded');
    }
  } catch (err) {
    console.log('✅ RLS is working - threw exception for unauthorized insert');
  }
  
  // Test 4: Check session validity
  console.log('\n4️⃣ Testing session...');
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session Error:', sessionError);
    } else if (!session) {
      console.error('❌ No active session');
    } else {
      console.log('✅ Active session found');
      console.log('   User ID:', session.user.id);
      console.log('   Expires at:', new Date(session.expires_at * 1000));
    }
  } catch (err) {
    console.error('❌ Session Exception:', err);
  }
  
  console.log('\n✅ Notification system test completed!');
  console.log('Check the detailed logs above for any issues.');
}

// Auto-run if supabase is available
if (typeof supabase !== 'undefined') {
  testNotificationSystem();
} else {
  console.error('❌ Supabase client not found. Make sure you\'re on a page with Supabase loaded.');
}
