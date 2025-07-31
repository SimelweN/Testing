-- QUICK FIX: Run this in your Supabase SQL Editor to fix notification creation
-- This will allow users to create notifications

-- Check current policies (for debugging)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'notifications';

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;

-- Create the missing INSERT policy
CREATE POLICY "Users can insert own notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow service role to insert notifications (for admin/system notifications)
DROP POLICY IF EXISTS "Service role can manage all notifications" ON public.notifications;
CREATE POLICY "Service role can manage all notifications" ON public.notifications
  FOR ALL USING (auth.role() = 'service_role');

-- Verify the table has RLS enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Check policies were created successfully
SELECT 'Policies after fix:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'notifications';
