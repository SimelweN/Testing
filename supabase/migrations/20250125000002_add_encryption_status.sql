-- Migration: Add encryption status tracking to profiles
-- This helps track whether addresses have been successfully encrypted

-- Add encryption_status column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS encryption_status VARCHAR(20) DEFAULT 'pending';

-- Add comment for documentation
COMMENT ON COLUMN profiles.encryption_status IS 'Status of address encryption: pending, encrypted, partial, failed';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_encryption_status ON profiles(encryption_status);

-- Set existing profiles with encrypted addresses to 'encrypted' status
UPDATE profiles 
SET encryption_status = 'encrypted' 
WHERE (pickup_address_encrypted IS NOT NULL OR shipping_address_encrypted IS NOT NULL)
  AND encryption_status = 'pending';
