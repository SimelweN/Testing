-- Create payout_requests table
CREATE TABLE IF NOT EXISTS payout_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID NOT NULL,
    seller_name TEXT NOT NULL,
    seller_email TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    order_count INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'denied')) DEFAULT 'pending',
    recipient_code TEXT,
    order_ids UUID[] NOT NULL,
    payment_breakdown JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID,
    notes TEXT
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payout_requests_seller_id ON payout_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_created_at ON payout_requests(created_at);

-- Add RLS policies
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- Policy for admin access (full access)
CREATE POLICY "Admin can manage all payout requests" ON payout_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy for sellers to view their own payout requests
CREATE POLICY "Sellers can view their own payout requests" ON payout_requests
    FOR SELECT USING (seller_id = auth.uid());

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payout_requests_updated_at 
    BEFORE UPDATE ON payout_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
