-- Add encrypted fields to banking_subaccounts table
-- Migration to support encrypted banking details

-- Add new encrypted columns
ALTER TABLE banking_subaccounts 
ADD COLUMN IF NOT EXISTS encrypted_account_number TEXT,
ADD COLUMN IF NOT EXISTS encrypted_bank_code TEXT,
ADD COLUMN IF NOT EXISTS encryption_key_hash TEXT;

-- Create index for better performance on encryption lookups
CREATE INDEX IF NOT EXISTS idx_banking_subaccounts_encryption_key 
ON banking_subaccounts(encryption_key_hash);

-- Add comments for documentation
COMMENT ON COLUMN banking_subaccounts.encrypted_account_number IS 'AES-GCM encrypted account number';
COMMENT ON COLUMN banking_subaccounts.encrypted_bank_code IS 'AES-GCM encrypted bank code';  
COMMENT ON COLUMN banking_subaccounts.encryption_key_hash IS 'Hash used for encryption/decryption';

-- Create function to generate encryption key hash if it doesn't exist
CREATE OR REPLACE FUNCTION generate_encryption_key_hash(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Generate a consistent hash based on user_id and some secret
  RETURN encode(sha256((user_id::text || current_setting('app.jwt_secret', true))::bytea), 'hex');
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback to user_id if jwt_secret is not available
    RETURN user_id::text;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION generate_encryption_key_hash(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_encryption_key_hash(UUID) TO service_role;
