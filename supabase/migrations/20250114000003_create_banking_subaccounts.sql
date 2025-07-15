-- Create banking_subaccounts table and related structures
-- This migration creates the missing banking_subaccounts table

-- Banking Subaccounts Table
-- Stores user banking details and Paystack subaccount information
CREATE TABLE IF NOT EXISTS banking_subaccounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subaccount_code TEXT UNIQUE NOT NULL, -- Paystack subaccount code
  business_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank_code TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
  paystack_response JSONB, -- Store full Paystack response for debugging
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on user_id to ensure one banking account per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_banking_subaccounts_user_id 
ON banking_subaccounts(user_id);

-- Create index on subaccount_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_banking_subaccounts_code 
ON banking_subaccounts(subaccount_code);

-- Enable RLS on banking_subaccounts table
ALTER TABLE banking_subaccounts ENABLE ROW LEVEL SECURITY;

-- Banking Subaccounts Policies
-- Users can only view/edit their own banking details
CREATE POLICY "Users can view own banking details" ON banking_subaccounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own banking details" ON banking_subaccounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own banking details" ON banking_subaccounts
  FOR UPDATE USING (auth.uid() = user_id);

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

-- Function to automatically link books to subaccount when banking is set up
CREATE OR REPLACE FUNCTION link_books_to_subaccount()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all books for this seller to use the new subaccount
  UPDATE books 
  SET paystack_subaccount_code = NEW.subaccount_code 
  WHERE seller_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-link books when subaccount is created
CREATE TRIGGER link_books_on_subaccount_create
  AFTER INSERT ON banking_subaccounts
  FOR EACH ROW EXECUTE FUNCTION link_books_to_subaccount();

-- Add comments for documentation
COMMENT ON TABLE banking_subaccounts IS 'Stores user banking details and Paystack subaccount codes for payment processing';
COMMENT ON COLUMN banking_subaccounts.subaccount_code IS 'Unique Paystack subaccount code for this user';
COMMENT ON COLUMN banking_subaccounts.paystack_response IS 'Full Paystack API response when subaccount was created';
