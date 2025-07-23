-- ==============================================
-- SELLER PAYOUT SYSTEM DATABASE SCHEMA
-- ==============================================
-- This schema creates all necessary tables for a complete seller payout system
-- Execute this in your Supabase SQL editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- 1. SELLER PAYOUTS TABLE
-- ==============================================
-- Tracks payout requests and their status
CREATE TABLE IF NOT EXISTS seller_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'ZAR',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'processing', 'completed', 'failed')),
    
    -- Request details
    request_date TIMESTAMPTZ DEFAULT now(),
    requested_by UUID REFERENCES auth.users(id),
    
    -- Admin review
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    -- Banking details at time of payout
    bank_name VARCHAR(100),
    bank_code VARCHAR(20),
    account_number VARCHAR(50),
    account_holder_name VARCHAR(100),
    
    -- Transaction tracking
    paystack_transfer_code VARCHAR(100),
    paystack_response JSONB,
    
    -- Fees and breakdown
    platform_fee DECIMAL(10,2) DEFAULT 0,
    transaction_fee DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2) NOT NULL,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================
-- 2. PAYOUT ITEMS TABLE
-- ==============================================
-- Links individual book sales to payout requests
CREATE TABLE IF NOT EXISTS payout_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payout_id UUID NOT NULL REFERENCES seller_payouts(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL,
    book_id UUID NOT NULL,
    book_title VARCHAR(255),
    sale_amount DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    seller_amount DECIMAL(10,2) NOT NULL,
    sale_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================
-- 3. TRANSACTIONS TABLE (Enhanced)
-- ==============================================
-- Core transactions table for tracking all book sales
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Order details
    order_id VARCHAR(100) UNIQUE,
    paystack_reference VARCHAR(100) UNIQUE,
    
    -- Parties involved
    buyer_id UUID REFERENCES auth.users(id),
    seller_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Book details
    book_id UUID NOT NULL,
    book_title VARCHAR(255),
    book_author VARCHAR(255),
    
    -- Financial details
    book_price DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    platform_commission DECIMAL(10,2) NOT NULL,
    seller_amount DECIMAL(10,2) NOT NULL,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'completed', 'cancelled', 'refunded')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    
    -- Fulfillment
    collection_status VARCHAR(20) DEFAULT 'pending' CHECK (collection_status IN ('pending', 'collected', 'returned')),
    collection_date TIMESTAMPTZ,
    collection_deadline TIMESTAMPTZ,
    
    -- Payout tracking
    payout_id UUID REFERENCES seller_payouts(id),
    payout_status VARCHAR(20) DEFAULT 'pending' CHECK (payout_status IN ('pending', 'included', 'paid')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    paid_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- ==============================================
-- 4. COMMISSION SETTINGS TABLE
-- ==============================================
-- Configurable commission rates
CREATE TABLE IF NOT EXISTS commission_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) DEFAULT 'default',
    commission_rate DECIMAL(5,4) DEFAULT 0.1000 CHECK (commission_rate >= 0 AND commission_rate <= 1),
    delivery_fee_retention_rate DECIMAL(5,4) DEFAULT 1.0000 CHECK (delivery_fee_retention_rate >= 0 AND delivery_fee_retention_rate <= 1),
    minimum_payout_amount DECIMAL(10,2) DEFAULT 50.00,
    
    -- Effective dates
    effective_from TIMESTAMPTZ DEFAULT now(),
    effective_until TIMESTAMPTZ,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================
-- 5. BANKING DETAILS TABLE (Enhanced)
-- ==============================================
-- Enhanced version of existing banking_subaccounts
CREATE TABLE IF NOT EXISTS banking_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Bank account details
    bank_name VARCHAR(100) NOT NULL,
    bank_code VARCHAR(20) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_holder_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) DEFAULT 'current' CHECK (account_type IN ('current', 'savings')),
    
    -- Paystack integration
    subaccount_code VARCHAR(100) UNIQUE,
    paystack_customer_code VARCHAR(100),
    paystack_recipient_code VARCHAR(100),
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMPTZ,
    verification_method VARCHAR(50),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure one active banking detail per user
    UNIQUE(user_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- ==============================================
-- 6. PAYOUT NOTIFICATIONS TABLE
-- ==============================================
-- Track notifications sent for payouts
CREATE TABLE IF NOT EXISTS payout_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payout_id UUID NOT NULL REFERENCES seller_payouts(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id),
    
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('request_submitted', 'approved', 'denied', 'processing', 'completed', 'failed')),
    channel VARCHAR(20) DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'push', 'in_app')),
    
    -- Content
    subject VARCHAR(255),
    message TEXT,
    
    -- Delivery tracking
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Seller payouts indexes
CREATE INDEX IF NOT EXISTS idx_seller_payouts_seller_id ON seller_payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_status ON seller_payouts(status);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_request_date ON seller_payouts(request_date);

-- Payout items indexes
CREATE INDEX IF NOT EXISTS idx_payout_items_payout_id ON payout_items(payout_id);
CREATE INDEX IF NOT EXISTS idx_payout_items_transaction_id ON payout_items(transaction_id);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_payout_status ON transactions(payout_status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_paystack_ref ON transactions(paystack_reference);

-- Banking details indexes
CREATE INDEX IF NOT EXISTS idx_banking_details_user_id ON banking_details(user_id);
CREATE INDEX IF NOT EXISTS idx_banking_details_subaccount_code ON banking_details(subaccount_code);
CREATE INDEX IF NOT EXISTS idx_banking_details_status ON banking_details(status);

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE seller_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE banking_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_notifications ENABLE ROW LEVEL SECURITY;

-- Seller payouts policies
CREATE POLICY "Users can view own payouts" ON seller_payouts FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Users can create own payouts" ON seller_payouts FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Users can update own pending payouts" ON seller_payouts FOR UPDATE USING (auth.uid() = seller_id AND status = 'pending');

-- Admin policies for seller payouts
CREATE POLICY "Admins can manage all payouts" ON seller_payouts FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND (role = 'admin' OR role = 'super_admin')
    )
);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = seller_id OR auth.uid() = buyer_id);
CREATE POLICY "System can manage transactions" ON transactions FOR ALL USING (true); -- Managed by backend

-- Banking details policies
CREATE POLICY "Users can manage own banking details" ON banking_details FOR ALL USING (auth.uid() = user_id);

-- Payout items policies
CREATE POLICY "Users can view own payout items" ON payout_items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM seller_payouts 
        WHERE id = payout_items.payout_id 
        AND seller_id = auth.uid()
    )
);

-- Commission settings (admin only)
CREATE POLICY "Admins can manage commission settings" ON commission_settings FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND (role = 'admin' OR role = 'super_admin')
    )
);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON payout_notifications FOR SELECT USING (auth.uid() = recipient_id);

-- ==============================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ==============================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_seller_payouts_updated_at BEFORE UPDATE ON seller_payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commission_settings_updated_at BEFORE UPDATE ON commission_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_banking_details_updated_at BEFORE UPDATE ON banking_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- INITIAL DATA
-- ==============================================

-- Insert default commission settings
INSERT INTO commission_settings (category, commission_rate, delivery_fee_retention_rate, minimum_payout_amount)
VALUES ('default', 0.1000, 1.0000, 50.00)
ON CONFLICT DO NOTHING;

-- ==============================================
-- HELPFUL VIEWS
-- ==============================================

-- View for seller earnings summary
CREATE OR REPLACE VIEW seller_earnings_summary AS
SELECT 
    seller_id,
    COUNT(*) as total_sales,
    SUM(seller_amount) as total_earnings,
    SUM(platform_commission) as total_commission_paid,
    SUM(CASE WHEN payout_status = 'pending' THEN seller_amount ELSE 0 END) as pending_payout,
    SUM(CASE WHEN payout_status = 'paid' THEN seller_amount ELSE 0 END) as paid_out,
    MAX(created_at) as last_sale_date
FROM transactions 
WHERE status = 'completed'
GROUP BY seller_id;

-- View for admin payout management
CREATE OR REPLACE VIEW admin_payout_summary AS
SELECT 
    sp.id,
    sp.seller_id,
    p.name as seller_name,
    p.email as seller_email,
    sp.amount,
    sp.status,
    sp.request_date,
    sp.reviewed_by,
    sp.reviewed_at,
    COUNT(pi.id) as item_count,
    bd.bank_name,
    bd.account_number
FROM seller_payouts sp
LEFT JOIN profiles p ON sp.seller_id = p.id
LEFT JOIN payout_items pi ON sp.id = pi.payout_id
LEFT JOIN banking_details bd ON sp.seller_id = bd.user_id AND bd.status = 'active'
GROUP BY sp.id, p.name, p.email, bd.bank_name, bd.account_number
ORDER BY sp.request_date DESC;

-- ==============================================
-- NOTIFICATION
-- ==============================================

-- Show tables created
DO $$
BEGIN
    RAISE NOTICE 'Seller Payout System Database Schema Created Successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '✅ seller_payouts - Track payout requests';
    RAISE NOTICE '✅ payout_items - Link sales to payouts';
    RAISE NOTICE '✅ transactions - Enhanced transaction tracking';
    RAISE NOTICE '✅ commission_settings - Configurable rates';
    RAISE NOTICE '✅ banking_details - Enhanced banking info';
    RAISE NOTICE '✅ payout_notifications - Notification tracking';
    RAISE NOTICE '';
    RAISE NOTICE 'Views created:';
    RAISE NOTICE '✅ seller_earnings_summary - Seller earnings overview';
    RAISE NOTICE '✅ admin_payout_summary - Admin management view';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Update your environment variables';
    RAISE NOTICE '2. Deploy edge functions for payout processing';
    RAISE NOTICE '3. Test the seller payout workflow';
END $$;
