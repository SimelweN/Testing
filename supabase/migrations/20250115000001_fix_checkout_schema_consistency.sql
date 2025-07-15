-- Fix database schema inconsistencies for checkout system
-- This migration consolidates overlapping columns and ensures consistency

-- First, copy data from old columns to new columns if data exists
-- Update profiles table: consolidate paystack_subaccount_code -> subaccount_code
UPDATE profiles 
SET subaccount_code = paystack_subaccount_code 
WHERE paystack_subaccount_code IS NOT NULL 
  AND (subaccount_code IS NULL OR subaccount_code = '');

-- Update books table: consolidate paystack_subaccount_code -> seller_subaccount_code  
UPDATE books 
SET seller_subaccount_code = paystack_subaccount_code 
WHERE paystack_subaccount_code IS NOT NULL 
  AND (seller_subaccount_code IS NULL OR seller_subaccount_code = '');

-- Now drop the old columns (but check if they exist first)
DO $$ 
BEGIN
    -- Drop paystack_subaccount_code from profiles if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'paystack_subaccount_code'
    ) THEN
        ALTER TABLE profiles DROP COLUMN paystack_subaccount_code;
    END IF;
    
    -- Drop paystack_subaccount_code from books if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' AND column_name = 'paystack_subaccount_code'
    ) THEN
        ALTER TABLE books DROP COLUMN paystack_subaccount_code;
    END IF;
END $$;

-- Ensure orders table exists with correct structure
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_email TEXT NOT NULL,
    seller_id UUID REFERENCES auth.users(id) NOT NULL,
    amount INTEGER NOT NULL, -- in kobo (cents)
    paystack_ref TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
    
    -- Order items as JSONB array
    items JSONB NOT NULL DEFAULT '[]',
    
    -- Shipping address as JSONB
    shipping_address JSONB,
    
    -- Delivery data as JSONB
    delivery_data JSONB,
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}',
    
    -- Payment tracking
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_held BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for orders table
CREATE INDEX IF NOT EXISTS idx_orders_buyer_email ON orders(buyer_email);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_paystack_ref ON orders(paystack_ref);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies for orders table
DROP POLICY IF EXISTS "Users can view their own orders as buyer" ON orders;
CREATE POLICY "Users can view their own orders as buyer" ON orders
    FOR SELECT USING (auth.jwt() ->> 'email' = buyer_email);

DROP POLICY IF EXISTS "Users can view their own orders as seller" ON orders;
CREATE POLICY "Users can view their own orders as seller" ON orders  
    FOR SELECT USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Authenticated users can create orders" ON orders;
CREATE POLICY "Authenticated users can create orders" ON orders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their orders" ON orders;
CREATE POLICY "Users can update their orders" ON orders
    FOR UPDATE USING (
        auth.jwt() ->> 'email' = buyer_email OR 
        auth.uid() = seller_id
    );

-- Service role can manage all orders
DROP POLICY IF EXISTS "Service role can manage orders" ON orders;
CREATE POLICY "Service role can manage orders" ON orders
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW EXECUTE FUNCTION update_orders_updated_at();

-- Add missing availability column to books if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' AND column_name = 'availability'
    ) THEN
        ALTER TABLE books ADD COLUMN availability TEXT DEFAULT 'available' 
        CHECK (availability IN ('available', 'sold', 'reserved', 'unavailable'));
    END IF;
END $$;

-- Add missing sold_at column to books if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' AND column_name = 'sold_at'
    ) THEN
        ALTER TABLE books ADD COLUMN sold_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create index for book availability
CREATE INDEX IF NOT EXISTS idx_books_availability ON books(availability);

-- Add comments for clarity
COMMENT ON TABLE orders IS 'Customer orders with payment tracking and delivery information';
COMMENT ON COLUMN orders.amount IS 'Order total amount in kobo (South African cents)';
COMMENT ON COLUMN orders.items IS 'Array of ordered items with book details and quantities';
COMMENT ON COLUMN orders.shipping_address IS 'Customer shipping address as JSON object';
COMMENT ON COLUMN orders.delivery_data IS 'Delivery method, pricing, and tracking information';
COMMENT ON COLUMN orders.metadata IS 'Additional order metadata including payment splits and fees';

-- Update schema for consistency
COMMENT ON COLUMN profiles.subaccount_code IS 'Consolidated Paystack subaccount code for this seller';
COMMENT ON COLUMN books.seller_subaccount_code IS 'Consolidated Paystack subaccount code for this book sale';

-- Create a view for order summaries to make queries easier
CREATE OR REPLACE VIEW order_summaries AS
SELECT 
    o.id,
    o.buyer_email,
    o.seller_id,
    o.amount,
    o.status,
    o.paystack_ref,
    o.paid_at,
    o.created_at,
    p.name as seller_name,
    p.email as seller_email,
    jsonb_array_length(o.items) as item_count,
    o.shipping_address->>'city' as shipping_city,
    o.shipping_address->>'province' as shipping_province
FROM orders o
LEFT JOIN profiles p ON p.id = o.seller_id;

-- Grant necessary permissions
GRANT SELECT ON order_summaries TO authenticated;
GRANT SELECT ON order_summaries TO service_role;
