import { supabase } from '@/integrations/supabase/client';

export interface MailQueueSetupResult {
  success: boolean;
  message: string;
  details?: any;
  error?: string;
}

export class MailQueueSetup {
  
  async checkAndCreateMailQueueTable(): Promise<MailQueueSetupResult> {
    try {
      console.log('🔍 Checking mail_queue table...');
      
      // Test if table exists by trying to select from it
      const { data: testData, error: testError } = await supabase
        .from('mail_queue')
        .select('id')
        .limit(1);

      if (testError) {
        if (testError.message.includes('relation "public.mail_queue" does not exist')) {
          console.log('❌ mail_queue table does not exist, creating it...');
          return await this.createMailQueueTable();
        } else {
          return {
            success: false,
            message: 'Error accessing mail_queue table',
            error: testError.message
          };
        }
      }

      console.log('✅ mail_queue table exists and is accessible');
      return {
        success: true,
        message: 'mail_queue table exists and is working',
        details: { 
          tableExists: true,
          testRowsFound: testData?.length || 0
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Failed to check mail_queue table',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async createMailQueueTable(): Promise<MailQueueSetupResult> {
    try {
      console.log('📋 Creating mail_queue table...');
      
      // Use the RPC function to create the table
      const { data, error } = await supabase.rpc('create_mail_queue_table');

      if (error) {
        return {
          success: false,
          message: 'Failed to create mail_queue table via RPC',
          error: error.message
        };
      }

      if (data === true) {
        console.log('✅ mail_queue table created successfully');
        return {
          success: true,
          message: 'mail_queue table created successfully',
          details: { action: 'table_created' }
        };
      } else {
        return {
          success: false,
          message: 'RPC function returned false - table creation failed',
          details: { rpcResult: data }
        };
      }

    } catch (error) {
      return {
        success: false,
        message: 'Exception while creating mail_queue table',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async testMailQueueInsertion(): Promise<MailQueueSetupResult> {
    try {
      console.log('🧪 Testing mail_queue insertion...');

      // Get current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return {
          success: false,
          message: 'User not authenticated - cannot test mail queue insertion',
          error: userError?.message || 'No authenticated user found'
        };
      }

      const testEmail = {
        user_id: user.id, // Use actual authenticated user ID
        email: 'test@mailqueuesetup.com',
        subject: 'Test - Mail Queue Setup Verification',
        body: '<p>This is a test email to verify mail_queue insertion works.</p>',
        status: 'pending' as const,
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('mail_queue')
        .insert(testEmail);

      if (insertError) {
        return {
          success: false,
          message: 'Failed to insert test email',
          error: insertError.message
        };
      }

      // Clean up test email
      const { error: deleteError } = await supabase
        .from('mail_queue')
        .delete()
        .eq('email', 'test@mailqueuesetup.com')
        .eq('subject', 'Test - Mail Queue Setup Verification');

      if (deleteError) {
        console.warn('⚠️ Failed to clean up test email:', deleteError.message);
      }

      return {
        success: true,
        message: 'Successfully inserted and cleaned up test email',
        details: { insertionWorking: true, authenticatedUser: user.id }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Exception during mail_queue insertion test',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async testMailQueueBypassRLS(): Promise<MailQueueSetupResult> {
    try {
      console.log('🧪 Testing mail_queue with RLS bypass (admin test)...');

      // Create a test function that bypasses RLS
      const testFunction = `
        CREATE OR REPLACE FUNCTION test_mail_queue_insert()
        RETURNS TEXT
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          test_id UUID;
        BEGIN
          -- Insert test record
          INSERT INTO mail_queue (
            user_id,
            email,
            subject,
            body,
            status,
            created_at
          ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            'rls-bypass-test@mailqueuesetup.com',
            'RLS Bypass Test - Mail Queue Verification',
            '<p>This is an RLS bypass test email.</p>',
            'pending',
            NOW()
          ) RETURNING id INTO test_id;

          -- Clean up immediately
          DELETE FROM mail_queue WHERE id = test_id;

          RETURN 'SUCCESS: Mail queue insertion works (RLS bypassed)';
        EXCEPTION
          WHEN OTHERS THEN
            RETURN 'ERROR: ' || SQLERRM;
        END;
        $$;
      `;

      // Execute the test function creation
      const { error: createError } = await supabase.rpc('exec_sql', { sql: testFunction });

      if (createError) {
        return {
          success: false,
          message: 'Failed to create RLS bypass test function',
          error: createError.message
        };
      }

      // Run the test
      const { data: testResult, error: testError } = await supabase.rpc('test_mail_queue_insert');

      if (testError) {
        return {
          success: false,
          message: 'RLS bypass test failed to execute',
          error: testError.message
        };
      }

      const success = testResult?.includes('SUCCESS');

      return {
        success,
        message: success
          ? 'RLS bypass test passed - table structure is correct'
          : 'RLS bypass test failed - check table structure',
        details: {
          testResult,
          rlsBypassWorking: success
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Exception during RLS bypass test',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async diagnoseProblem(): Promise<MailQueueSetupResult> {
    try {
      console.log('🔍 Diagnosing email queue problem...');
      
      const results = {
        tableCheck: await this.checkAndCreateMailQueueTable(),
        insertionCheck: { success: false, message: 'Skipped' } as MailQueueSetupResult,
        rlsBypassCheck: { success: false, message: 'Skipped' } as MailQueueSetupResult,
        recentOrders: 0,
        recentEmails: 0
      };

      // Only test insertion if table exists
      if (results.tableCheck.success) {
        results.insertionCheck = await this.testMailQueueInsertion();

        // If regular insertion fails, try RLS bypass test
        if (!results.insertionCheck.success) {
          results.rlsBypassCheck = await this.testMailQueueBypassRLS();
        }
      }

      // Count recent orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!ordersError && orders) {
        results.recentOrders = orders.length;
      }

      // Count recent emails (if table exists)
      if (results.tableCheck.success) {
        const recentDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: emails, error: emailsError } = await supabase
          .from('mail_queue')
          .select('id, subject, created_at')
          .gte('created_at', recentDate);

        if (!emailsError && emails) {
          results.recentEmails = emails.length;
        }
      }

      const problemIdentified = results.recentOrders > 0 && results.recentEmails === 0;
      
      const overallSuccess = results.tableCheck.success &&
                           (results.insertionCheck.success || results.rlsBypassCheck.success);

      return {
        success: overallSuccess,
        message: problemIdentified
          ? `Problem confirmed: ${results.recentOrders} recent orders but ${results.recentEmails} emails queued`
          : overallSuccess
            ? 'Mail queue system appears to be working'
            : 'Mail queue table needs to be created or has RLS issues',
        details: {
          ...results,
          problemIdentified,
          recommendations: problemIdentified ? [
            'RLS policies may be blocking email insertion from edge functions',
            'Run the improved RLS policy SQL script',
            'Check create-order function error logs',
            'Verify mail_queue insert operations in create-order function'
          ] : !results.insertionCheck.success && results.rlsBypassCheck.success ? [
            'Table works but RLS policies are too restrictive',
            'Update RLS policies to allow service role access',
            'Run the improved RLS policy SQL script'
          ] : overallSuccess ? [
            'Mail queue system is properly set up'
          ] : [
            'Create mail_queue table using SQL script',
            'Set up proper RLS policies'
          ]
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Failed to diagnose email queue problem',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const mailQueueSetup = new MailQueueSetup();
