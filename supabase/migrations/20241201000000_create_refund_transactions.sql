-- Create refund_transactions table
CREATE TABLE IF NOT EXISTS public.refund_transactions (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    transaction_reference TEXT NOT NULL,
    refund_reference TEXT,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed')),
    paystack_response JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_refund_transactions_order_id ON public.refund_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_refund_transactions_transaction_ref ON public.refund_transactions(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_refund_transactions_refund_ref ON public.refund_transactions(refund_reference);
CREATE INDEX IF NOT EXISTS idx_refund_transactions_status ON public.refund_transactions(status);
CREATE INDEX IF NOT EXISTS idx_refund_transactions_created_at ON public.refund_transactions(created_at);

-- Add RLS policies
ALTER TABLE public.refund_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own refunds (as buyers)
CREATE POLICY "Users can view their own refunds" ON public.refund_transactions
    FOR SELECT
    USING (
        order_id IN (
            SELECT id FROM public.orders WHERE buyer_id = auth.uid()
        )
    );

-- Policy: Admin can view all refunds
CREATE POLICY "Admin can view all refunds" ON public.refund_transactions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_refund_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_refund_transactions_updated_at
    BEFORE UPDATE ON public.refund_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_refund_transactions_updated_at();

-- Add columns to orders table for refund tracking if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'refund_status') THEN
        ALTER TABLE public.orders ADD COLUMN refund_status TEXT CHECK (refund_status IN ('none', 'pending', 'processing', 'completed', 'failed'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'refund_reference') THEN
        ALTER TABLE public.orders ADD COLUMN refund_reference TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'refunded_at') THEN
        ALTER TABLE public.orders ADD COLUMN refunded_at TIMESTAMPTZ;
    END IF;
END $$;
