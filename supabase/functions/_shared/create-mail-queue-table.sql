-- Create mail_queue table if it doesn't exist
-- This table stores email messages that need to be sent

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mail_queue_status ON mail_queue(status);
CREATE INDEX IF NOT EXISTS idx_mail_queue_created_at ON mail_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_mail_queue_user_id ON mail_queue(user_id);

-- Create RPC function to create the table (for use from client)
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

    -- Create the table
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

-- Grant permissions for authenticated users to insert emails
ALTER TABLE mail_queue ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to insert their own emails
CREATE POLICY IF NOT EXISTS "Users can insert their own emails"
ON mail_queue FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to view their own emails
CREATE POLICY IF NOT EXISTS "Users can view their own emails"
ON mail_queue FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy for service role to manage all emails (for edge functions)
CREATE POLICY IF NOT EXISTS "Service role can manage all emails"
ON mail_queue FOR ALL
TO service_role
USING (true);
