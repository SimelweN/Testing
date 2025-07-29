import { supabase } from "../lib/supabase";

export interface EmailRepairResult {
  success: boolean;
  message: string;
  details?: any;
  error?: string;
}

export class EmailSystemRepair {
  
  async repairEmailSystem(): Promise<EmailRepairResult[]> {
    console.log('🔧 Starting email system repair...');
    
    const results: EmailRepairResult[] = [];

    // 1. Create mail_queue table if it doesn't exist
    results.push(await this.createMailQueueTable());
    
    // 2. Fix any corrupted data in mail_queue
    results.push(await this.cleanupMailQueue());
    
    // 3. Test email functions
    results.push(await this.testEmailFunctions());
    
    // 4. Process any stuck emails
    results.push(await this.processStuckEmails());

    return results;
  }

  private async createMailQueueTable(): Promise<EmailRepairResult> {
    try {
      console.log('📋 Checking mail_queue table structure...');
      
      // Try to check if the table exists by querying it
      const { error: checkError } = await supabase
        .from('mail_queue')
        .select('id')
        .limit(1);

      if (checkError && checkError.code === 'PGRST116') {
        // Table doesn't exist, create it
        console.log('📋 Creating mail_queue table...');
        
        const { error: createError } = await supabase.rpc('create_mail_queue_table');
        
        if (createError) {
          return {
            success: false,
            message: 'Failed to create mail_queue table',
            error: createError.message
          };
        }

        return {
          success: true,
          message: 'mail_queue table created successfully',
          details: { action: 'created_table' }
        };
      } else if (checkError) {
        return {
          success: false,
          message: 'Error checking mail_queue table',
          error: checkError.message
        };
      } else {
        return {
          success: true,
          message: 'mail_queue table already exists',
          details: { action: 'table_exists' }
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to check/create mail_queue table',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async cleanupMailQueue(): Promise<EmailRepairResult> {
    try {
      console.log('🧹 Cleaning up mail_queue...');
      
      // Reset failed emails that have been retrying for too long
      const { error: resetError } = await supabase
        .from('mail_queue')
        .update({ 
          status: 'pending',
          retry_count: 0,
          error_message: null
        })
        .eq('status', 'failed')
        .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Older than 24 hours

      if (resetError) {
        console.warn('Warning: Could not reset failed emails:', resetError.message);
      }

      // Get count of pending emails
      const { count: pendingCount } = await supabase
        .from('mail_queue')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');

      return {
        success: true,
        message: `Mail queue cleanup completed. ${pendingCount || 0} pending emails`,
        details: {
          pendingEmails: pendingCount || 0,
          cleanupPerformed: !resetError
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to cleanup mail queue',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testEmailFunctions(): Promise<EmailRepairResult> {
    try {
      console.log('🧪 Testing email functions...');
      
      // Test send-email function
      const testResponse = await fetch(`${supabase.supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
        },
        body: JSON.stringify({ test: true })
      });

      const testResult = await testResponse.json();

      if (!testResponse.ok) {
        return {
          success: false,
          message: 'Email function test failed',
          error: testResult.error || `HTTP ${testResponse.status}`,
          details: testResult
        };
      }

      return {
        success: true,
        message: 'Email functions are working correctly',
        details: testResult
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to test email functions',
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  private async processStuckEmails(): Promise<EmailRepairResult> {
    try {
      console.log('📨 Processing stuck emails...');
      
      // Trigger mail queue processor
      const processorResponse = await fetch(`${supabase.supabaseUrl}/functions/v1/process-mail-queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
        },
        body: JSON.stringify({})
      });

      const processorResult = await processorResponse.json();

      if (!processorResponse.ok) {
        return {
          success: false,
          message: 'Failed to process stuck emails',
          error: processorResult.error || `HTTP ${processorResponse.status}`,
          details: processorResult
        };
      }

      return {
        success: true,
        message: `Processed ${processorResult.processed || 0} emails. ${processorResult.successful || 0} sent, ${processorResult.failed || 0} failed`,
        details: processorResult
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to process stuck emails',
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  async createTestEmail(userEmail: string, testType: 'receipt' | 'commit' | 'notification'): Promise<EmailRepairResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: 'User not authenticated',
          error: 'Authentication required'
        };
      }

      let subject: string;
      let html: string;

      switch (testType) {
        case 'receipt':
          subject = 'Test Purchase Receipt - ReBooked Solutions';
          html = this.generateTestReceiptHTML();
          break;
        case 'commit':
          subject = 'Test Commit Notification - ReBooked Solutions';
          html = this.generateTestCommitHTML();
          break;
        case 'notification':
          subject = 'Test System Notification - ReBooked Solutions';
          html = this.generateTestNotificationHTML();
          break;
        default:
          return {
            success: false,
            message: 'Invalid test type',
            error: 'Test type must be receipt, commit, or notification'
          };
      }

      const { error } = await supabase
        .from('mail_queue')
        .insert({
          user_id: user.id,
          email: userEmail,
          subject,
          body: html,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (error) {
        return {
          success: false,
          message: 'Failed to create test email',
          error: error.message
        };
      }

      return {
        success: true,
        message: `Test ${testType} email created successfully`,
        details: {
          testType,
          recipient: userEmail,
          subject
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create test email',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private generateTestReceiptHTML(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Test Receipt</title></head>
      <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
          <h1 style="color: #3ab26f;">📧 Email Receipt Test</h1>
          <p>This is a test receipt email to verify the email system is working correctly.</p>
          
          <div style="background: #f3fef7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Test Order Details</h3>
            <p><strong>Order ID:</strong> TEST-${Date.now()}</p>
            <p><strong>Book:</strong> Test Textbook</p>
            <p><strong>Amount:</strong> R299.99</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <p>If you receive this email, your email system for receipts is working correctly!</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666;">
            <p><strong>ReBooked Solutions</strong><br>
            Test Email System<br>
            Time: ${new Date().toISOString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateTestCommitHTML(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Test Commit Notification</title></head>
      <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
          <h1 style="color: #e17055;">���� Test Commit Notification</h1>
          <p>This is a test commit notification email to verify the email system is working correctly.</p>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>⏰ Action Required (Test)</h3>
            <p>You have <strong>48 hours</strong> to commit to this test order.</p>
            <p><strong>Buyer:</strong> Test Customer</p>
            <p><strong>Book:</strong> Sample Textbook</p>
            <p><strong>Amount:</strong> R199.99</p>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="#" style="background: #e17055; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Commit to Order (Test)
            </a>
          </div>
          
          <p>If you receive this email, your email system for commit notifications is working correctly!</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666;">
            <p><strong>ReBooked Solutions</strong><br>
            Test Email System<br>
            Time: ${new Date().toISOString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateTestNotificationHTML(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Test System Notification</title></head>
      <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
          <h1 style="color: #667eea;">🔔 Test System Notification</h1>
          <p>This is a test in-app notification email to verify the email system is working correctly.</p>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>📱 Notification Details</h3>
            <p><strong>Type:</strong> System Test</p>
            <p><strong>Priority:</strong> Low</p>
            <p><strong>Status:</strong> Active</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p>This notification would typically appear in your app's notification center.</p>
          
          <p>If you receive this email, your email system for notifications is working correctly!</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666;">
            <p><strong>ReBooked Solutions</strong><br>
            Test Email System<br>
            Time: ${new Date().toISOString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async getEmailSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check if mail queue is accessible
      const { error: queueError } = await supabase
        .from('mail_queue')
        .select('id')
        .limit(1);

      if (queueError) {
        issues.push('Mail queue table is not accessible');
        recommendations.push('Create mail_queue table using database migrations');
      }

      // Check for stuck emails
      const { data: stuckEmails } = await supabase
        .from('mail_queue')
        .select('id')
        .eq('status', 'pending')
        .lt('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Older than 1 hour

      if (stuckEmails && stuckEmails.length > 0) {
        issues.push(`${stuckEmails.length} emails stuck in queue for over 1 hour`);
        recommendations.push('Process mail queue manually or check cron job scheduling');
      }

      // Check for failed emails
      const { data: failedEmails } = await supabase
        .from('mail_queue')
        .select('id')
        .eq('status', 'failed');

      if (failedEmails && failedEmails.length > 10) {
        issues.push(`${failedEmails.length} failed emails in queue`);
        recommendations.push('Check email configuration and BREVO_SMTP_KEY');
      }

      // Determine overall status
      let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
      
      if (issues.length > 0) {
        if (issues.some(issue => issue.includes('not accessible') || issue.includes('failed'))) {
          status = 'critical';
        } else {
          status = 'degraded';
        }
      }

      return { status, issues, recommendations };
    } catch (error) {
      return {
        status: 'critical',
        issues: ['Unable to check email system health'],
        recommendations: ['Check database connection and authentication']
      };
    }
  }
}

export const emailSystemRepair = new EmailSystemRepair();
