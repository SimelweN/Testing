-- Create banking_subaccounts table and related structures
-- Table Structure: banking_subaccounts with exact specifications

-- Banking Subaccounts Table
-- Primary Key: id (UUID)
CREATE TABLE IF NOT EXISTS banking_subaccounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Links to Users: user_id (UUID) - Foreign key to auth.users(id) with CASCADE delete
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  -- The actual Paystack subaccount code for payment routing
  subaccount_code TEXT UNIQUE NOT NULL,
  -- Banking details
  business_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  bank_code TEXT NOT NULL,
  account_number TEXT NOT NULL,
  -- User's email address
  email TEXT NOT NULL,
  -- Status: 'pending', 'active', or 'failed'
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'failed')),
  -- Full Paystack API response
  paystack_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on user_id to ensure one banking account per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_banking_subaccounts_user_id 
ON banking_subaccounts(user_id);

-- Create index on subaccount_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_banking_subaccounts_code 
ON banking_subaccounts(subaccount_code);

-- Links to Books: Books table has seller_subaccount_code column that references banking_subaccounts.subaccount_code
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS seller_subaccount_code TEXT REFERENCES banking_subaccounts(subaccount_code);

-- Create index for books subaccount lookups
CREATE INDEX IF NOT EXISTS idx_books_seller_subaccount_code ON books(seller_subaccount_code);

-- The subaccount_code is also duplicated in the profiles table for quick access
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subaccount_code TEXT REFERENCES banking_subaccounts(subaccount_code);

-- Create index for profiles subaccount lookups
CREATE INDEX IF NOT EXISTS idx_profiles_subaccount_code ON profiles(subaccount_code);

-- Security: Row Level Security (RLS) ensures users can only access their own subaccounts
ALTER TABLE banking_subaccounts ENABLE ROW LEVEL SECURITY;

-- Policies restrict all operations (SELECT, INSERT, UPDATE, DELETE) to the user who owns the record
CREATE POLICY "Users can view own banking details" ON banking_subaccounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own banking details" ON banking_subaccounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own banking details" ON banking_subaccounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own banking details" ON banking_subaccounts
  FOR DELETE USING (auth.uid() = user_id);

-- Service role can manage all banking subaccounts
CREATE POLICY "Service role can manage banking subaccounts" ON banking_subaccounts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_banking_subaccounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE TRIGGER update_banking_subaccounts_updated_at 
  BEFORE UPDATE ON banking_subaccounts 
  FOR EACH ROW EXECUTE FUNCTION update_banking_subaccounts_updated_at();

-- Function to automatically link books and profiles to subaccount when banking is set up
CREATE OR REPLACE FUNCTION link_books_to_subaccount()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all books for this seller to use the new subaccount
  UPDATE books 
  SET seller_subaccount_code = NEW.subaccount_code 
  WHERE seller_id = NEW.user_id;
  
  -- Update profiles table for quick access
  UPDATE profiles
  SET subaccount_code = NEW.subaccount_code
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-link books and profiles when subaccount is created or updated
CREATE TRIGGER link_books_on_subaccount_create
  AFTER INSERT OR UPDATE ON banking_subaccounts
  FOR EACH ROW EXECUTE FUNCTION link_books_to_subaccount();

-- Add comments for documentation
COMMENT ON TABLE banking_subaccounts IS 'Stores user banking details and Paystack subaccount codes for payment processing';
COMMENT ON COLUMN banking_subaccounts.id IS 'Primary Key: id (UUID)';
COMMENT ON COLUMN banking_subaccounts.user_id IS 'Links to Users: user_id (UUID) - Foreign key to auth.users(id) with CASCADE delete';
COMMENT ON COLUMN banking_subaccounts.subaccount_code IS 'The actual Paystack subaccount code for payment routing';
COMMENT ON COLUMN banking_subaccounts.email IS 'User''s email address';
COMMENT ON COLUMN banking_subaccounts.status IS 'Status: pending, active, or failed';
COMMENT ON COLUMN banking_subaccounts.paystack_response IS 'Full Paystack API response';
