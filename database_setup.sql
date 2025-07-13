-- Manual Database Setup for Study Resources
-- Copy and paste this into your Supabase SQL Editor and run it

-- Create study_resources table
CREATE TABLE IF NOT EXISTS public.study_resources (
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
CREATE TABLE IF NOT EXISTS public.study_tips (
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

-- Enable Row Level Security
ALTER TABLE public.study_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_tips ENABLE ROW LEVEL SECURITY;

-- Create policies for study_resources
DROP POLICY IF EXISTS "Anyone can view active study resources" ON public.study_resources;
CREATE POLICY "Anyone can view active study resources" 
    ON public.study_resources FOR SELECT 
    USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage study resources" ON public.study_resources;
CREATE POLICY "Admins can manage study resources" 
    ON public.study_resources FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create policies for study_tips
DROP POLICY IF EXISTS "Anyone can view active study tips" ON public.study_tips;
CREATE POLICY "Anyone can view active study tips" 
    ON public.study_tips FOR SELECT 
    USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage study tips" ON public.study_tips;
CREATE POLICY "Admins can manage study tips" 
    ON public.study_tips FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS study_resources_active_idx ON public.study_resources(is_active);
CREATE INDEX IF NOT EXISTS study_resources_category_idx ON public.study_resources(category);
CREATE INDEX IF NOT EXISTS study_resources_difficulty_idx ON public.study_resources(difficulty);

CREATE INDEX IF NOT EXISTS study_tips_active_idx ON public.study_tips(is_active);
CREATE INDEX IF NOT EXISTS study_tips_category_idx ON public.study_tips(category);
CREATE INDEX IF NOT EXISTS study_tips_difficulty_idx ON public.study_tips(difficulty);

-- Insert sample data
INSERT INTO public.study_resources (title, description, type, category, difficulty, url, rating, provider, duration, tags, is_active, is_featured)
VALUES 
    ('Sample Mathematics Guide', 'A comprehensive mathematics study guide', 'pdf', 'Mathematics', 'Intermediate', 'https://example.com/math.pdf', 4.5, 'EduResources', '2 hours', ARRAY['mathematics', 'study'], true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.study_tips (title, content, category, difficulty, tags, is_active, author, estimated_time, effectiveness)
VALUES 
    ('Active Recall Technique', 'Use active recall by testing yourself frequently rather than just re-reading notes. This method has been proven to significantly improve long-term retention.', 'Study Techniques', 'Beginner', ARRAY['memory', 'study-techniques'], true, 'Study Expert', '5 minutes', 90)
ON CONFLICT (id) DO NOTHING;

-- Verify tables were created
SELECT 'study_resources table created' as status, count(*) as record_count FROM public.study_resources;
SELECT 'study_tips table created' as status, count(*) as record_count FROM public.study_tips;
