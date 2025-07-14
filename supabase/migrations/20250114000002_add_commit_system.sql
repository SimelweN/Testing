-- Create commit system tables
CREATE TABLE IF NOT EXISTS sale_commitments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL,
    buyer_id UUID NOT NULL,
    purchase_amount DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Commit tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'committed', 'declined', 'expired', 'completed', 'refunded')),
    committed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Payment tracking
    payment_reference TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'released', 'refunded')),
    
    -- Delivery tracking
    delivery_confirmed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sale_commitments_seller_id ON sale_commitments(seller_id);
CREATE INDEX IF NOT EXISTS idx_sale_commitments_buyer_id ON sale_commitments(buyer_id);
CREATE INDEX IF NOT EXISTS idx_sale_commitments_book_id ON sale_commitments(book_id);
CREATE INDEX IF NOT EXISTS idx_sale_commitments_status ON sale_commitments(status);
CREATE INDEX IF NOT EXISTS idx_sale_commitments_expires_at ON sale_commitments(expires_at);

-- Create notifications table for commit reminders
CREATE TABLE IF NOT EXISTS commitment_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    commitment_id UUID NOT NULL REFERENCES sale_commitments(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('reminder_24h', 'reminder_6h', 'reminder_1h', 'expired', 'committed')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to automatically expire commitments
CREATE OR REPLACE FUNCTION expire_old_commitments()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update expired commitments
    UPDATE sale_commitments 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending' 
    AND expires_at < NOW();
    
    -- Also mark books as available again
    UPDATE books 
    SET sold = false
    WHERE id IN (
        SELECT book_id 
        FROM sale_commitments 
        WHERE status = 'expired'
    );
END;
$$;

-- Function to create a sale commitment
CREATE OR REPLACE FUNCTION create_sale_commitment(
    p_book_id UUID,
    p_buyer_id UUID,
    p_purchase_amount DECIMAL,
    p_delivery_fee DECIMAL DEFAULT 0,
    p_payment_reference TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_seller_id UUID;
    v_commitment_id UUID;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get seller_id from book
    SELECT seller_id INTO v_seller_id
    FROM books 
    WHERE id = p_book_id AND sold = false;
    
    IF v_seller_id IS NULL THEN
        RAISE EXCEPTION 'Book not found or already sold';
    END IF;
    
    -- Set expiration to 48 hours from now
    v_expires_at := NOW() + INTERVAL '48 hours';
    
    -- Create the commitment
    INSERT INTO sale_commitments (
        book_id, seller_id, buyer_id, purchase_amount, 
        delivery_fee, total_amount, expires_at, payment_reference
    ) VALUES (
        p_book_id, v_seller_id, p_buyer_id, p_purchase_amount,
        p_delivery_fee, p_purchase_amount + p_delivery_fee, v_expires_at, p_payment_reference
    ) RETURNING id INTO v_commitment_id;
    
    -- Mark book as sold (pending commitment)
    UPDATE books SET sold = true WHERE id = p_book_id;
    
    RETURN v_commitment_id;
END;
$$;

-- Function to commit to a sale
CREATE OR REPLACE FUNCTION commit_to_sale(
    p_commitment_id UUID,
    p_seller_id UUID
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Update commitment status
    UPDATE sale_commitments 
    SET status = 'committed', 
        committed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_commitment_id 
    AND seller_id = p_seller_id 
    AND status = 'pending'
    AND expires_at > NOW();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN v_count > 0;
END;
$$;

-- Function to decline a sale
CREATE OR REPLACE FUNCTION decline_sale(
    p_commitment_id UUID,
    p_seller_id UUID
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
    v_book_id UUID;
BEGIN
    -- Get book_id and update commitment
    UPDATE sale_commitments 
    SET status = 'declined',
        updated_at = NOW()
    WHERE id = p_commitment_id 
    AND seller_id = p_seller_id 
    AND status = 'pending'
    RETURNING book_id INTO v_book_id;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    -- Mark book as available again
    IF v_count > 0 THEN
        UPDATE books SET sold = false WHERE id = v_book_id;
    END IF;
    
    RETURN v_count > 0;
END;
$$;

-- RLS Policies
ALTER TABLE sale_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitment_notifications ENABLE ROW LEVEL SECURITY;

-- Sellers can see their own commitments
CREATE POLICY "Sellers can view their commitments" ON sale_commitments
    FOR SELECT USING (seller_id = auth.uid());

-- Buyers can see their own commitments
CREATE POLICY "Buyers can view their commitments" ON sale_commitments
    FOR SELECT USING (buyer_id = auth.uid());

-- Only authenticated users can create commitments
CREATE POLICY "Authenticated users can create commitments" ON sale_commitments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Sellers can update their own commitments
CREATE POLICY "Sellers can update their commitments" ON sale_commitments
    FOR UPDATE USING (seller_id = auth.uid());

-- Comments
COMMENT ON TABLE sale_commitments IS 'Tracks 48-hour seller commitment system for book sales';
COMMENT ON COLUMN sale_commitments.expires_at IS '48 hours from creation - seller must commit by this time';
COMMENT ON COLUMN sale_commitments.payment_reference IS 'Payment gateway reference for tracking';
COMMENT ON FUNCTION create_sale_commitment IS 'Creates a new sale commitment when a book is purchased';
COMMENT ON FUNCTION commit_to_sale IS 'Allows seller to commit to fulfilling the sale';
COMMENT ON FUNCTION decline_sale IS 'Allows seller to decline the sale, makes book available again';
