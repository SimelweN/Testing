-- Email System Complete Fix Script
-- Run this in Supabase SQL Editor to fix all email-related issues

-- 1. Create mail_queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS mail_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mail_queue_status ON mail_queue(status);
CREATE INDEX IF NOT EXISTS idx_mail_queue_created_at ON mail_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_mail_queue_user_id ON mail_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_mail_queue_retry_count ON mail_queue(retry_count);

-- 3. Enable Row Level Security
ALTER TABLE mail_queue ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "mail_queue_admin_full_access" ON mail_queue;
DROP POLICY IF EXISTS "mail_queue_user_insert" ON mail_queue;
DROP POLICY IF EXISTS "mail_queue_user_read" ON mail_queue;
DROP POLICY IF EXISTS "mail_queue_service_role_full_access" ON mail_queue;

-- 5. Create comprehensive RLS policies
-- Allow service role (edge functions) full access
CREATE POLICY "mail_queue_service_role_full_access" ON mail_queue
    FOR ALL USING (true);

-- Allow authenticated users to insert their own emails
CREATE POLICY "mail_queue_user_insert" ON mail_queue
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id OR auth.uid() IN (
        SELECT id FROM auth.users WHERE email IN (
            'admin@rebookedsolutions.co.za',
            'support@rebookedsolutions.co.za'
        )
    ));

-- Allow users to read their own emails and admins to read all
CREATE POLICY "mail_queue_user_read" ON mail_queue
    FOR SELECT TO authenticated
    USING (
        auth.uid() = user_id OR 
        auth.uid() IN (
            SELECT id FROM auth.users WHERE email IN (
                'admin@rebookedsolutions.co.za',
                'support@rebookedsolutions.co.za'
            )
        )
    );

-- Allow admins to update/delete emails
CREATE POLICY "mail_queue_admin_modify" ON mail_queue
    FOR UPDATE TO authenticated
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE email IN (
                'admin@rebookedsolutions.co.za',
                'support@rebookedsolutions.co.za'
            )
        )
    );

-- 6. Create or update profiles table if needed for admin detection
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    name TEXT,
    full_name TEXT,
    phone_number TEXT,
    university TEXT,
    bio TEXT,
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Add admin flag to specific users (replace with actual admin emails)
UPDATE profiles SET is_admin = TRUE 
WHERE email IN (
    'admin@rebookedsolutions.co.za',
    'support@rebookedsolutions.co.za'
);

-- 8. Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id AND is_admin = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Update RLS policies to use admin function
DROP POLICY IF EXISTS "mail_queue_admin_read" ON mail_queue;
CREATE POLICY "mail_queue_admin_read" ON mail_queue
    FOR SELECT TO authenticated
    USING (
        auth.uid() = user_id OR 
        is_admin_user(auth.uid())
    );

-- 10. Create function to clean up old emails (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_emails()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM mail_queue 
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND status IN ('sent', 'failed');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 11. Create function to reset stuck emails (pending for more than 2 hours)
CREATE OR REPLACE FUNCTION reset_stuck_emails()
RETURNS INTEGER AS $$
DECLARE
    reset_count INTEGER;
BEGIN
    UPDATE mail_queue 
    SET status = 'pending',
        retry_count = GREATEST(retry_count - 1, 0),
        error_message = 'Reset from stuck status',
        updated_at = NOW()
    WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '2 hours'
    AND retry_count < 3;
    
    GET DIAGNOSTICS reset_count = ROW_COUNT;
    RETURN reset_count;
END;
$$ LANGUAGE plpgsql;

-- 12. Create function to get email queue stats
CREATE OR REPLACE FUNCTION get_mail_queue_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_emails', COUNT(*),
        'pending', COUNT(*) FILTER (WHERE status = 'pending'),
        'sent', COUNT(*) FILTER (WHERE status = 'sent'),
        'failed', COUNT(*) FILTER (WHERE status = 'failed'),
        'stuck_emails', COUNT(*) FILTER (WHERE status = 'pending' AND created_at < NOW() - INTERVAL '1 hour'),
        'oldest_pending', MIN(created_at) FILTER (WHERE status = 'pending'),
        'latest_sent', MAX(sent_at) FILTER (WHERE status = 'sent')
    ) INTO result
    FROM mail_queue
    WHERE created_at > NOW() - INTERVAL '7 days';
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Insert test email to verify system is working
INSERT INTO mail_queue (
    user_id,
    email,
    subject,
    body,
    status,
    created_at
) VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    'test@rebookedsolutions.co.za',
    '🧪 Email System Setup Test - ' || NOW()::TEXT,
    '<h1>Email System Working!</h1><p>This test email confirms that the mail_queue table is set up correctly and emails can be inserted.</p><p>Time: ' || NOW()::TEXT || '</p>',
    'pending',
    NOW()
) ON CONFLICT DO NOTHING;

-- 14. Grant necessary permissions
GRANT ALL ON mail_queue TO postgres;
GRANT ALL ON mail_queue TO service_role;
GRANT SELECT, INSERT, UPDATE ON mail_queue TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- 15. Final verification query
SELECT 
    'Mail queue table created' as status,
    COUNT(*) as total_emails,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_emails,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '5 minutes') as recent_emails
FROM mail_queue;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Email system setup completed successfully!';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Set BREVO_SMTP_KEY in Supabase Dashboard > Settings > API > Environment Variables';
    RAISE NOTICE '2. Deploy edge functions: send-email, process-mail-queue, mail-queue-cron';
    RAISE NOTICE '3. Test email system using Admin Dashboard > Email tab';
    RAISE NOTICE '4. Schedule cron job for mail-queue-cron function';
END $$;
