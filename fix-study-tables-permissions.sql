-- Fix permissions for study_resources and study_tips tables
-- Run this as a database admin to fix the permission error (42501)

-- 1. Check current RLS status
SELECT schemaname, tablename, rowsecurity, hasrlspolicy 
FROM pg_tables 
LEFT JOIN pg_class ON pg_class.relname = pg_tables.tablename 
LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace 
WHERE schemaname = 'public' 
AND tablename IN ('study_resources', 'study_tips');

-- 2. Disable RLS temporarily to check if that's the issue
ALTER TABLE public.study_resources DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_tips DISABLE ROW LEVEL SECURITY;

-- 3. Grant proper permissions to authenticated users
GRANT ALL ON public.study_resources TO authenticated;
GRANT ALL ON public.study_tips TO authenticated;

-- 4. Grant permissions to service_role (if you're using service key)
GRANT ALL ON public.study_resources TO service_role;
GRANT ALL ON public.study_tips TO service_role;

-- 5. Re-enable RLS with proper policies
ALTER TABLE public.study_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_tips ENABLE ROW LEVEL SECURITY;

-- 6. Create permissive policies for admins
-- Study Resources policies
DROP POLICY IF EXISTS "Allow admins to manage study resources" ON public.study_resources;
CREATE POLICY "Allow admins to manage study resources"
    ON public.study_resources
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow public read access to study resources
DROP POLICY IF EXISTS "Allow public read access to study resources" ON public.study_resources;
CREATE POLICY "Allow public read access to study resources"
    ON public.study_resources
    FOR SELECT
    TO anon
    USING (true);

-- Study Tips policies  
DROP POLICY IF EXISTS "Allow admins to manage study tips" ON public.study_tips;
CREATE POLICY "Allow admins to manage study tips"
    ON public.study_tips
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow public read access to study tips
DROP POLICY IF EXISTS "Allow public read access to study tips" ON public.study_tips;
CREATE POLICY "Allow public read access to study tips"
    ON public.study_tips
    FOR SELECT
    TO anon
    USING (true);

-- 7. Test insert permissions
-- Test study_resources insert
INSERT INTO public.study_resources (title, description, type, category, difficulty, url, rating, tags, sponsored)
VALUES ('Test Resource', 'Test Description', 'pdf', 'Mathematics', 'Beginner', 'https://example.com', 0, ARRAY['test'], false);

-- Test study_tips insert  
INSERT INTO public.study_tips (title, description, is_active)
VALUES ('Test Tip', 'Test Description', true);

-- 8. Clean up test data
DELETE FROM public.study_resources WHERE title = 'Test Resource';
DELETE FROM public.study_tips WHERE title = 'Test Tip';

-- 9. Verify the setup
SELECT 'study_resources permissions' as table_name, 
       has_table_privilege('authenticated', 'public.study_resources', 'INSERT') as can_insert,
       has_table_privilege('authenticated', 'public.study_resources', 'SELECT') as can_select;

SELECT 'study_tips permissions' as table_name,
       has_table_privilege('authenticated', 'public.study_tips', 'INSERT') as can_insert,
       has_table_privilege('authenticated', 'public.study_tips', 'SELECT') as can_select;
