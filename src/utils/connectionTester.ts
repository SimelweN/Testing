import { supabase } from "@/integrations/supabase/client";

export interface ConnectionTestResult {
  isOnline: boolean;
  supabaseReachable: boolean;
  authWorking: boolean;
  databaseWorking: boolean;
  error?: string;
  latency?: number;
}

/**
 * Test network and Supabase connectivity
 */
export async function testConnection(): Promise<ConnectionTestResult> {
  const result: ConnectionTestResult = {
    isOnline: navigator.onLine,
    supabaseReachable: false,
    authWorking: false,
    databaseWorking: false,
  };

  console.log('🔍 Testing connection...');

  // Check basic network connectivity
  if (!result.isOnline) {
    result.error = 'No internet connection detected';
    return result;
  }

  try {
    const startTime = Date.now();
    
    // Test 1: Check if we can reach Supabase at all
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      result.supabaseReachable = true;
      result.authWorking = !sessionError;
      
      if (sessionError) {
        console.warn('⚠️ Auth session error:', sessionError);
      } else {
        console.log('✅ Auth session check passed');
      }
    } catch (authError) {
      console.error('❌ Auth test failed:', authError);
      result.error = `Auth service unreachable: ${authError}`;
      return result;
    }

    // Test 2: Try a simple database query
    try {
      const { data, error: dbError } = await supabase
        .from('notifications')
        .select('id')
        .limit(1);
      
      if (dbError) {
        console.warn('⚠️ Database query error:', dbError);
        result.error = `Database error: ${dbError.message}`;
      } else {
        result.databaseWorking = true;
        console.log('✅ Database query passed');
      }
    } catch (dbError) {
      console.error('❌ Database test failed:', dbError);
      result.error = `Database unreachable: ${dbError}`;
      return result;
    }

    result.latency = Date.now() - startTime;
    console.log(`✅ Connection test completed in ${result.latency}ms`);

  } catch (error) {
    console.error('💥 Connection test failed:', error);
    result.error = `Connection test failed: ${error}`;
  }

  return result;
}

/**
 * Quick connectivity check for critical operations
 */
export async function quickConnectivityCheck(): Promise<boolean> {
  if (!navigator.onLine) {
    return false;
  }

  try {
    // Quick auth check with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );
    
    const authPromise = supabase.auth.getSession();
    
    await Promise.race([authPromise, timeoutPromise]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get user-friendly error message for common connection issues
 */
export function getConnectionErrorMessage(error: any): string {
  if (!navigator.onLine) {
    return 'No internet connection. Please check your network settings.';
  }

  if (error?.message?.includes('Failed to fetch')) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('network')) {
    return 'Network error. Please try again in a moment.';
  }

  if (error?.message?.includes('timeout')) {
    return 'Connection timeout. The server is taking too long to respond.';
  }

  if (error?.code === '401' || error?.message?.includes('unauthorized')) {
    return 'Authentication error. Please try logging in again.';
  }

  if (error?.code === '403' || error?.message?.includes('forbidden')) {
    return 'Permission denied. You may need to refresh your session.';
  }

  return 'Connection error. Please try again.';
}
