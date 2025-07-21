-- Add missing decline_reason column to orders table
-- This fixes the "Could not find the 'decline_reason' column" error

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS decline_reason TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_decline_reason ON orders(decline_reason);

-- Update any existing declined orders to have a default reason
UPDATE orders 
SET decline_reason = 'No reason provided' 
WHERE status = 'declined' AND decline_reason IS NULL;
