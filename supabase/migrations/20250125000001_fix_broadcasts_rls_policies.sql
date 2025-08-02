-- Create RLS policies for broadcasts table

-- Enable RLS if not already enabled
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

-- Policy to allow all users to view active broadcasts
CREATE POLICY "Allow all users to view active broadcasts" ON public.broadcasts
FOR SELECT
USING (active = true AND (expires_at IS NULL OR expires_at > now()));

-- Policy to allow admin users to create broadcasts
CREATE POLICY "Allow admin users to create broadcasts" ON public.broadcasts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

-- Policy to allow admin users to update their own broadcasts
CREATE POLICY "Allow admin users to update broadcasts" ON public.broadcasts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

-- Policy to allow admin users to delete broadcasts
CREATE POLICY "Allow admin users to delete broadcasts" ON public.broadcasts
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

-- Alternative policy for admin role-based access if user_type doesn't exist
-- This will work if the admin access is role-based instead of profile-based
CREATE POLICY "Allow authenticated admin role to manage broadcasts" ON public.broadcasts
FOR ALL
USING (
  auth.role() = 'authenticated' AND 
  (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'user_role' = 'admin'
  )
);
