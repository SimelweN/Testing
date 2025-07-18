-- Create refund transactions table for tracking all refund operations
CREATE TABLE IF NOT EXISTS public.refund_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  transaction_reference TEXT NOT NULL, -- Original Paystack payment reference
  paystack_refund_reference TEXT,      -- Paystack refund ID (set after refund)
  amount NUMERIC(10,2) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed')),
  initiated_by UUID REFERENCES public.profiles(id), -- User who initiated (admin or system)
  paystack_response JSONB,             -- Full Paystack API response
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,           -- When Paystack started processing
  completed_at TIMESTAMPTZ,           -- When refund completed
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_refund_transactions_order_id ON public.refund_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_refund_transactions_transaction_ref ON public.refund_transactions(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_refund_transactions_paystack_refund_ref ON public.refund_transactions(paystack_refund_reference);
CREATE INDEX IF NOT EXISTS idx_refund_transactions_status ON public.refund_transactions(status);
CREATE INDEX IF NOT EXISTS idx_refund_transactions_created_at ON public.refund_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_refund_transactions_initiated_by ON public.refund_transactions(initiated_by);

-- Enable Row Level Security
ALTER TABLE public.refund_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for refund_transactions
CREATE POLICY "Admins can manage all refund transactions" 
ON public.refund_transactions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Users can view refunds for their orders" 
ON public.refund_transactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = refund_transactions.order_id 
    AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  )
);

CREATE POLICY "System can insert refund transactions" 
ON public.refund_transactions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update refund transactions" 
ON public.refund_transactions 
FOR UPDATE 
USING (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_refund_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_refund_transactions_updated_at
    BEFORE UPDATE ON public.refund_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_refund_updated_at();

-- Create function to check refund eligibility
CREATE OR REPLACE FUNCTION public.check_refund_eligibility(p_order_id UUID)
RETURNS TABLE(
  eligible BOOLEAN,
  reason TEXT,
  max_amount NUMERIC
) AS $$
DECLARE
  order_record RECORD;
  existing_refund RECORD;
BEGIN
  -- Get order details
  SELECT * INTO order_record 
  FROM public.orders 
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Order not found', 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Check if order status allows refunds
  IF order_record.status NOT IN (
    'pending_commit', 'committed', 'pickup_scheduled', 
    'pickup_attempted', 'failed', 'cancelled'
  ) THEN
    RETURN QUERY SELECT false, 'Order status does not allow refunds', 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Check if already delivered
  IF order_record.delivery_status = 'delivered' THEN
    RETURN QUERY SELECT false, 'Cannot refund delivered orders', 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Check for existing successful refunds
  SELECT * INTO existing_refund
  FROM public.refund_transactions
  WHERE order_id = p_order_id AND status = 'success';
  
  IF FOUND THEN
    RETURN QUERY SELECT false, 'Order already refunded', 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Order is eligible for refund
  RETURN QUERY SELECT true, 'Order eligible for refund', order_record.total_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get refund statistics
CREATE OR REPLACE FUNCTION public.get_refund_statistics(
  start_date TIMESTAMPTZ DEFAULT NULL,
  end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(
  total_refunds BIGINT,
  total_amount NUMERIC,
  pending_count BIGINT,
  processing_count BIGINT,
  success_count BIGINT,
  failed_count BIGINT,
  avg_processing_time INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_refunds,
    COALESCE(SUM(amount), 0) as total_amount,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_count,
    COUNT(*) FILTER (WHERE status = 'processing')::BIGINT as processing_count,
    COUNT(*) FILTER (WHERE status = 'success')::BIGINT as success_count,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_count,
    AVG(completed_at - created_at) FILTER (WHERE status = 'success' AND completed_at IS NOT NULL) as avg_processing_time
  FROM public.refund_transactions
  WHERE 
    (start_date IS NULL OR created_at >= start_date)
    AND (end_date IS NULL OR created_at <= end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also need to add refund columns to orders table if they don't exist
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
