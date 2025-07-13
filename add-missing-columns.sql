-- Add missing columns to your existing tables

-- 1. Add provider column to study_resources table
ALTER TABLE study_resources 
ADD COLUMN provider TEXT;

-- 2. Add content column to study_tips table  
ALTER TABLE study_tips 
ADD COLUMN content TEXT NOT NULL DEFAULT '';

-- 3. Update existing rows to have empty content (if any exist)
UPDATE study_tips SET content = '' WHERE content IS NULL;

-- 4. Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'study_resources' AND column_name = 'provider';

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'study_tips' AND column_name = 'content';

-- 5. Test queries after adding columns
SELECT id, title, provider FROM study_resources LIMIT 1;
SELECT id, title, content FROM study_tips LIMIT 1;
