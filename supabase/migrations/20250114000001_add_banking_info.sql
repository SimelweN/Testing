-- Add banking information columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banking_info JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banking_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banking_setup_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS paystack_subaccount_code TEXT;

-- Add banking requirement tracking to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS requires_banking_setup BOOLEAN DEFAULT TRUE;
ALTER TABLE books ADD COLUMN IF NOT EXISTS pickup_address JSONB;
ALTER TABLE books ADD COLUMN IF NOT EXISTS paystack_subaccount_code TEXT;

-- Create index for banking-related queries
CREATE INDEX IF NOT EXISTS idx_profiles_banking_verified ON profiles(banking_verified);
CREATE INDEX IF NOT EXISTS idx_books_requires_banking ON books(requires_banking_setup);

-- Add RLS policies for banking information
CREATE POLICY "Users can view their own banking info" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own banking info" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create function to check if user has banking setup
CREATE OR REPLACE FUNCTION has_banking_setup(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND banking_info IS NOT NULL 
        AND banking_verified = TRUE
    );
END;
$$;

-- Add comments
COMMENT ON COLUMN profiles.banking_info IS 'Encrypted banking information including account details';
COMMENT ON COLUMN profiles.banking_verified IS 'Whether banking information has been verified';
COMMENT ON COLUMN profiles.banking_setup_at IS 'When banking was initially set up';
COMMENT ON COLUMN profiles.paystack_subaccount_code IS 'Paystack subaccount code for this seller';
COMMENT ON COLUMN books.pickup_address IS 'Seller pickup address for this book';
COMMENT ON COLUMN books.paystack_subaccount_code IS 'Paystack subaccount code for this book sale';
