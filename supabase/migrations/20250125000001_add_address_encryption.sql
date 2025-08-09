-- Migration: Add encrypted address columns and version tracking
-- This supports the address encryption system for security compliance

-- Add encrypted address columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS pickup_address_encrypted TEXT,
ADD COLUMN IF NOT EXISTS shipping_address_encrypted TEXT,
ADD COLUMN IF NOT EXISTS address_encryption_version INTEGER DEFAULT 1;

-- Add encrypted address columns to books table
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS pickup_address_encrypted TEXT,
ADD COLUMN IF NOT EXISTS address_encryption_version INTEGER DEFAULT 1;

-- Add encrypted address columns to orders table  
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_address_encrypted TEXT,
ADD COLUMN IF NOT EXISTS address_encryption_version INTEGER DEFAULT 1;

-- Add comments for documentation
COMMENT ON COLUMN profiles.pickup_address_encrypted IS 'AES-256-GCM encrypted pickup address as JSON string';
COMMENT ON COLUMN profiles.shipping_address_encrypted IS 'AES-256-GCM encrypted shipping address as JSON string';
COMMENT ON COLUMN profiles.address_encryption_version IS 'Encryption key version used for addresses';

COMMENT ON COLUMN books.pickup_address_encrypted IS 'AES-256-GCM encrypted pickup address as JSON string';
COMMENT ON COLUMN books.address_encryption_version IS 'Encryption key version used for address';

COMMENT ON COLUMN orders.shipping_address_encrypted IS 'AES-256-GCM encrypted shipping address as JSON string';
COMMENT ON COLUMN orders.address_encryption_version IS 'Encryption key version used for address';

-- Create indexes for performance (on non-sensitive metadata)
CREATE INDEX IF NOT EXISTS idx_profiles_address_encryption_version ON profiles(address_encryption_version);
CREATE INDEX IF NOT EXISTS idx_books_address_encryption_version ON books(address_encryption_version);
CREATE INDEX IF NOT EXISTS idx_orders_address_encryption_version ON orders(address_encryption_version);

-- Update RLS policies to restrict direct access to encrypted columns
-- Users should access encrypted data only through edge functions

-- Profiles: Users can only access their own encrypted data through functions
CREATE POLICY "profiles_encrypted_address_access" ON profiles
  FOR ALL USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Books: Owners can access their book's encrypted address through functions  
CREATE POLICY "books_encrypted_address_access" ON books
  FOR ALL USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- Orders: Users can access encrypted addresses for their orders through functions
CREATE POLICY "orders_encrypted_address_access" ON orders  
FOR ALL USING (
  auth.uid() = buyer_id OR 
  auth.uid() IN (
    SELECT seller_id FROM books b 
    WHERE b.id = ANY(
      SELECT (item->>'book_id')::uuid 
      FROM jsonb_array_elements(orders.items) AS item
    )
  )
)
WITH CHECK (
  auth.uid() = buyer_id OR 
  auth.uid() IN (
    SELECT seller_id FROM books b 
    WHERE b.id = ANY(
      SELECT (item->>'book_id')::uuid 
      FROM jsonb_array_elements(orders.items) AS item
    )
  )
);
