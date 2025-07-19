-- Add transfer recipient and transfer management tables for Paystack Transfer API integration

-- Create transfer_recipients table
CREATE TABLE IF NOT EXISTS transfer_recipients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_code TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('nuban', 'mobile_money', 'basa')),
    currency TEXT NOT NULL DEFAULT 'ZAR',
    account_number TEXT NOT NULL,
    account_name TEXT,
    bank_code TEXT NOT NULL,
    bank_name TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMP WITH TIME ZONE,
    paystack_data JSONB
);

-- Create transfers table
CREATE TABLE IF NOT EXISTS transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transfer_code TEXT UNIQUE NOT NULL,
    reference TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    recipient_code TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'ZAR',
    source TEXT NOT NULL DEFAULT 'balance',
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'reversed')),
    failure_reason TEXT,
    bulk_transfer BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    paystack_data JSONB
);

-- Add comments to document the tables
COMMENT ON TABLE transfer_recipients IS 'Paystack transfer recipients for sending money to bank accounts';
COMMENT ON TABLE transfers IS 'Paystack transfers for tracking money transfers to recipients';

COMMENT ON COLUMN transfer_recipients.recipient_code IS 'Unique Paystack recipient code identifier';
COMMENT ON COLUMN transfer_recipients.type IS 'Type of recipient: nuban (bank account), mobile_money, or basa';
COMMENT ON COLUMN transfer_recipients.paystack_data IS 'Full Paystack API response data for this recipient';

COMMENT ON COLUMN transfers.transfer_code IS 'Unique Paystack transfer code identifier';
COMMENT ON COLUMN transfers.reference IS 'Unique reference for tracking the transfer';
COMMENT ON COLUMN transfers.amount IS 'Transfer amount in smallest currency unit (kobo/cents)';
COMMENT ON COLUMN transfers.source IS 'Source of funds (balance, etc.)';
COMMENT ON COLUMN transfers.bulk_transfer IS 'Whether this transfer was part of a bulk transfer';
COMMENT ON COLUMN transfers.paystack_data IS 'Full Paystack API response data for this transfer';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transfer_recipients_user_id ON transfer_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_transfer_recipients_recipient_code ON transfer_recipients(recipient_code);
CREATE INDEX IF NOT EXISTS idx_transfer_recipients_active ON transfer_recipients(active);

CREATE INDEX IF NOT EXISTS idx_transfers_user_id ON transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_transfers_order_id ON transfers(order_id);
CREATE INDEX IF NOT EXISTS idx_transfers_transfer_code ON transfers(transfer_code);
CREATE INDEX IF NOT EXISTS idx_transfers_reference ON transfers(reference);
CREATE INDEX IF NOT EXISTS idx_transfers_recipient_code ON transfers(recipient_code);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON transfers(created_at);

-- Add foreign key relationship between transfers and transfer_recipients
ALTER TABLE transfers
ADD CONSTRAINT fk_transfers_recipient_code 
FOREIGN KEY (recipient_code) REFERENCES transfer_recipients(recipient_code)
ON DELETE RESTRICT;

-- Enable Row Level Security
ALTER TABLE transfer_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transfer_recipients
CREATE POLICY "Users can view their own recipients" ON transfer_recipients
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recipients" ON transfer_recipients
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipients" ON transfer_recipients
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all recipients" ON transfer_recipients
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Service role can manage all recipients" ON transfer_recipients
FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for transfers
CREATE POLICY "Users can view their own transfers" ON transfers
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view transfers for their orders" ON transfers
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = transfers.order_id 
        AND orders.seller_id = auth.uid()
    )
);

CREATE POLICY "Users cannot create transfers directly" ON transfers
FOR INSERT WITH CHECK (false); -- Only service role can create transfers

CREATE POLICY "Admins can manage all transfers" ON transfers
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Service role can manage all transfers" ON transfers
FOR ALL USING (auth.role() = 'service_role');

-- Create views for easy analysis
CREATE OR REPLACE VIEW transfer_summary AS
SELECT 
    t.id,
    t.transfer_code,
    t.reference,
    t.amount,
    t.currency,
    t.status,
    t.reason,
    t.created_at,
    t.completed_at,
    tr.name as recipient_name,
    tr.bank_name,
    tr.account_number,
    p.name as user_name,
    p.email as user_email
FROM transfers t
LEFT JOIN transfer_recipients tr ON t.recipient_code = tr.recipient_code
LEFT JOIN profiles p ON t.user_id = p.id;

-- Grant necessary permissions
GRANT SELECT ON transfer_summary TO authenticated;
GRANT SELECT ON transfer_summary TO service_role;

-- Function to get transfer statistics
CREATE OR REPLACE FUNCTION get_transfer_stats(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
    total_transfers BIGINT,
    successful_transfers BIGINT,
    failed_transfers BIGINT,
    pending_transfers BIGINT,
    total_amount_transferred DECIMAL,
    total_fees DECIMAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'success'),
        COUNT(*) FILTER (WHERE status = 'failed'),
        COUNT(*) FILTER (WHERE status = 'pending'),
        COALESCE(SUM(amount) FILTER (WHERE status = 'success'), 0) / 100.0,
        -- Assuming 0.5% transfer fee
        COALESCE(SUM(amount) FILTER (WHERE status = 'success'), 0) * 0.005 / 100.0
    FROM transfers 
    WHERE (user_uuid IS NULL OR user_id = user_uuid);
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_transfer_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_transfer_stats(UUID) TO service_role;

-- Function to create transfer recipient with validation
CREATE OR REPLACE FUNCTION create_transfer_recipient(
    p_name TEXT,
    p_account_number TEXT,
    p_bank_code TEXT,
    p_user_id UUID DEFAULT auth.uid(),
    p_type TEXT DEFAULT 'nuban',
    p_currency TEXT DEFAULT 'ZAR'
)
RETURNS TABLE (
    recipient_id UUID,
    recipient_code TEXT,
    success BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_recipient_code TEXT;
    new_recipient_id UUID;
BEGIN
    -- Validate inputs
    IF p_name IS NULL OR LENGTH(TRIM(p_name)) = 0 THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, false, 'Recipient name is required';
        RETURN;
    END IF;
    
    IF p_account_number IS NULL OR LENGTH(TRIM(p_account_number)) = 0 THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, false, 'Account number is required';
        RETURN;
    END IF;
    
    IF p_bank_code IS NULL OR LENGTH(TRIM(p_bank_code)) = 0 THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, false, 'Bank code is required';
        RETURN;
    END IF;
    
    -- Check if recipient already exists for this user and account
    SELECT recipient_code INTO new_recipient_code
    FROM transfer_recipients 
    WHERE user_id = p_user_id 
    AND account_number = p_account_number 
    AND bank_code = p_bank_code
    AND active = true;
    
    IF new_recipient_code IS NOT NULL THEN
        SELECT id INTO new_recipient_id
        FROM transfer_recipients 
        WHERE recipient_code = new_recipient_code;
        
        RETURN QUERY SELECT new_recipient_id, new_recipient_code, true, 'Recipient already exists';
        RETURN;
    END IF;
    
    -- Generate temporary recipient code (should be replaced by Paystack response)
    new_recipient_code := 'RCP_' || substr(md5(random()::text), 1, 12);
    
    -- Insert recipient
    INSERT INTO transfer_recipients (
        recipient_code, user_id, name, type, currency, 
        account_number, bank_code, active
    ) VALUES (
        new_recipient_code, p_user_id, p_name, p_type, p_currency,
        p_account_number, p_bank_code, true
    ) RETURNING id INTO new_recipient_id;
    
    RETURN QUERY SELECT new_recipient_id, new_recipient_code, true, 'Recipient created successfully';
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_transfer_recipient(TEXT, TEXT, TEXT, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_transfer_recipient(TEXT, TEXT, TEXT, UUID, TEXT, TEXT) TO service_role;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transfer_recipients_updated_at BEFORE UPDATE
    ON transfer_recipients FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
