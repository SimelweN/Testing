-- Add province column to books table
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS province TEXT;

-- Create index for province to improve filtering performance
CREATE INDEX IF NOT EXISTS idx_books_province ON public.books (province);

-- Update existing books to have null province (will be populated when users update their listings)
-- No need to set default values as province will be fetched from user address when creating new books
