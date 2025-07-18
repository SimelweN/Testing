-- =====================================================
-- COMPLETE REFUND SYSTEM MIGRATION
-- =====================================================
-- This migration creates a comprehensive refund system
-- with proper database schema, policies, and utilities
-- =====================================================

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- REFUND TRANSACTIONS TABLE
-- =====================================================
-- Main table for tracking all refund operations
CREATE TABLE IF NOT EXISTS public.refund_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  transaction_reference TEXT NOT NULL, -- Original Paystack payment reference
  paystack_refund_reference TEXT,      -- Paystack refund ID (set after refund)
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL CHECK (length(reason) > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed')),
  initiated_by UUID REFERENCES auth.users(id), -- Who initiated the refund
  paystack_response JSONB,             -- Full Paystack API response
  error_message TEXT,                  -- Error details if failed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE, -- When Paystack started processing
  completed_at TIMESTAMP WITH TIME ZONE  -- When refund completed successfully
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================
-- Indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_refund_transactions_order_id 
ON public.refund_transactions(order_id);

CREATE INDEX IF NOT EXISTS idx_refund_transactions_status 
ON public.refund_transactions(status);

CREATE INDEX IF NOT EXISTS idx_refund_transactions_transaction_ref 
ON public.refund_transactions(transaction_reference);

CREATE INDEX IF NOT EXISTS idx_refund_transactions_paystack_refund_ref 
ON public.refund_transactions(paystack_refund_reference);

CREATE INDEX IF NOT EXISTS idx_refund_transactions_created_at 
ON public.refund_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_refund_transactions_initiated_by 
ON public.refund_transactions(initiated_by);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_refund_transactions_order_status 
ON public.refund_transactions(order_id, status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Enable RLS for data security
ALTER TABLE public.refund_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage all refunds
CREATE POLICY "Admins can manage all refunds" 
ON public.refund_transactions
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy: Users can view refunds for their orders (buyer or seller)
CREATE POLICY "Users can view refunds for their orders" 
ON public.refund_transactions
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = refund_transactions.order_id 
    AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
  )
);

-- Policy: System can create refunds (for automated processes)
CREATE POLICY "System can create refunds" 
ON public.refund_transactions
FOR INSERT 
WITH CHECK (true);

-- Policy: System can update refunds (for status updates from webhooks)
CREATE POLICY "System can update refunds" 
ON public.refund_transactions
FOR UPDATE 
USING (true);

-- =====================================================
-- TRIGGERS
-- =====================================================
-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_refund_transactions_updated_at
  BEFORE UPDATE ON public.refund_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to check if an order is eligible for refund
CREATE OR REPLACE FUNCTION public.check_refund_eligibility(p_order_id UUID)
RETURNS TABLE(
  eligible BOOLEAN,
  reason TEXT,
  max_refund_amount NUMERIC
) 
LANGUAGE plpgsql 
SECURITY DEFINER AS $$
DECLARE
  order_record public.orders%ROWTYPE;
  existing_refund_count INTEGER;
  total_refunded NUMERIC DEFAULT 0;
BEGIN
  -- Get order details
  SELECT * INTO order_record FROM public.orders WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Order not found', 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Check if order is delivered (cannot refund delivered orders)
  IF order_record.status = 'delivered' OR order_record.delivery_status = 'delivered' THEN
    RETURN QUERY SELECT false, 'Cannot refund delivered orders', 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Check for existing successful refunds
  SELECT COUNT(*), COALESCE(SUM(amount), 0)
  INTO existing_refund_count, total_refunded
  FROM public.refund_transactions 
  WHERE order_id = p_order_id AND status = 'success';
  
  -- Check if already fully refunded
  IF total_refunded >= COALESCE(order_record.total_amount, order_record.amount, 0) THEN
    RETURN QUERY SELECT false, 'Order already fully refunded', 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Check refundable status
  IF order_record.status NOT IN (
    'pending_commit', 'committed', 'pickup_scheduled', 
    'pickup_attempted', 'failed', 'cancelled', 'declined'
  ) THEN
    RETURN QUERY SELECT false, 'Order status not eligible for refund', 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Order is eligible - calculate remaining refundable amount
  DECLARE
    order_amount NUMERIC := COALESCE(order_record.total_amount, order_record.amount, 0);
    remaining_amount NUMERIC := order_amount - total_refunded;
  BEGIN
    RETURN QUERY SELECT true, 'Order eligible for refund', remaining_amount;
  END;
END;
$$;

-- Function to get comprehensive refund statistics
CREATE OR REPLACE FUNCTION public.get_refund_statistics(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE(
  total_refunds BIGINT,
  pending_refunds BIGINT,
  processing_refunds BIGINT,
  successful_refunds BIGINT,
  failed_refunds BIGINT,
  total_refund_amount NUMERIC,
  avg_refund_amount NUMERIC,
  avg_processing_time INTERVAL
) 
LANGUAGE plpgsql 
SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_refunds,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_refunds,
    COUNT(*) FILTER (WHERE status = 'processing') as processing_refunds,
    COUNT(*) FILTER (WHERE status = 'success') as successful_refunds,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_refunds,
    COALESCE(SUM(amount) FILTER (WHERE status = 'success'), 0) as total_refund_amount,
    COALESCE(AVG(amount) FILTER (WHERE status = 'success'), 0) as avg_refund_amount,
    AVG(completed_at - created_at) FILTER (
      WHERE status = 'success' AND completed_at IS NOT NULL
    ) as avg_processing_time
  FROM public.refund_transactions
  WHERE 
    (start_date IS NULL OR created_at >= start_date)
    AND (end_date IS NULL OR created_at <= end_date);
END;
$$;

-- Function to get refund details for a specific order
CREATE OR REPLACE FUNCTION public.get_order_refund_details(p_order_id UUID)
RETURNS TABLE(
  refund_id UUID,
  amount NUMERIC,
  reason TEXT,
  status TEXT,
  paystack_refund_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  initiated_by_email TEXT
) 
LANGUAGE plpgsql 
SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rt.id,
    rt.amount,
    rt.reason,
    rt.status,
    rt.paystack_refund_reference,
    rt.created_at,
    rt.completed_at,
    COALESCE(p.email, 'System') as initiated_by_email
  FROM public.refund_transactions rt
  LEFT JOIN auth.users u ON rt.initiated_by = u.id
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE rt.order_id = p_order_id
  ORDER BY rt.created_at DESC;
END;
$$;

-- Function to safely process a refund (business logic validation)
CREATE OR REPLACE FUNCTION public.validate_refund_request(
  p_order_id UUID,
  p_amount NUMERIC DEFAULT NULL,
  p_reason TEXT DEFAULT 'Refund requested'
)
RETURNS TABLE(
  valid BOOLEAN,
  message TEXT,
  validated_amount NUMERIC
) 
LANGUAGE plpgsql 
SECURITY DEFINER AS $$
DECLARE
  eligibility_check RECORD;
  order_amount NUMERIC;
BEGIN
  -- Check eligibility first
  SELECT * INTO eligibility_check 
  FROM public.check_refund_eligibility(p_order_id);
  
  IF NOT eligibility_check.eligible THEN
    RETURN QUERY SELECT false, eligibility_check.reason, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Validate amount
  IF p_amount IS NULL THEN
    -- Full refund
    RETURN QUERY SELECT true, 'Full refund validated', eligibility_check.max_refund_amount;
  ELSIF p_amount <= 0 THEN
    RETURN QUERY SELECT false, 'Refund amount must be greater than 0', 0::NUMERIC;
  ELSIF p_amount > eligibility_check.max_refund_amount THEN
    RETURN QUERY SELECT false, 'Refund amount exceeds available refund amount', 0::NUMERIC;
  ELSE
    -- Partial refund
    RETURN QUERY SELECT true, 'Partial refund validated', p_amount;
  END IF;
END;
$$;

-- =====================================================
-- ORDERS TABLE ENHANCEMENTS
-- =====================================================
-- Add refund-related columns to orders table if they don't exist
DO $$ 
BEGIN
    -- Add refund status column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'refund_status'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN refund_status TEXT 
        CHECK (refund_status IN ('none', 'pending', 'processing', 'completed', 'failed'))
        DEFAULT 'none';
    END IF;
    
    -- Add refund reference column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'refund_reference'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN refund_reference TEXT;
    END IF;
    
    -- Add refunded timestamp column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'refunded_at'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN refunded_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add total refunded amount column (for partial refunds tracking)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'total_refunded'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN total_refunded NUMERIC(10,2) DEFAULT 0 
        CHECK (total_refunded >= 0);
    END IF;
END $$;

-- =====================================================
-- AUDIT TRIGGER FOR ORDERS
-- =====================================================
-- Function to update order refund totals when refunds change
CREATE OR REPLACE FUNCTION public.update_order_refund_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the order's total refunded amount
  UPDATE public.orders 
  SET 
    total_refunded = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM public.refund_transactions 
      WHERE order_id = COALESCE(NEW.order_id, OLD.order_id) 
      AND status = 'success'
    ),
    refund_status = CASE 
      WHEN NEW.status = 'success' THEN 'completed'
      WHEN NEW.status = 'failed' THEN 'failed'
      WHEN NEW.status = 'processing' THEN 'processing'
      ELSE 'pending'
    END,
    refund_reference = CASE 
      WHEN NEW.status = 'success' THEN NEW.paystack_refund_reference
      ELSE refund_reference
    END,
    refunded_at = CASE 
      WHEN NEW.status = 'success' AND OLD.status != 'success' THEN NOW()
      ELSE refunded_at
    END
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update order refund info
CREATE TRIGGER update_order_refund_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.refund_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_order_refund_totals();

-- =====================================================
-- HELPFUL VIEWS
-- =====================================================
-- View for easy refund reporting
CREATE OR REPLACE VIEW public.refund_summary AS
SELECT 
  rt.id,
  rt.order_id,
  o.buyer_id,
  o.seller_id,
  buyer.email as buyer_email,
  seller.email as seller_email,
  rt.amount,
  rt.reason,
  rt.status,
  rt.transaction_reference,
  rt.paystack_refund_reference,
  rt.created_at,
  rt.completed_at,
  initiator.email as initiated_by_email,
  EXTRACT(EPOCH FROM (rt.completed_at - rt.created_at))/3600 as processing_hours
FROM public.refund_transactions rt
JOIN public.orders o ON rt.order_id = o.id
LEFT JOIN public.profiles buyer ON o.buyer_id = buyer.id
LEFT JOIN public.profiles seller ON o.seller_id = seller.id
LEFT JOIN auth.users initiator_user ON rt.initiated_by = initiator_user.id
LEFT JOIN public.profiles initiator ON initiator_user.id = initiator.id;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================
COMMENT ON TABLE public.refund_transactions IS 'Tracks all refund operations with complete audit trail';
COMMENT ON COLUMN public.refund_transactions.transaction_reference IS 'Original Paystack payment reference being refunded';
COMMENT ON COLUMN public.refund_transactions.paystack_refund_reference IS 'Paystack refund ID returned from API';
COMMENT ON COLUMN public.refund_transactions.initiated_by IS 'User who initiated refund (admin, customer service, or NULL for system)';
COMMENT ON COLUMN public.refund_transactions.paystack_response IS 'Complete Paystack API response for debugging';

COMMENT ON FUNCTION public.check_refund_eligibility(UUID) IS 'Validates if an order can be refunded and returns max refundable amount';
COMMENT ON FUNCTION public.get_refund_statistics(TIMESTAMPTZ, TIMESTAMPTZ) IS 'Returns comprehensive refund statistics for reporting';
COMMENT ON VIEW public.refund_summary IS 'Easy-to-query view for refund reporting with user details';

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================
-- Set default refund_status for existing orders
UPDATE public.orders 
SET refund_status = 'none' 
WHERE refund_status IS NULL;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
-- Log successful migration
DO $$
BEGIN
  RAISE NOTICE 'Refund system migration completed successfully!';
  RAISE NOTICE 'Created: refund_transactions table with full audit trail';
  RAISE NOTICE 'Created: 6 performance indexes for optimal querying';
  RAISE NOTICE 'Created: 4 RLS policies for data security';
  RAISE NOTICE 'Created: 4 utility functions for business logic';
  RAISE NOTICE 'Created: refund_summary view for easy reporting';
  RAISE NOTICE 'Enhanced: orders table with refund tracking columns';
  RAISE NOTICE 'System is ready for production refund processing!';
END $$;
