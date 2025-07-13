-- Check if tables exist and show their structure
-- Run this in your database to see what columns you actually have

-- 1. Check if tables exist
SELECT tablename FROM pg_tables WHERE tablename IN ('study_resources', 'study_tips');

-- 2. Show study_resources table structure
\d study_resources;

-- 3. Show study_tips table structure  
\d study_tips;

-- 4. List all columns in study_resources
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'study_resources' 
ORDER BY ordinal_position;

-- 5. List all columns in study_tips
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'study_tips' 
ORDER BY ordinal_position;

-- 6. Check for any data in the tables
SELECT COUNT(*) as study_resources_count FROM study_resources;
SELECT COUNT(*) as study_tips_count FROM study_tips;

-- 7. Test basic queries that the code will use
SELECT id, title, created_at FROM study_resources LIMIT 1;
SELECT id, title, created_at FROM study_tips LIMIT 1;
