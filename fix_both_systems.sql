-- ==============================================
-- FIX CONTACT MESSAGES SYSTEM
-- ==============================================

-- Drop the problematic single policy for contact messages
DROP POLICY IF EXISTS "Admins can manage contact messages" ON contact_messages;

-- Create proper separate policies for contact messages
-- 1. Allow anyone to insert contact messages (for contact form submissions)
CREATE POLICY "Anyone can insert contact messages" ON contact_messages 
FOR INSERT 
WITH CHECK (true);

-- 2. Only admins can read contact messages
CREATE POLICY "Admins can read contact messages" ON contact_messages 
FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true))
);

-- 3. Only admins can update contact messages
CREATE POLICY "Admins can update contact messages" ON contact_messages 
FOR UPDATE 
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true))
);

-- 4. Only admins can delete contact messages
CREATE POLICY "Admins can delete contact messages" ON contact_messages 
FOR DELETE 
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true))
);

-- ==============================================
-- FIX NOTIFICATIONS SYSTEM
-- ==============================================

-- Drop all existing notification policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can manage all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- Create comprehensive RLS policies for notifications
-- 1. Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- 2. Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Allow service role to insert notifications (for system/edge function notifications)
CREATE POLICY "Service role can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 4. Allow authenticated users to insert their own notifications (for client-side notifications)
CREATE POLICY "Users can insert own notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Allow service role full access (for admin operations)
CREATE POLICY "Service role can manage all notifications" ON public.notifications
  FOR ALL USING (auth.role() = 'service_role');

-- Make sure RLS is enabled on both tables
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON contact_messages TO authenticated;
GRANT ALL ON contact_messages TO service_role;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
