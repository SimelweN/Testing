-- Essential Database Tables for Paystack Functionality
-- Run these SQL commands in your Supabase SQL Editor

-- 1. Profiles table (if not exists)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    bio TEXT,
    banking_info JSONB,
    paystack_subaccount_code TEXT,
    is_admin BOOLEAN DEFAULT false,
    pickup_address JSONB,
    shipping_address JSONB,
    banking_verified BOOLEAN DEFAULT false,
    addresses_same BOOLEAN DEFAULT false,
    aps_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Books table
CREATE TABLE IF NOT EXISTS public.books (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category TEXT,
    condition TEXT,
    description TEXT,
    image_url TEXT,
    seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    sold BOOLEAN DEFAULT false,
    availability TEXT DEFAULT 'available',
    seller_subaccount_code TEXT,
    requires_banking_setup BOOLEAN DEFAULT false,
    grade TEXT,
    university_year TEXT,
    province TEXT,
    buyer_id UUID REFERENCES public.profiles(id),
    sold_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY, -- Using TEXT for custom order IDs like ORD_123
    buyer_id UUID REFERENCES public.profiles(id),
    seller_id UUID REFERENCES public.profiles(id),
    buyer_email TEXT NOT NULL,
    seller_email TEXT,
    buyer_name TEXT,
    seller_name TEXT,
    status TEXT DEFAULT 'pending_commit',
    total_amount DECIMAL(10,2) NOT NULL,
    amount INTEGER, -- Legacy field for compatibility
    paystack_ref TEXT,
    payment_reference TEXT,
    payment_status TEXT DEFAULT 'pending',
    items JSONB, -- Array of book items
    shipping_address JSONB,
    delivery_address JSONB, -- Legacy field
    delivery_data JSONB,
    metadata JSONB,
    payment_data JSONB,
    expires_at TIMESTAMP WITH TIME ZONE,
    commit_deadline TIMESTAMP WITH TIME ZONE, -- Legacy field
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_held BOOLEAN DEFAULT false,
    delivery_status TEXT,
    courier_booking_id TEXT,
    courier_service TEXT,
    refund_status TEXT,
    refund_reference TEXT,
    refunded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Payment Transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id TEXT REFERENCES public.orders(id),
    paystack_reference TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL,
    payment_method TEXT,
    currency TEXT DEFAULT 'ZAR',
    customer_email TEXT NOT NULL,
    gateway_response JSONB,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Banking Subaccounts table
CREATE TABLE IF NOT EXISTS public.banking_subaccounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subaccount_code TEXT UNIQUE NOT NULL,
    business_name TEXT NOT NULL,
    bank_code TEXT NOT NULL,
    account_number TEXT NOT NULL,
    percentage_charge DECIMAL(5,2) DEFAULT 0.00,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Refund Transactions table
CREATE TABLE IF NOT EXISTS public.refund_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id TEXT REFERENCES public.orders(id),
    payment_reference TEXT NOT NULL,
    refund_reference TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    status TEXT NOT NULL,
    gateway_response JSONB,
    initiated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Transfers table (for seller payouts)
CREATE TABLE IF NOT EXISTS public.transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    order_id TEXT REFERENCES public.orders(id),
    transfer_code TEXT UNIQUE,
    reference TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL,
    recipient_code TEXT,
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    order_id TEXT REFERENCES public.orders(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banking_subaccounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (you may need to adjust based on your requirements)

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Books: Anyone can read, only sellers can modify their own books
CREATE POLICY "Anyone can view books" ON public.books
    FOR SELECT USING (true);

CREATE POLICY "Users can create books" ON public.books
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own books" ON public.books
    FOR UPDATE USING (auth.uid() = seller_id);

-- Orders: Buyers and sellers can view their own orders
CREATE POLICY "Users can view own orders as buyer" ON public.orders
    FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Users can view own orders as seller" ON public.orders
    FOR SELECT USING (auth.uid() = seller_id);

-- Banking: Users can manage their own banking info
CREATE POLICY "Users can view own banking" ON public.banking_subaccounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own banking" ON public.banking_subaccounts
    FOR ALL USING (auth.uid() = user_id);

-- Notifications: Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_books_seller_id ON public.books(seller_id);
CREATE INDEX IF NOT EXISTS idx_books_sold ON public.books(sold);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_paystack_reference ON public.payment_transactions(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_banking_subaccounts_user_id ON public.banking_subaccounts(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- Create functions for updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON public.books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON public.payment_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banking_subaccounts_updated_at BEFORE UPDATE ON public.banking_subaccounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refund_transactions_updated_at BEFORE UPDATE ON public.refund_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON public.transfers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
