-- Fix contact_messages table RLS policies
-- This script ensures proper access for both public users (to submit messages) and admins (to read/manage them)

-- Drop existing policy to recreate it properly
DROP POLICY IF EXISTS "Admins can manage contact messages" ON contact_messages;

-- Create separate policies for better security and functionality
-- 1. Allow anyone to insert contact messages (for contact form submissions)
CREATE POLICY "Anyone can insert contact messages" ON contact_messages 
FOR INSERT 
WITH CHECK (true);

-- 2. Only admins can read/update/delete contact messages
CREATE POLICY "Admins can read contact messages" ON contact_messages 
FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true))
);

CREATE POLICY "Admins can update contact messages" ON contact_messages 
FOR UPDATE 
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true))
);

CREATE POLICY "Admins can delete contact messages" ON contact_messages 
FOR DELETE 
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true))
);

-- Ensure RLS is enabled
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
