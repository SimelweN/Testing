import { supabase } from "../lib/supabase";

export interface EmailDiagnosticResult {
  success: boolean;
  message: string;
  details?: any;
  error?: string;
}

export interface EmailSystemStatus {
  configurationCheck: EmailDiagnosticResult;
  mailQueueCheck: EmailDiagnosticResult;
  sendEmailFunctionCheck: EmailDiagnosticResult;
  mailQueueProcessorCheck: EmailDiagnosticResult;
  environmentVariablesCheck: EmailDiagnosticResult;
  overallStatus: 'healthy' | 'degraded' | 'failed';
  recommendations: string[];
}

class EmailDiagnosticsService {
  
  async runFullDiagnostics(): Promise<EmailSystemStatus> {
    console.log('🔍 Starting comprehensive email system diagnostics...');
    
    const results: Partial<EmailSystemStatus> = {
      recommendations: []
    };

    // 1. Check environment variables and configuration
    results.environmentVariablesCheck = await this.checkEnvironmentVariables();
    
    // 2. Check mail_queue table existence and structure
    results.mailQueueCheck = await this.checkMailQueueTable();
    
    // 3. Test send-email edge function
    results.sendEmailFunctionCheck = await this.testSendEmailFunction();
    
    // 4. Test mail queue processor
    results.mailQueueProcessorCheck = await this.testMailQueueProcessor();
    
    // 5. Check configuration
    results.configurationCheck = await this.checkEmailConfiguration();

    // Determine overall status
    const checks = [
      results.environmentVariablesCheck,
      results.mailQueueCheck,
      results.sendEmailFunctionCheck,
      results.mailQueueProcessorCheck,
      results.configurationCheck
    ];

    const failedChecks = checks.filter(check => !check?.success);
    const degradedChecks = checks.filter(check => check?.success && check?.message.includes('warning'));

    if (failedChecks.length === 0) {
      results.overallStatus = degradedChecks.length > 0 ? 'degraded' : 'healthy';
    } else {
      results.overallStatus = 'failed';
    }

    // Generate recommendations
    this.generateRecommendations(results as EmailSystemStatus);

    return results as EmailSystemStatus;
  }

  private async checkEnvironmentVariables(): Promise<EmailDiagnosticResult> {
    try {
      console.log('🔑 Checking environment variables...');
      
      // Test the send-email function to check if environment variables are configured
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
        },
        body: JSON.stringify({ test: true })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          message: 'Environment variables are properly configured',
          details: result.config
        };
      } else if (result.error === 'EMAIL_CONFIGURATION_ERROR') {
        return {
          success: false,
          message: 'Email configuration error detected',
          error: result.details?.config_error || 'Missing BREVO_SMTP_KEY',
          details: result.details
        };
      } else {
        return {
          success: false,
          message: 'Failed to check environment variables',
          error: result.error || 'Unknown error'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to test environment variables',
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  private async checkMailQueueTable(): Promise<EmailDiagnosticResult> {
    try {
      console.log('📋 Checking mail_queue table...');
      
      // Check if mail_queue table exists and get pending emails count
      const { data: pendingEmails, error } = await supabase
        .from('mail_queue')
        .select('id, status, created_at, retry_count, error_message')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        return {
          success: false,
          message: 'mail_queue table not accessible',
          error: error.message
        };
      }

      const pendingCount = pendingEmails?.filter(email => email.status === 'pending').length || 0;
      const failedCount = pendingEmails?.filter(email => email.status === 'failed').length || 0;
      
      return {
        success: true,
        message: `mail_queue table is accessible. ${pendingCount} pending, ${failedCount} failed emails`,
        details: {
          totalEmails: pendingEmails?.length || 0,
          pendingEmails: pendingCount,
          failedEmails: failedCount,
          recentEmails: pendingEmails?.slice(0, 3) || []
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

  private async testSendEmailFunction(): Promise<EmailDiagnosticResult> {
    try {
      console.log('📧 Testing send-email function...');
      
      const testResponse = await fetch(`${supabase.supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
        },
        body: JSON.stringify({ test: true })
      });

      const result = await testResponse.json();

      if (testResponse.ok && result.success) {
        return {
          success: true,
          message: 'send-email function is working correctly',
          details: result
        };
      } else {
        return {
          success: false,
          message: 'send-email function test failed',
          error: result.error || `HTTP ${testResponse.status}`,
          details: result
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to reach send-email function',
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  private async testMailQueueProcessor(): Promise<EmailDiagnosticResult> {
    try {
      console.log('⚙️ Testing mail queue processor...');
      
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/process-mail-queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
        },
        body: JSON.stringify({})
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          message: `Mail queue processor is working. Processed: ${result.processed || 0}, Successful: ${result.successful || 0}, Failed: ${result.failed || 0}`,
          details: result
        };
      } else {
        return {
          success: false,
          message: 'Mail queue processor test failed',
          error: result.error || `HTTP ${response.status}`,
          details: result
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to reach mail queue processor',
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  private async checkEmailConfiguration(): Promise<EmailDiagnosticResult> {
    try {
      console.log('⚙️ Checking email service configuration...');
      
      // Check if email service methods are accessible
      const emailServiceModule = await import('../services/emailService');
      const { emailService } = emailServiceModule;

      if (!emailService) {
        return {
          success: false,
          message: 'Email service not properly initialized',
          error: 'emailService instance not found'
        };
      }

      return {
        success: true,
        message: 'Email service configuration looks good',
        details: {
          serviceAvailable: true,
          templatesSupported: true
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Email service configuration issue',
        error: error instanceof Error ? error.message : 'Import error'
      };
    }
  }

  private generateRecommendations(status: EmailSystemStatus): void {
    const recommendations: string[] = [];

    if (!status.environmentVariablesCheck.success) {
      recommendations.push('Set up BREVO_SMTP_KEY environment variable in Supabase dashboard');
      recommendations.push('Run: supabase secrets set BREVO_SMTP_KEY="your_brevo_api_key"');
    }

    if (!status.mailQueueCheck.success) {
      recommendations.push('Create mail_queue table in your database');
      recommendations.push('Run database migrations or create table manually');
    }

    if (!status.sendEmailFunctionCheck.success) {
      recommendations.push('Deploy send-email edge function');
      recommendations.push('Check Supabase function logs for errors');
    }

    if (!status.mailQueueProcessorCheck.success) {
      recommendations.push('Deploy process-mail-queue edge function');
      recommendations.push('Set up cron job to process mail queue every 5 minutes');
    }

    if (status.mailQueueCheck.success && status.mailQueueCheck.details?.pendingEmails > 0) {
      recommendations.push(`${status.mailQueueCheck.details.pendingEmails} emails are pending - check processing schedule`);
    }

    if (status.mailQueueCheck.success && status.mailQueueCheck.details?.failedEmails > 0) {
      recommendations.push(`${status.mailQueueCheck.details.failedEmails} emails have failed - check error messages`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Email system appears to be working correctly!');
      recommendations.push('Monitor logs regularly and test email flows periodically');
    }

    status.recommendations = recommendations;
  }

  async addTestEmailToQueue(userEmail: string): Promise<EmailDiagnosticResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: 'User not authenticated',
          error: 'Authentication required'
        };
      }

      const testEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>Email System Test</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Email System Test</h1>
          <p>This is a test email from ReBooked Solutions email system.</p>
          <p>Time: ${new Date().toISOString()}</p>
          <p>User: ${user.email}</p>
          <p>If you received this email, the email system is working correctly!</p>
        </body>
        </html>
      `;

      const { error } = await supabase
        .from('mail_queue')
        .insert({
          user_id: user.id,
          email: userEmail,
          subject: 'Email System Test - ReBooked Solutions',
          body: testEmailHtml,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (error) {
        return {
          success: false,
          message: 'Failed to add test email to queue',
          error: error.message
        };
      }

      return {
        success: true,
        message: 'Test email added to queue successfully',
        details: {
          recipient: userEmail,
          queuedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to add test email to queue',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getRecentEmailLogs(limit: number = 20): Promise<EmailDiagnosticResult> {
    try {
      const { data: emails, error } = await supabase
        .from('mail_queue')
        .select('id, user_id, email, subject, status, created_at, sent_at, error_message, retry_count')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return {
          success: false,
          message: 'Failed to fetch email logs',
          error: error.message
        };
      }

      return {
        success: true,
        message: `Retrieved ${emails?.length || 0} recent email logs`,
        details: {
          emails: emails || [],
          summary: {
            total: emails?.length || 0,
            pending: emails?.filter(e => e.status === 'pending').length || 0,
            sent: emails?.filter(e => e.status === 'sent').length || 0,
            failed: emails?.filter(e => e.status === 'failed').length || 0
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get email logs',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const emailDiagnosticsService = new EmailDiagnosticsService();
