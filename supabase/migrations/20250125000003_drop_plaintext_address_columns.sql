-- Migration: Drop plaintext address columns for security
-- This removes all plaintext address storage, keeping only encrypted versions

-- Drop plaintext address columns from profiles table
ALTER TABLE profiles 
DROP COLUMN IF EXISTS pickup_address,
DROP COLUMN IF EXISTS shipping_address;

-- Drop plaintext address columns from books table
ALTER TABLE books 
DROP COLUMN IF EXISTS pickup_address;

-- Drop plaintext address columns from orders table  
ALTER TABLE orders 
DROP COLUMN IF EXISTS shipping_address;

-- Add comments for documentation
COMMENT ON TABLE profiles IS 'User profiles with encrypted address storage only';
COMMENT ON TABLE books IS 'Book listings with encrypted pickup address storage only';
COMMENT ON TABLE orders IS 'Orders with encrypted shipping address storage only';

-- Update any remaining indexes that might reference dropped columns
-- (This is safe to run even if indexes don't exist)
DROP INDEX IF EXISTS idx_profiles_pickup_address;
DROP INDEX IF EXISTS idx_profiles_shipping_address;
DROP INDEX IF EXISTS idx_books_pickup_address;
DROP INDEX IF EXISTS idx_orders_shipping_address;
