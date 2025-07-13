-- Create study_resources table
CREATE TABLE IF NOT EXISTS study_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('pdf', 'video', 'website', 'tool', 'course')),
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    url TEXT,
    rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    provider TEXT,
    duration TEXT,
    tags TEXT[] DEFAULT '{}',
    download_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_sponsored BOOLEAN DEFAULT false,
    sponsor_name TEXT,
    sponsor_logo TEXT,
    sponsor_url TEXT,
    sponsor_cta TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_tips table
CREATE TABLE IF NOT EXISTS study_tips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    author TEXT,
    estimated_time TEXT,
    effectiveness INTEGER CHECK (effectiveness >= 0 AND effectiveness <= 100),
    is_sponsored BOOLEAN DEFAULT false,
    sponsor_name TEXT,
    sponsor_logo TEXT,
    sponsor_url TEXT,
    sponsor_cta TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_study_resources_updated_at 
    BEFORE UPDATE ON study_resources 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_tips_updated_at 
    BEFORE UPDATE ON study_tips 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS study_resources_active_idx ON study_resources(is_active);
CREATE INDEX IF NOT EXISTS study_resources_category_idx ON study_resources(category);
CREATE INDEX IF NOT EXISTS study_resources_difficulty_idx ON study_resources(difficulty);
CREATE INDEX IF NOT EXISTS study_resources_featured_idx ON study_resources(is_featured);
CREATE INDEX IF NOT EXISTS study_resources_created_at_idx ON study_resources(created_at);

CREATE INDEX IF NOT EXISTS study_tips_active_idx ON study_tips(is_active);
CREATE INDEX IF NOT EXISTS study_tips_category_idx ON study_tips(category);
CREATE INDEX IF NOT EXISTS study_tips_difficulty_idx ON study_tips(difficulty);
CREATE INDEX IF NOT EXISTS study_tips_created_at_idx ON study_tips(created_at);

-- Enable Row Level Security
ALTER TABLE study_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_tips ENABLE ROW LEVEL SECURITY;

-- Create policies for study_resources
CREATE POLICY "Anyone can view active study resources" 
    ON study_resources FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Admins can manage study resources" 
    ON study_resources FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create policies for study_tips
CREATE POLICY "Anyone can view active study tips" 
    ON study_tips FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Admins can manage study tips" 
    ON study_tips FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Insert some sample data if tables are empty
INSERT INTO study_resources (title, description, type, category, difficulty, url, rating, provider, duration, tags, is_active, is_featured)
SELECT 
    'Mathematics Study Guide',
    'Comprehensive guide for mathematics students covering algebra, calculus, and statistics.',
    'pdf',
    'Mathematics',
    'Intermediate',
    'https://example.com/math-guide.pdf',
    4.5,
    'EduResources',
    '2 hours',
    ARRAY['mathematics', 'algebra', 'calculus', 'statistics'],
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM study_resources LIMIT 1);

INSERT INTO study_tips (title, content, category, difficulty, tags, is_active, author, estimated_time, effectiveness)
SELECT 
    'Effective Study Techniques',
    'Use active recall and spaced repetition to improve your learning. Test yourself regularly and review material at increasing intervals.',
    'Study Skills',
    'Beginner',
    ARRAY['study-techniques', 'memory', 'learning'],
    true,
    'Study Expert',
    '10 minutes',
    85
WHERE NOT EXISTS (SELECT 1 FROM study_tips LIMIT 1);

-- Add comment for documentation
COMMENT ON TABLE study_resources IS 'Administrative study resources created by admins for student use';
COMMENT ON TABLE study_tips IS 'Administrative study tips created by admins for student guidance';
