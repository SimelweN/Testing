-- Add split_code support to payment tables for Paystack Split API integration

-- Add split_code column to payment_transactions table
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS split_code TEXT,
ADD COLUMN IF NOT EXISTS items JSONB,
ADD COLUMN IF NOT EXISTS shipping_address JSONB;

-- Add comment to document the split_code column
COMMENT ON COLUMN payment_transactions.split_code IS 'Paystack split code used for this transaction';
COMMENT ON COLUMN payment_transactions.items IS 'JSON array of items being purchased';
COMMENT ON COLUMN payment_transactions.shipping_address IS 'JSON object containing shipping address details';

-- Update payment_splits table to support Paystack Split API
ALTER TABLE payment_splits 
ADD COLUMN IF NOT EXISTS split_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('percentage', 'flat')),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'ZAR',
ADD COLUMN IF NOT EXISTS subaccounts JSONB,
ADD COLUMN IF NOT EXISTS total_subaccounts INTEGER,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS paystack_data JSONB;

-- Add comments to document the new columns
COMMENT ON COLUMN payment_splits.split_code IS 'Unique Paystack split code identifier';
COMMENT ON COLUMN payment_splits.name IS 'Human readable name for the split';
COMMENT ON COLUMN payment_splits.type IS 'Split type: percentage or flat amount';
COMMENT ON COLUMN payment_splits.currency IS 'Currency for the split (default ZAR)';
COMMENT ON COLUMN payment_splits.subaccounts IS 'JSON array of subaccount configurations';
COMMENT ON COLUMN payment_splits.total_subaccounts IS 'Total number of subaccounts in this split';
COMMENT ON COLUMN payment_splits.active IS 'Whether this split is active/usable';
COMMENT ON COLUMN payment_splits.paystack_data IS 'Full Paystack API response data for this split';

-- Create index on split_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_splits_split_code ON payment_splits(split_code);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_split_code ON payment_transactions(split_code);
CREATE INDEX IF NOT EXISTS idx_payment_splits_active ON payment_splits(active);

-- Add foreign key relationship between payment_transactions and payment_splits
-- Note: We use split_code as the foreign key since that's what Paystack uses
ALTER TABLE payment_transactions
ADD CONSTRAINT fk_payment_transactions_split_code 
FOREIGN KEY (split_code) REFERENCES payment_splits(split_code)
ON DELETE SET NULL;

-- Create a view for easy split transaction analysis
CREATE OR REPLACE VIEW payment_transaction_splits AS
SELECT 
    pt.id as transaction_id,
    pt.reference,
    pt.user_id,
    pt.amount as total_amount,
    pt.status as transaction_status,
    pt.created_at as transaction_created_at,
    ps.split_code,
    ps.name as split_name,
    ps.type as split_type,
    ps.currency,
    ps.subaccounts,
    ps.total_subaccounts,
    ps.active as split_active,
    pt.items,
    pt.shipping_address
FROM payment_transactions pt
LEFT JOIN payment_splits ps ON pt.split_code = ps.split_code;

-- Grant necessary permissions
GRANT SELECT ON payment_transaction_splits TO authenticated;
GRANT SELECT ON payment_transaction_splits TO service_role;

-- Add RLS policies for payment_splits table
ALTER TABLE payment_splits ENABLE ROW LEVEL SECURITY;

-- Admin can do everything with splits
CREATE POLICY "Admins can manage all payment splits" ON payment_splits
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Service role can manage all splits (for edge functions)
CREATE POLICY "Service role can manage all payment splits" ON payment_splits
FOR ALL USING (auth.role() = 'service_role');

-- Users can view splits related to their transactions
CREATE POLICY "Users can view their related payment splits" ON payment_splits
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM payment_transactions pt
        WHERE pt.split_code = payment_splits.split_code
        AND pt.user_id = auth.uid()
    )
);

-- Add helpful functions for split management

-- Function to get split summary for a transaction
CREATE OR REPLACE FUNCTION get_transaction_split_summary(transaction_reference TEXT)
RETURNS TABLE (
    transaction_amount DECIMAL,
    split_code TEXT,
    split_name TEXT,
    subaccount_count INTEGER,
    platform_amount DECIMAL,
    seller_amounts JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    split_info payment_splits%ROWTYPE;
    trans_info payment_transactions%ROWTYPE;
BEGIN
    -- Get transaction info
    SELECT * INTO trans_info 
    FROM payment_transactions 
    WHERE reference = transaction_reference;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Get split info if available
    IF trans_info.split_code IS NOT NULL THEN
        SELECT * INTO split_info 
        FROM payment_splits 
        WHERE payment_splits.split_code = trans_info.split_code;
    END IF;
    
    RETURN QUERY SELECT 
        trans_info.amount,
        split_info.split_code,
        split_info.name,
        split_info.total_subaccounts,
        CASE 
            WHEN split_info.type = 'flat' THEN 
                trans_info.amount - (
                    SELECT SUM((subaccount->>'share')::DECIMAL) 
                    FROM jsonb_array_elements(split_info.subaccounts) AS subaccount
                ) / 100.0
            ELSE 
                trans_info.amount * (
                    100 - (
                        SELECT SUM((subaccount->>'share')::DECIMAL) 
                        FROM jsonb_array_elements(split_info.subaccounts) AS subaccount
                    )
                ) / 100.0
        END,
        split_info.subaccounts;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_transaction_split_summary(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_transaction_split_summary(TEXT) TO service_role;
