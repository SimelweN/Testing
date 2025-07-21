-- Apply all necessary database schema fixes for edge functions

-- 1. Add missing decline_reason column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS decline_reason TEXT;

-- 2. Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_decline_reason ON orders(decline_reason);

-- 3. Update any existing declined orders to have a default reason
UPDATE orders 
SET decline_reason = 'No reason provided' 
WHERE status = 'declined' AND decline_reason IS NULL;

-- 4. Ensure other commonly used columns exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS committed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS refund_status TEXT,
ADD COLUMN IF NOT EXISTS refund_reference TEXT,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- 5. Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id_status ON orders(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id_status ON orders(buyer_id, status);

-- 6. Ensure profiles table has all needed columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subaccount_code TEXT,
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- 7. Create refund_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS refund_transactions (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES orders(id),
  transaction_reference TEXT,
  refund_reference TEXT,
  amount DECIMAL(10,2),
  reason TEXT,
  status TEXT DEFAULT 'pending',
  paystack_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create banking_subaccounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS banking_subaccounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  business_name TEXT,
  email TEXT,
  bank_name TEXT,
  bank_code TEXT,
  account_number TEXT,
  subaccount_code TEXT UNIQUE,
  paystack_response JSONB,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Add indexes for banking tables
CREATE INDEX IF NOT EXISTS idx_refund_transactions_order_id ON refund_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_banking_subaccounts_user_id ON banking_subaccounts(user_id);
CREATE INDEX IF NOT EXISTS idx_banking_subaccounts_subaccount_code ON banking_subaccounts(subaccount_code);

COMMIT;
