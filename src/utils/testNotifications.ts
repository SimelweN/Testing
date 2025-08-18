import { supabase } from "@/integrations/supabase/client";
import { addNotification } from "@/services/notificationService";

export const testNotificationSystem = async () => {
  console.log("🧪 Testing notification system...");

  try {
    // Get current user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      console.error("❌ No authenticated user:", authError);
      return false;
    }

    const userId = session.user.id;
    console.log("👤 Testing for user:", userId);

    // Test 1: Check notifications table access
    console.log("1️⃣ Testing table access...");
    const { data: existing, error: selectError } = await supabase
      .from("notifications")
      .select("id, title, message, read")
      .eq("user_id", userId)
      .limit(5);

    if (selectError) {
      console.error("❌ Cannot read notifications:", selectError);
      return false;
    }

    console.log(`✅ Can read notifications table (${existing?.length || 0} existing)`);

    // Test 2: Try creating a notification directly
    console.log("2️⃣ Testing direct insert...");
    const testNotification = {
      user_id: userId,
      type: "test",
      title: "Test Notification",
      message: "This is a test notification created by the debug system",
      read: false,
      created_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabase
      .from("notifications")
      .insert(testNotification)
      .select()
      .single();

    if (insertError) {
      console.error("❌ Cannot insert notification:", insertError);
      console.log("🔍 Testing service role insertion...");
      
      // Test 3: Try using the notification service
      const serviceResult = await addNotification({
        userId,
        type: "test",
        title: "Service Test",
        message: "Testing notification service"
      });

      if (!serviceResult) {
        console.error("❌ Notification service also failed");
        return false;
      }
      
      console.log("✅ Notification service worked");
      return true;
    }

    console.log("✅ Direct insert worked:", insertData);

    // Test 4: Check real-time subscription
    console.log("3️⃣ Testing real-time subscription...");
    
    let subscriptionWorked = false;
    const timeout = new Promise((resolve) => setTimeout(resolve, 3000));
    
    const subscription = supabase
      .channel('test_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log("✅ Real-time subscription received:", payload);
          subscriptionWorked = true;
        }
      )
      .subscribe((status) => {
        console.log("📡 Subscription status:", status);
      });

    // Insert another notification to test real-time
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for subscription
    
    const { error: realtimeTestError } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type: "realtime_test",
        title: "Real-time Test",
        message: "Testing real-time notifications",
        read: false
      });

    if (realtimeTestError) {
      console.error("❌ Real-time test insert failed:", realtimeTestError);
    }

    await timeout;
    subscription.unsubscribe();

    if (subscriptionWorked) {
      console.log("✅ Real-time notifications working!");
    } else {
      console.log("⚠️ Real-time notifications may not be working");
    }

    return true;

  } catch (error) {
    console.error("❌ Notification test failed:", error);
    return false;
  }
};

// Add to window for easy testing
if (typeof window !== 'undefined') {
  (window as any).testNotifications = testNotificationSystem;
  console.log("🚀 Notification test available: window.testNotifications()");
}
