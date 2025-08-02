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
    AND profiles.is_admin = true
  )
);

-- Policy to allow admin users to update broadcasts
CREATE POLICY "Allow admin users to update broadcasts" ON public.broadcasts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy to allow admin users to delete broadcasts
CREATE POLICY "Allow admin users to delete broadcasts" ON public.broadcasts
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Fallback policy for specific admin email (in case is_admin flag is not set yet)
CREATE POLICY "Allow specific admin email to manage broadcasts" ON public.broadcasts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND LOWER(profiles.email) = 'adminsimnli@gmail.com'
  )
);

-- Policy to allow any authenticated user to view all broadcasts for admin management
CREATE POLICY "Allow admin users to view all broadcasts" ON public.broadcasts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.is_admin = true OR LOWER(profiles.email) = 'adminsimnli@gmail.com')
  )
);
