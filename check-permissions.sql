-- Quick diagnostic to check what's causing the permission error

-- 1. Check if tables exist and are accessible
SELECT tablename, tableowner FROM pg_tables WHERE tablename IN ('study_resources', 'study_tips');

-- 2. Check RLS status
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'RLS is ON - need policies'
        ELSE 'RLS is OFF - check table permissions'
    END as status
FROM pg_tables 
LEFT JOIN pg_class ON pg_class.relname = pg_tables.tablename 
WHERE tablename IN ('study_resources', 'study_tips');

-- 3. Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('study_resources', 'study_tips');

-- 4. Check table permissions for current role
SELECT 
    'study_resources' as table_name,
    has_table_privilege(current_user, 'public.study_resources', 'SELECT') as can_select,
    has_table_privilege(current_user, 'public.study_resources', 'INSERT') as can_insert,
    has_table_privilege(current_user, 'public.study_resources', 'UPDATE') as can_update,
    has_table_privilege(current_user, 'public.study_resources', 'DELETE') as can_delete;

-- 5. Show current user context
SELECT current_user, current_role;

-- 6. Quick fix - if you want to temporarily disable RLS to test:
-- ALTER TABLE public.study_resources DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.study_tips DISABLE ROW LEVEL SECURITY;
