import { supabase } from "../lib/supabase";

export interface EmailTriggerTest {
  name: string;
  success: boolean;
  message: string;
  details?: any;
  fix?: string[];
}

export class EmailTriggerFix {
  
  async diagnoseAllEmailTriggers(): Promise<EmailTriggerTest[]> {
    console.log('🔍 Diagnosing all email triggers in the system...');
    
    const tests: EmailTriggerTest[] = [];

    // 1. Test mail_queue table access
    tests.push(await this.testMailQueueAccess());
    
    // 2. Test send-email function
    tests.push(await this.testSendEmailFunction());
    
    // 3. Test mail queue processor
    tests.push(await this.testMailQueueProcessor());
    
    // 4. Test order creation email triggers
    tests.push(await this.testOrderCreationEmailTriggers());

    // 5. Test direct email queue insertion
    tests.push(await this.testEmailQueueInsertion());

    // 6. Test commit email triggers
    tests.push(await this.testCommitEmailTriggers());
    
    // 6. Check for stuck emails
    tests.push(await this.checkStuckEmails());

    return tests;
  }

  private async testMailQueueAccess(): Promise<EmailTriggerTest> {
    try {
      console.log('📋 Testing mail_queue table access...');
      
      const { data, error } = await supabase
        .from('mail_queue')
        .select('id, status, created_at')
        .limit(5);

      if (error) {
        return {
          name: 'Mail Queue Access',
          success: false,
          message: 'Cannot access mail_queue table',
          details: { error: error.message },
          fix: [
            'Create mail_queue table in Supabase Dashboard > SQL Editor',
            'Run the CREATE TABLE script from EMAIL_SYSTEM_FIX_SUMMARY.md',
            'Verify table permissions are set correctly'
          ]
        };
      }

      const pendingCount = data?.filter(email => email.status === 'pending').length || 0;
      
      return {
        name: 'Mail Queue Access',
        success: true,
        message: `Mail queue accessible with ${data?.length || 0} recent emails, ${pendingCount} pending`,
        details: {
          totalEmails: data?.length || 0,
          pendingEmails: pendingCount,
          recentEmails: data?.slice(0, 3) || []
        }
      };
    } catch (error) {
      return {
        name: 'Mail Queue Access',
        success: false,
        message: 'Failed to test mail_queue access',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        fix: ['Check database connection and table existence']
      };
    }
  }

  private async testSendEmailFunction(): Promise<EmailTriggerTest> {
    try {
      console.log('📧 Testing send-email function...');

      let response: Response;
      let result: any;

      try {
        response = await fetch(`${supabase.supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
          },
          body: JSON.stringify({ test: true })
        });
      } catch (fetchError) {
        return {
          name: 'Send Email Function',
          success: false,
          message: 'Edge function not accessible - likely not deployed',
          details: {
            error: fetchError instanceof Error ? fetchError.message : 'Network error',
            url: `${supabase.supabaseUrl}/functions/v1/send-email`
          },
          fix: [
            'Deploy send-email edge function: supabase functions deploy send-email',
            'Check if edge functions are enabled in Supabase project',
            'Verify project is not on paused/free tier without edge function access'
          ]
        };
      }

      try {
        result = await response.json();
      } catch (jsonError) {
        return {
          name: 'Send Email Function',
          success: false,
          message: 'Edge function returned invalid response',
          details: {
            status: response.status,
            statusText: response.statusText,
            error: 'Invalid JSON response'
          },
          fix: [
            'Check edge function logs in Supabase Dashboard',
            'Redeploy send-email function',
            'Verify function code is valid'
          ]
        };
      }

      if (!response.ok) {
        const missingBrevKey = result.error?.includes('BREVO_SMTP_KEY') || 
                              result.details?.missing_env_vars?.includes('BREVO_SMTP_KEY');
        
        return {
          name: 'Send Email Function',
          success: false,
          message: missingBrevKey ? 'BREVO_SMTP_KEY not configured' : 'Send email function failed',
          details: result,
          fix: missingBrevKey ? [
            'Set BREVO_SMTP_KEY in Supabase Dashboard > Settings > API > Secrets',
            'Get BREVO API key from Brevo dashboard > SMTP & API > SMTP',
            'Command: supabase secrets set BREVO_SMTP_KEY="your_key_here"'
          ] : [
            'Check send-email function deployment',
            'Verify function logs in Supabase Dashboard'
          ]
        };
      }

      return {
        name: 'Send Email Function',
        success: true,
        message: 'Send email function is working correctly',
        details: result
      };
    } catch (error) {
      return {
        name: 'Send Email Function',
        success: false,
        message: 'Cannot reach send-email function',
        details: { error: error instanceof Error ? error.message : 'Network error' },
        fix: [
          'Deploy send-email function: supabase functions deploy send-email',
          'Check if edge functions are deployed in Supabase Dashboard'
        ]
      };
    }
  }

  private async testMailQueueProcessor(): Promise<EmailTriggerTest> {
    try {
      console.log('⚙️ Testing mail queue processor...');

      let response: Response;
      let result: any;

      try {
        response = await fetch(`${supabase.supabaseUrl}/functions/v1/process-mail-queue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
          },
          body: JSON.stringify({})
        });
      } catch (fetchError) {
        return {
          name: 'Mail Queue Processor',
          success: false,
          message: 'Edge function not accessible - likely not deployed',
          details: {
            error: fetchError instanceof Error ? fetchError.message : 'Network error',
            url: `${supabase.supabaseUrl}/functions/v1/process-mail-queue`
          },
          fix: [
            'Deploy process-mail-queue edge function: supabase functions deploy process-mail-queue',
            'Check if edge functions are enabled in Supabase project',
            'Email queue will not process automatically without this function'
          ]
        };
      }

      try {
        result = await response.json();
      } catch (jsonError) {
        return {
          name: 'Mail Queue Processor',
          success: false,
          message: 'Edge function returned invalid response',
          details: {
            status: response.status,
            statusText: response.statusText,
            error: 'Invalid JSON response'
          },
          fix: [
            'Check edge function logs in Supabase Dashboard',
            'Redeploy process-mail-queue function',
            'Verify function code is valid'
          ]
        };
      }

      if (!response.ok) {
        return {
          name: 'Mail Queue Processor',
          success: false,
          message: 'Mail queue processor failed',
          details: result,
          fix: [
            'Deploy process-mail-queue function: supabase functions deploy process-mail-queue',
            'Check function logs for errors',
            'Verify BREVO_SMTP_KEY is configured'
          ]
        };
      }

      return {
        name: 'Mail Queue Processor',
        success: true,
        message: `Mail queue processor working. Processed: ${result.processed || 0}, Successful: ${result.successful || 0}`,
        details: result
      };
    } catch (error) {
      return {
        name: 'Mail Queue Processor',
        success: false,
        message: 'Cannot reach mail queue processor',
        details: { error: error instanceof Error ? error.message : 'Network error' },
        fix: [
          'Deploy process-mail-queue function',
          'Check edge function deployment status'
        ]
      };
    }
  }

  private async testOrderCreationEmailTriggers(): Promise<EmailTriggerTest> {
    try {
      console.log('📦 Testing order creation email triggers...');

      // Check if create-order function exists (simple OPTIONS request)
      try {
        const testResponse = await fetch(`${supabase.supabaseUrl}/functions/v1/create-order`, {
          method: 'OPTIONS',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
          }
        });

        if (testResponse.status === 404) {
          return {
            name: 'Order Creation Email Triggers',
            success: false,
            message: 'create-order function not deployed',
            fix: [
              'Deploy create-order function: supabase functions deploy create-order',
              'Verify all edge functions are deployed'
            ]
          };
        }
      } catch (error) {
        return {
          name: 'Order Creation Email Triggers',
          success: false,
          message: 'Cannot reach create-order function',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          fix: [
            'Check if create-order function is deployed',
            'Verify edge function URLs are accessible'
          ]
        };
      }

      // Check recent orders to see if emails were queued
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, created_at, buyer_id, status')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentOrders && recentOrders.length > 0) {
        // Check if any emails were queued for recent orders
        const recentOrderDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Last 24 hours

        let { data: emailsFromOrders, error: emailError } = await supabase
          .from('mail_queue')
          .select('id, subject, status, created_at')
          .gte('created_at', recentOrderDate)
          .or('subject.ilike.%Order Confirmed%,subject.ilike.%New Order%,subject.ilike.%Action Required%,subject.ilike.%order%,subject.ilike.%purchase%,subject.ilike.%Thank You%,subject.ilike.%Pickup Scheduled%,subject.ilike.%Commitment Confirmed%');

        // If we can't access mail_queue, that's the problem
        if (emailError) {
          return {
            name: 'Order Creation Email Triggers',
            success: false,
            message: 'Cannot access mail_queue table',
            details: {
              recentOrders: recentOrders.length,
              emailsQueued: 0,
              emailSamples: [],
              error: emailError.message
            },
            fix: [
              'Create mail_queue table using the provided SQL script',
              'Check if mail_queue table exists in Supabase Dashboard',
              'Verify RLS policies allow access to mail_queue'
            ]
          };
        }

        let success = emailsFromOrders && emailsFromOrders.length > 0;
        let problemIdentified = recentOrders.length > 0 && (!emailsFromOrders || emailsFromOrders.length === 0);

        // Additional check: look for emails that should correlate with specific recent orders
        let correlationDetails = {};
        if (recentOrders.length > 0) {
          // Check if we can find any emails for the buyer IDs of recent orders
          const recentBuyerIds = recentOrders.map(o => o.buyer_id).filter(Boolean);

          if (recentBuyerIds.length > 0) {
            const { data: buyerEmails } = await supabase
              .from('mail_queue')
              .select('id, user_id, subject, created_at')
              .in('user_id', recentBuyerIds)
              .gte('created_at', recentOrderDate);

            // Look specifically for create-order email subjects
            // Try multiple search approaches to be comprehensive
            const { data: specificOrderEmails1 } = await supabase
              .from('mail_queue')
              .select('id, subject, status, created_at')
              .gte('created_at', recentOrderDate)
              .or('subject.ilike.%Order Confirmed - Thank You%,subject.ilike.%New Order - Action Required%,subject.ilike.%🎉 Order Confirmed%,subject.ilike.%📚 New Order%');

            // Also try exact matches for known patterns
            const { data: specificOrderEmails2 } = await supabase
              .from('mail_queue')
              .select('id, subject, status, created_at')
              .gte('created_at', recentOrderDate)
              .in('subject', [
                '🎉 Order Confirmed - Thank You!',
                '📚 New Order - Action Required (48 hours)',
                'Order Confirmed - Pickup Scheduled',
                'Order Commitment Confirmed - Prepare for Pickup'
              ]);

            // Combine results
            const specificOrderEmails = [
              ...(specificOrderEmails1 || []),
              ...(specificOrderEmails2 || [])
            ].filter((email, index, self) =>
              index === self.findIndex(e => e.id === email.id)
            ); // Remove duplicates

            // Get actual email subjects for debugging
            const { data: actualEmailSubjects } = await supabase
              .from('mail_queue')
              .select('subject, created_at, status')
              .gte('created_at', recentOrderDate)
              .order('created_at', { ascending: false })
              .limit(10);

            correlationDetails = {
              recentBuyerIds: recentBuyerIds.length,
              emailsForRecentBuyers: buyerEmails?.length || 0,
              specificOrderEmails: specificOrderEmails?.length || 0,
              specificEmailSamples: specificOrderEmails?.slice(0, 3) || [],
              actualEmailSubjects: actualEmailSubjects?.map(e => e.subject) || [],
              actualEmailSamples: actualEmailSubjects?.slice(0, 5) || [],
              correlation: buyerEmails?.length ? 'Some emails found for recent buyers' : 'No emails found for recent order buyers'
            };

            // If we found emails for buyers but not in the original search, update the result
            if (specificOrderEmails && specificOrderEmails.length > 0) {
              emailsFromOrders = specificOrderEmails;
              success = true;
            }
          }
        }

        return {
          name: 'Order Creation Email Triggers',
          success,
          message: success
            ? `Found ${emailsFromOrders.length} order-related emails in queue`
            : 'No order-related emails found in recent queue',
          details: {
            recentOrders: recentOrders.length,
            emailsQueued: emailsFromOrders?.length || 0,
            emailSamples: emailsFromOrders?.slice(0, 3) || [],
            problemIdentified,
            ...correlationDetails
          },
          fix: problemIdentified ?
            correlationDetails.emailsForRecentBuyers > 0 ? [
              'Emails are being queued for recent buyers, but subject search may need refinement',
              'Check if email subjects match expected patterns',
              'Order creation emails may be using different subject lines than expected',
              'Review actual email subjects in mail_queue table'
            ] : [
              'CRITICAL: Orders are being created but emails are NOT being queued',
              'This indicates the create-order function is failing to insert into mail_queue',
              'Run the improved mail_queue RLS policy SQL script immediately',
              'Check create-order function logs for RLS policy violations',
              'Verify mail_queue table exists with proper permissions'
            ] : []
        };
      }

      return {
        name: 'Order Creation Email Triggers',
        success: true,
        message: 'No recent orders to test, but function appears accessible',
        details: { recentOrders: 0 }
      };

    } catch (error) {
      return {
        name: 'Order Creation Email Triggers',
        success: false,
        message: 'Failed to test order creation triggers',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        fix: ['Check create-order function deployment and database access']
      };
    }
  }

  private async testCommitEmailTriggers(): Promise<EmailTriggerTest> {
    try {
      console.log('✅ Testing commit email triggers...');
      
      // Test commit functions exist
      const commitResponse = await fetch(`${supabase.supabaseUrl}/functions/v1/commit-to-sale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
        },
        body: JSON.stringify({ test: true })
      });

      if (commitResponse.status === 404) {
        return {
          name: 'Commit Email Triggers',
          success: false,
          message: 'commit-to-sale function not deployed',
          fix: [
            'Deploy commit-to-sale function: supabase functions deploy commit-to-sale',
            'Deploy decline-commit function: supabase functions deploy decline-commit'
          ]
        };
      }

      // Check for commit-related emails in queue
      const recentDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: commitEmails } = await supabase
        .from('mail_queue')
        .select('id, subject, status, created_at')
        .gte('created_at', recentDate)
        .or('subject.ilike.%commit%,subject.ilike.%confirmed%,subject.ilike.%decline%');

      return {
        name: 'Commit Email Triggers',
        success: true,
        message: commitEmails && commitEmails.length > 0 
          ? `Found ${commitEmails.length} commit-related emails in queue`
          : 'No recent commit emails found, but functions appear accessible',
        details: {
          commitEmailsQueued: commitEmails?.length || 0,
          emailSamples: commitEmails?.slice(0, 3) || []
        }
      };

    } catch (error) {
      return {
        name: 'Commit Email Triggers',
        success: false,
        message: 'Failed to test commit triggers',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        fix: ['Check commit function deployment and database access']
      };
    }
  }

  private async checkStuckEmails(): Promise<EmailTriggerTest> {
    try {
      console.log('🕐 Checking for stuck emails...');
      
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data: stuckEmails } = await supabase
        .from('mail_queue')
        .select('id, subject, status, created_at, retry_count')
        .eq('status', 'pending')
        .lt('created_at', oneHourAgo);

      if (stuckEmails && stuckEmails.length > 0) {
        return {
          name: 'Stuck Emails Check',
          success: false,
          message: `${stuckEmails.length} emails stuck in queue for over 1 hour`,
          details: {
            stuckCount: stuckEmails.length,
            oldestEmail: stuckEmails[0],
            samples: stuckEmails.slice(0, 3)
          },
          fix: [
            'Run mail queue processor manually',
            'Set up cron job for automatic processing',
            'Check BREVO_SMTP_KEY configuration',
            'Verify mail-queue-cron function is deployed and scheduled'
          ]
        };
      }

      return {
        name: 'Stuck Emails Check',
        success: true,
        message: 'No emails stuck in queue',
        details: { stuckCount: 0 }
      };

    } catch (error) {
      return {
        name: 'Stuck Emails Check',
        success: false,
        message: 'Failed to check for stuck emails',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  async forceProcessAllPendingEmails(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('🔄 Force processing all pending emails...');

      let response: Response;
      let result: any;

      try {
        response = await fetch(`${supabase.supabaseUrl}/functions/v1/process-mail-queue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
          },
          body: JSON.stringify({})
        });
      } catch (fetchError) {
        return {
          success: false,
          message: 'Cannot reach mail queue processor - edge function not deployed',
          details: {
            error: fetchError instanceof Error ? fetchError.message : 'Network error',
            suggestion: 'Deploy the process-mail-queue edge function first'
          }
        };
      }

      try {
        result = await response.json();
      } catch (jsonError) {
        return {
          success: false,
          message: 'Mail queue processor returned invalid response',
          details: {
            status: response.status,
            statusText: response.statusText,
            error: 'Invalid JSON response'
          }
        };
      }

      if (!response.ok) {
        return {
          success: false,
          message: 'Failed to process pending emails',
          details: result
        };
      }

      return {
        success: true,
        message: `Processed ${result.processed || 0} emails. ${result.successful || 0} sent, ${result.failed || 0} failed`,
        details: result
      };

    } catch (error) {
      return {
        success: false,
        message: 'Error processing pending emails',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  async createTestOrderEmail(userEmail: string): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: 'User not authenticated'
        };
      }

      const testOrderHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>Test Order Confirmation</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f3fef7;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
            <h1 style="color: #3ab26f;">🎉 Test Order Confirmed!</h1>
            <p>This is a test order confirmation email to verify your email system is working.</p>
            
            <div style="background: #f3fef7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Test Order Details</h3>
              <p><strong>Order ID:</strong> TEST-ORDER-${Date.now()}</p>
              <p><strong>Book:</strong> Sample Textbook</p>
              <p><strong>Amount:</strong> R299.99</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <p>✅ If you receive this email, your order confirmation emails are working correctly!</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666;">
              <p><strong>ReBooked Solutions</strong><br>
              Test Email System<br>
              Time: ${new Date().toISOString()}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const { error } = await supabase
        .from('mail_queue')
        .insert({
          user_id: user.id,
          email: userEmail,
          subject: 'Test Order Confirmation - ReBooked Solutions',
          body: testOrderHtml,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (error) {
        return {
          success: false,
          message: 'Failed to create test order email',
          details: { error: error.message }
        };
      }

      return {
        success: true,
        message: 'Test order email created and queued successfully',
        details: {
          recipient: userEmail,
          emailType: 'order_confirmation'
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Error creating test order email',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  async createTestCommitEmail(userEmail: string): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: 'User not authenticated'
        };
      }

      const testCommitHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>Test Commit Notification</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f3fef7;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
            <h1 style="color: #e17055;">📚 Test Commit Notification</h1>
            <p>This is a test seller commit notification email.</p>
            
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
            
            <p>✅ If you receive this email, your commit notification emails are working correctly!</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666;">
              <p><strong>ReBooked Solutions</strong><br>
              Test Email System<br>
              Time: ${new Date().toISOString()}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const { error } = await supabase
        .from('mail_queue')
        .insert({
          user_id: user.id,
          email: userEmail,
          subject: 'Test Commit Notification - Action Required - ReBooked Solutions',
          body: testCommitHtml,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (error) {
        return {
          success: false,
          message: 'Failed to create test commit email',
          details: { error: error.message }
        };
      }

      return {
        success: true,
        message: 'Test commit email created and queued successfully',
        details: {
          recipient: userEmail,
          emailType: 'seller_commit_notification'
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Error creating test commit email',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  async testEmailQueueInsertion(): Promise<EmailTriggerTest> {
    try {
      console.log('🧪 Testing direct email queue insertion...');

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return {
          name: 'Direct Email Queue Test',
          success: false,
          message: 'User not authenticated for direct test',
          details: { error: userError?.message || 'No user found' }
        };
      }

      // Try to insert a test email directly
      const testEmail = {
        user_id: user.id,
        email: 'test@emailtriggerfix.com',
        subject: '🧪 Test - Email Queue Insertion Verification',
        body: '<p>This is a test email to verify direct mail_queue insertion works.</p>',
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('mail_queue')
        .insert(testEmail);

      if (insertError) {
        return {
          name: 'Direct Email Queue Test',
          success: false,
          message: 'Failed to insert test email into mail_queue',
          details: { error: insertError.message },
          fix: [
            'RLS policies are blocking email insertion',
            'Run the improved mail_queue RLS policy SQL script',
            'Check if mail_queue table exists',
            'Verify user permissions for mail_queue table'
          ]
        };
      }

      // Clean up test email
      const { error: deleteError } = await supabase
        .from('mail_queue')
        .delete()
        .eq('email', 'test@emailtriggerfix.com')
        .eq('subject', '🧪 Test - Email Queue Insertion Verification');

      if (deleteError) {
        console.warn('⚠️ Failed to clean up test email:', deleteError.message);
      }

      return {
        name: 'Direct Email Queue Test',
        success: true,
        message: 'Successfully inserted and cleaned up test email',
        details: {
          insertionWorking: true,
          userCanInsert: true,
          cleanupWorking: !deleteError
        }
      };

    } catch (error) {
      return {
        name: 'Direct Email Queue Test',
        success: false,
        message: 'Exception during direct email queue test',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        fix: [
          'Check mail_queue table exists',
          'Verify RLS policies allow authenticated users to insert emails',
          'Check network connectivity to Supabase'
        ]
      };
    }
  }

  async debugEmailSubjects(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('🔍 Debugging actual email subjects in mail_queue...');

      const recentDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Get all recent emails with their subjects
      const { data: recentEmails, error } = await supabase
        .from('mail_queue')
        .select('id, subject, created_at, status, user_id')
        .gte('created_at', recentDate)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        return {
          success: false,
          message: 'Failed to fetch recent emails',
          details: { error: error.message }
        };
      }

      // Group by subject for analysis
      const subjectGroups = {};
      recentEmails?.forEach(email => {
        const subject = email.subject;
        if (!subjectGroups[subject]) {
          subjectGroups[subject] = 0;
        }
        subjectGroups[subject]++;
      });

      return {
        success: true,
        message: `Found ${recentEmails?.length || 0} recent emails`,
        details: {
          totalEmails: recentEmails?.length || 0,
          subjectGroups,
          allSubjects: recentEmails?.map(e => e.subject) || [],
          recentEmailSamples: recentEmails?.slice(0, 10).map(e => ({
            subject: e.subject,
            created_at: e.created_at,
            status: e.status
          })) || []
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Exception while debugging email subjects',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }
}

export const emailTriggerFix = new EmailTriggerFix();
