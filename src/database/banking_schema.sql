-- Banking and Payment System Database Schema
-- This file contains the SQL schema for the banking and payment system
-- Execute these statements in your Supabase SQL editor

-- =============================================================================
-- CORE BANKING TABLES
-- =============================================================================

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on user_id to ensure one banking account per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_banking_subaccounts_user_id 
ON banking_subaccounts(user_id);

-- Create index on subaccount_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_banking_subaccounts_code 
ON banking_subaccounts(subaccount_code);

-- =============================================================================
-- ORDER AND PAYMENT TABLES
-- =============================================================================

-- Orders Table
-- Stores all order information with payment tracking
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_email TEXT NOT NULL,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents (ZAR)
  paystack_ref TEXT UNIQUE NOT NULL, -- Paystack transaction reference
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'collected', 'payout_completed', 'cancelled')),
  payment_held BOOLEAN DEFAULT false, -- Escrow system flag
  collection_deadline TIMESTAMP WITH TIME ZONE,
  collection_confirmed_at TIMESTAMP WITH TIME ZONE,
  seller_notified_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  shipping_address JSONB, -- Shipping address details
  metadata JSONB, -- Books, delivery method, special instructions
  payment_verification JSONB, -- Paystack verification response
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_email ON orders(buyer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_paystack_ref ON orders(paystack_ref);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- =============================================================================
-- PAYOUT TRACKING
-- =============================================================================

-- Payout Transactions Table
-- Tracks seller payouts and platform commissions
CREATE TABLE IF NOT EXISTS payout_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL, -- Net amount to seller (ZAR)
  gross_amount DECIMAL(10,2) NOT NULL, -- Original amount before fees (ZAR)
  platform_fee DECIMAL(10,2) NOT NULL, -- Commission taken (ZAR)
  reference TEXT UNIQUE NOT NULL, -- Payout reference
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  paystack_response JSONB, -- Paystack transfer response
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for payout tracking
CREATE INDEX IF NOT EXISTS idx_payout_transactions_seller_id ON payout_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_payout_transactions_order_id ON payout_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payout_transactions_status ON payout_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payout_transactions_created_at ON payout_transactions(created_at DESC);

-- =============================================================================
-- ENHANCED BOOKS TABLE
-- =============================================================================

-- Add subaccount_code to books table for payment routing
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS subaccount_code TEXT REFERENCES banking_subaccounts(subaccount_code);

-- Create index for subaccount lookups
CREATE INDEX IF NOT EXISTS idx_books_subaccount_code ON books(subaccount_code);

-- =============================================================================
-- ENHANCED PROFILES TABLE
-- =============================================================================

-- Add pickup address to profiles for seller requirements
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS pickup_address JSONB;

-- Example pickup_address structure:
-- {
--   "street_address": "123 Main Street",
--   "suburb": "Gardens", 
--   "city": "Cape Town",
--   "province": "Western Cape",
--   "postal_code": "8001",
--   "special_instructions": "Ring doorbell twice"
-- }

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE banking_subaccounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_transactions ENABLE ROW LEVEL SECURITY;

-- Banking Subaccounts Policies
-- Users can only view/edit their own banking details
CREATE POLICY "Users can view own banking details" ON banking_subaccounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own banking details" ON banking_subaccounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own banking details" ON banking_subaccounts
  FOR UPDATE USING (auth.uid() = user_id);

-- Orders Policies
-- Buyers can view orders they placed, sellers can view orders for their books
CREATE POLICY "Users can view relevant orders" ON orders
  FOR SELECT USING (
    auth.uid() = seller_id OR 
    buyer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Only authenticated users can create orders
CREATE POLICY "Authenticated users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only sellers can update their orders (for status changes)
CREATE POLICY "Sellers can update their orders" ON orders
  FOR UPDATE USING (auth.uid() = seller_id);

-- Payout Transactions Policies
-- Sellers can only view their own payouts
CREATE POLICY "Sellers can view own payouts" ON payout_transactions
  FOR SELECT USING (auth.uid() = seller_id);

-- Only system can insert payout records (via service role)
CREATE POLICY "Service role can manage payouts" ON payout_transactions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_banking_subaccounts_updated_at 
  BEFORE UPDATE ON banking_subaccounts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically link books to subaccount when banking is set up
CREATE OR REPLACE FUNCTION link_books_to_subaccount()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all books for this seller to use the new subaccount
  UPDATE books 
  SET subaccount_code = NEW.subaccount_code 
  WHERE seller_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-link books when subaccount is created
CREATE TRIGGER link_books_on_subaccount_create
  AFTER INSERT ON banking_subaccounts
  FOR EACH ROW EXECUTE FUNCTION link_books_to_subaccount();

-- =============================================================================
-- VIEWS FOR REPORTING
-- =============================================================================

-- View for seller earnings summary
CREATE OR REPLACE VIEW seller_earnings_summary AS
SELECT 
  p.id as seller_id,
  p.full_name as seller_name,
  COUNT(o.id) as total_orders,
  COUNT(CASE WHEN o.status = 'completed' THEN 1 END) as completed_orders,
  COALESCE(SUM(CASE WHEN o.status = 'completed' THEN pt.amount END), 0) as total_earnings,
  COALESCE(SUM(CASE WHEN o.status = 'completed' THEN pt.platform_fee END), 0) as total_fees_paid,
  COALESCE(SUM(CASE WHEN o.status = 'completed' THEN pt.gross_amount END), 0) as total_gross_sales
FROM profiles p
LEFT JOIN orders o ON p.id = o.seller_id
LEFT JOIN payout_transactions pt ON o.id = pt.order_id
GROUP BY p.id, p.full_name;

-- View for monthly earnings by seller
CREATE OR REPLACE VIEW monthly_seller_earnings AS
SELECT 
  o.seller_id,
  DATE_TRUNC('month', o.created_at) as month,
  COUNT(o.id) as orders_count,
  COALESCE(SUM(pt.amount), 0) as net_earnings,
  COALESCE(SUM(pt.platform_fee), 0) as platform_fees,
  COALESCE(SUM(pt.gross_amount), 0) as gross_sales
FROM orders o
LEFT JOIN payout_transactions pt ON o.id = pt.order_id
WHERE o.status = 'payout_completed'
GROUP BY o.seller_id, DATE_TRUNC('month', o.created_at)
ORDER BY month DESC;

-- =============================================================================
-- SAMPLE DATA (FOR DEVELOPMENT)
-- =============================================================================

-- This section includes sample data for development and testing
-- Remove or comment out for production deployment

/*
-- Sample banking subaccount
INSERT INTO banking_subaccounts (user_id, subaccount_code, business_name, bank_name, account_number, bank_code, email)
VALUES (
  'sample-user-id', 
  'ACCT_sample123', 
  'Sample Book Store', 
  'First National Bank (FNB)', 
  '1234567890', 
  '250655', 
  'seller@example.com'
);

-- Sample order
INSERT INTO orders (buyer_email, seller_id, amount, paystack_ref, status, shipping_address, metadata)
VALUES (
  'buyer@example.com',
  'sample-seller-id',
  5000, -- R50.00 in cents
  'PS_sample_ref_123',
  'paid',
  '{"fullName": "John Doe", "addressLine1": "123 Main St", "city": "Cape Town", "province": "Western Cape", "postalCode": "8001", "phoneNumber": "+27123456789"}',
  '{"books": [{"id": "book1", "title": "Sample Book", "price": 5000, "quantity": 1}], "delivery_method": "pickup"}'
);
*/

-- =============================================================================
-- MAINTENANCE QUERIES
-- =============================================================================

-- Clean up old pending orders (older than 48 hours)
-- Run this periodically via cron job or scheduled function
/*
UPDATE orders 
SET status = 'cancelled', 
    cancellation_reason = 'Payment timeout',
    cancelled_at = NOW()
WHERE status = 'pending' 
  AND created_at < NOW() - INTERVAL '48 hours';
*/

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Additional composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_seller_status_created 
ON orders(seller_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_created 
ON orders(status, created_at DESC);

-- Index for seller earnings queries
CREATE INDEX IF NOT EXISTS idx_payout_transactions_seller_processed 
ON payout_transactions(seller_id, processed_at DESC) 
WHERE status = 'completed';

-- =============================================================================
-- COMMENTS AND DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE banking_subaccounts IS 'Stores user banking details and Paystack subaccount codes for payment processing';
COMMENT ON TABLE orders IS 'Main orders table with payment tracking and escrow functionality';
COMMENT ON TABLE payout_transactions IS 'Tracks all seller payouts and platform commission records';

COMMENT ON COLUMN orders.payment_held IS 'When true, payment is held in escrow until collection confirmed';
COMMENT ON COLUMN orders.amount IS 'Order amount in cents (ZAR) - multiply by 100 to get Rand value';
COMMENT ON COLUMN payout_transactions.amount IS 'Net amount paid to seller after platform commission (ZAR)';
