-- Fix notifications table RLS policies to allow INSERT operations
-- This fixes the "Failed to create notification" errors

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can manage all notifications" ON public.notifications;

-- Create comprehensive RLS policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow service role to manage all notifications (for admin actions and system notifications)
CREATE POLICY "Service role can manage all notifications" ON public.notifications
  FOR ALL USING (auth.role() = 'service_role');

-- Ensure RLS is enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Add helpful comment
COMMENT ON TABLE public.notifications IS 'User notifications with proper RLS policies for insert/select/update operations';
