-- ================================================
-- MAIL QUEUE FIX SCRIPT
-- Run this in Supabase Dashboard > SQL Editor
-- ================================================

-- 1. Create mail_queue table if it doesn't exist
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

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mail_queue_status ON mail_queue(status);
CREATE INDEX IF NOT EXISTS idx_mail_queue_created_at ON mail_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_mail_queue_user_id ON mail_queue(user_id);

-- 3. Enable Row Level Security
ALTER TABLE mail_queue ENABLE ROW LEVEL SECURITY;

-- 4. Fix mail_queue RLS policies to allow proper email functionality
-- Drop existing policies
DROP POLICY IF EXISTS "Service role can manage all emails" ON mail_queue;
DROP POLICY IF EXISTS "Users can insert their own emails" ON mail_queue;
DROP POLICY IF EXISTS "Users can view their own emails" ON mail_queue;
DROP POLICY IF EXISTS "System can insert emails" ON mail_queue;
DROP POLICY IF EXISTS "System can update email status" ON mail_queue;

-- 5. Create new policies that allow proper email queue functionality

-- Allow authenticated users to insert emails for themselves
CREATE POLICY "Users can insert their own emails"
ON mail_queue
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (user_id = auth.uid() OR user_id IS NULL)
);

-- Allow service role (edge functions) to manage all emails
CREATE POLICY "Service role can manage all emails"
ON mail_queue
FOR ALL
USING (auth.role() = 'service_role');

-- Allow edge functions to insert emails (for system-generated emails)
CREATE POLICY "System can insert emails"
ON mail_queue
FOR INSERT
WITH CHECK (
  auth.role() = 'service_role' OR
  auth.uid() IS NULL OR
  (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
);

-- Users can view their own emails
CREATE POLICY "Users can view their own emails"
ON mail_queue
FOR SELECT
USING (
  auth.uid() = user_id OR
  auth.role() = 'service_role'
);

-- Allow system to update email status
CREATE POLICY "System can update email status"
ON mail_queue
FOR UPDATE
USING (
  auth.role() = 'service_role' OR
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
);

-- 7. Grant proper permissions to service role
GRANT ALL ON mail_queue TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 8. Create RPC function for table creation (for automated setup)
CREATE OR REPLACE FUNCTION create_mail_queue_table()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if table already exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'mail_queue'
    ) THEN
        RETURN TRUE; -- Table already exists
    END IF;

    -- Create the table (this will only run if table doesn't exist)
    CREATE TABLE mail_queue (
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
    CREATE INDEX idx_mail_queue_status ON mail_queue(status);
    CREATE INDEX idx_mail_queue_created_at ON mail_queue(created_at);
    CREATE INDEX idx_mail_queue_user_id ON mail_queue(user_id);

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- 9. Test the table by inserting and removing a test record
DO $$
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
        'test@mailqueuefix.com',
        'Test - Mail Queue Setup Verification',
        '<p>This is a test email to verify mail_queue setup.</p>',
        'pending',
        NOW()
    ) RETURNING id INTO test_id;
    
    -- Clean up test record
    DELETE FROM mail_queue WHERE id = test_id;
    
    RAISE NOTICE 'SUCCESS: mail_queue table is working correctly!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: mail_queue table test failed: %', SQLERRM;
END $$;

-- 10. Show current mail_queue status
SELECT 
    COUNT(*) as total_emails,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_emails,
    COUNT(*) FILTER (WHERE status = 'sent') as sent_emails,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_emails,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as emails_last_24h
FROM mail_queue;

-- 11. Show recent orders vs recent emails (diagnostic)
SELECT 
    (SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '24 hours') as recent_orders,
    (SELECT COUNT(*) FROM mail_queue WHERE created_at >= NOW() - INTERVAL '24 hours') as recent_emails,
    CASE 
        WHEN (SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '24 hours') > 0 
             AND (SELECT COUNT(*) FROM mail_queue WHERE created_at >= NOW() - INTERVAL '24 hours') = 0
        THEN 'PROBLEM: Orders created but no emails queued'
        ELSE 'OK: Email queueing appears to be working'
    END as diagnosis;
