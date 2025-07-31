-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to call the auto-expire-commits edge function
CREATE OR REPLACE FUNCTION auto_expire_commits_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the auto-expire-commits edge function
  PERFORM
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/auto-expire-commits',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := '{}'::jsonb
    );
END;
$$;

-- Schedule the auto-expire function to run every hour
-- This will automatically expire commits that are over 48 hours old
SELECT cron.schedule(
  'auto-expire-commits-hourly',
  '0 * * * *', -- Every hour at minute 0
  'SELECT auto_expire_commits_cron();'
);

-- Also create a manual trigger function for immediate testing
CREATE OR REPLACE FUNCTION trigger_commit_expiry()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM auto_expire_commits_cron();
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION auto_expire_commits_cron() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_commit_expiry() TO authenticated;

-- Add a comment explaining the cron job
COMMENT ON FUNCTION auto_expire_commits_cron() IS 'Automatically calls the auto-expire-commits edge function to expire orders pending commit for 48+ hours';
COMMENT ON FUNCTION trigger_commit_expiry() IS 'Manual trigger for testing commit expiry without waiting for cron schedule';
