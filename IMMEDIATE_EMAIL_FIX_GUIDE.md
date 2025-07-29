# 🚨 IMMEDIATE EMAIL FIX GUIDE - ReBooked Solutions

## 🎯 PROBLEM CONFIRMED
Your email system is **properly coded and configured** but emails are not being sent due to **environment setup issues**.

## ✅ WHAT'S WORKING
- ✅ All email templates exist and are correctly formatted
- ✅ Order creation triggers email queueing (create-order function)
- ✅ Commit triggers email queueing (commit-to-sale function)
- ✅ Decline triggers email queueing (decline-commit function)
- ✅ Mail queue system is properly implemented
- ✅ Email processing functions exist

## ❌ WHAT'S BROKEN
- ❌ BREVO_SMTP_KEY environment variable not configured
- ❌ Mail queue processing not running automatically
- ❌ Emails stuck in "pending" status

## 🔧 IMMEDIATE FIXES NEEDED

### 1. Configure BREVO SMTP Key (CRITICAL)
```bash
# In Supabase Dashboard > Settings > API > Secrets
supabase secrets set BREVO_SMTP_KEY="your_brevo_smtp_key_here"
```

**How to get your BREVO key:**
1. Go to [Brevo Dashboard](https://app.brevo.com)
2. Navigate to **SMTP & API** > **SMTP**
3. Copy your SMTP password/key
4. Paste it in the command above

### 2. Create Mail Queue Table (If Missing)
```sql
-- Run in Supabase Dashboard > SQL Editor
CREATE TABLE IF NOT EXISTS mail_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_mail_queue_status ON mail_queue(status);
CREATE INDEX IF NOT EXISTS idx_mail_queue_created_at ON mail_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_mail_queue_user_id ON mail_queue(user_id);

-- Enable RLS
ALTER TABLE mail_queue ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY IF NOT EXISTS "Users can insert their own emails"
ON mail_queue FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can view their own emails"
ON mail_queue FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Service role can manage all emails"
ON mail_queue FOR ALL TO service_role
USING (true);
```

### 3. Deploy Edge Functions (If Not Deployed)
```bash
# Deploy all email-related functions
supabase functions deploy send-email
supabase functions deploy process-mail-queue
supabase functions deploy mail-queue-cron
supabase functions deploy create-order
supabase functions deploy commit-to-sale
supabase functions deploy decline-commit
```

### 4. Set Up Automatic Email Processing
You need to schedule the mail queue processor to run every 5 minutes:

**Option A: Using Supabase Cron (Recommended)**
```sql
-- Run in Supabase Dashboard > SQL Editor
SELECT cron.schedule('process-mail-queue', '*/5 * * * *', 'SELECT net.http_post(
  url:=''https://your-project-id.supabase.co/functions/v1/mail-queue-cron'',
  headers:=''{"Authorization": "Bearer YOUR_SERVICE_KEY"}''::jsonb
);');
```

**Option B: External Cron Service**
Set up a cron job to hit: `https://your-project-id.supabase.co/functions/v1/mail-queue-cron`

## 🧪 TESTING THE FIX

### Step 1: Use the New Email Diagnostics Dashboard
1. Go to **Admin Dashboard** > **Email** tab
2. Click "Run Diagnostics"
3. Check all systems show "Healthy"

### Step 2: Test Email Triggers
1. In the **Email Triggers** tab, click "Test All Triggers"
2. All tests should show "PASS"

### Step 3: Test Specific Email Types
1. Enter your email in the test field
2. Click "Order Receipt" to test buyer confirmation emails
3. Click "Commit Request" to test seller notification emails
4. Check your email inbox for the test emails

### Step 4: Process Any Stuck Emails
1. Click "Process All Pending Emails"
2. This will send any emails that got stuck in the queue

## 📧 EMAIL FLOW VERIFICATION

After the fix, these emails should be sent automatically:

### When Order is Created (After Paystack Payment):
✅ **Buyer Receipt Email** - "🎉 Order Confirmed - Thank You!"
✅ **Seller Notification Email** - "📚 New Order - Action Required (48 hours)"

### When Seller Commits to Order:
✅ **Buyer Confirmation Email** - "Order Confirmed - Pickup Scheduled"
✅ **Seller Confirmation Email** - "Order Commitment Confirmed - Prepare for Pickup"

### When Seller Declines Order:
✅ **Buyer Decline Email** - Decline confirmation and refund notice
✅ **Seller Decline Email** - Decline confirmation

### When Tracking Information is Available:
✅ **Tracking Notification Emails** - Sent via tracking update functions

## 🔍 MONITORING

After implementing the fixes:

1. **Check Admin > Email tab** daily for:
   - Email system health status
   - Pending email count (should be near 0)
   - Failed email count (should be near 0)

2. **Monitor mail queue**:
   - Emails should move from "pending" to "sent" within 5 minutes
   - Failed emails should be retried automatically

3. **Test periodically**:
   - Create test orders to verify email flow
   - Use the Email Diagnostics tools regularly

## 🚨 PRIORITY ACTIONS

**DO THIS FIRST:**
1. Set up BREVO_SMTP_KEY environment variable
2. Run the Email Diagnostics in Admin > Email tab
3. Process any stuck emails with "Process All Pending Emails" button

**THEN:**
1. Set up automatic mail queue processing (cron job)
2. Test all email types
3. Monitor for 24 hours to ensure everything works

## 💡 TROUBLESHOOTING

If emails still don't work after these fixes:

1. **Check Supabase Edge Function logs**:
   - Go to Supabase Dashboard > Edge Functions
   - Check logs for send-email and process-mail-queue functions

2. **Verify BREVO account**:
   - Ensure BREVO account is active
   - Check if SMTP is enabled
   - Verify sending limits aren't exceeded

3. **Use Email Diagnostics**:
   - The new diagnostics will identify specific issues
   - Follow the fix recommendations provided

The email system is fully built and ready - it just needs proper environment configuration!
