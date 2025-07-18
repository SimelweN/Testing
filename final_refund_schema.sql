-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create refund transactions table for tracking all refund operations
CREATE TABLE IF NOT EXISTS public.refund_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  transaction_reference TEXT NOT NULL, -- Original Paystack payment reference
  paystack_refund_reference TEXT,      -- Paystack refund ID (set after refund)
  amount NUMERIC(10,2) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed')),
  initiated_by UUID REFERENCES auth.users(id),
  paystack_response JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_refund_transactions_order_id ON public.refund_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_refund_transactions_status ON public.refund_transactions(status);
CREATE INDEX IF NOT EXISTS idx_refund_transactions_transaction_ref ON public.refund_transactions(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_refund_transactions_paystack_ref ON public.refund_transactions(paystack_refund_reference);
CREATE INDEX IF NOT EXISTS idx_refund_transactions_created_at ON public.refund_transactions(created_at);

-- Enable Row Level Security
ALTER TABLE public.refund_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all refunds" ON public.refund_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Users can view refunds for their orders" ON public.refund_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = refund_transactions.order_id 
      AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
    )
  );

CREATE POLICY "System can create refunds" ON public.refund_transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update refunds" ON public.refund_transactions
  FOR UPDATE USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_refund_transactions_updated_at
  BEFORE UPDATE ON public.refund_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add function to check refund eligibility
CREATE OR REPLACE FUNCTION public.check_refund_eligibility(p_order_id UUID)
RETURNS TABLE(
  eligible BOOLEAN,
  reason TEXT,
  max_refund_amount NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  order_record public.orders%ROWTYPE;
  existing_refund_count INTEGER;
BEGIN
  -- Get order details
  SELECT * INTO order_record FROM public.orders WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Order not found', 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Check if order is delivered
  IF order_record.status = 'delivered' OR order_record.delivery_status = 'delivered' THEN
    RETURN QUERY SELECT false, 'Cannot refund delivered orders', 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Check for existing successful refunds
  SELECT COUNT(*) INTO existing_refund_count 
  FROM public.refund_transactions 
  WHERE order_id = p_order_id AND status = 'success';
  
  IF existing_refund_count > 0 THEN
    RETURN QUERY SELECT false, 'Order already refunded', 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Check refundable status
  IF order_record.status NOT IN ('pending_commit', 'committed', 'pickup_scheduled', 'pickup_attempted', 'failed', 'cancelled') THEN
    RETURN QUERY SELECT false, 'Order status not eligible for refund', 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Order is eligible - use total_amount or amount depending on your orders table structure
  RETURN QUERY SELECT true, 'Order eligible for refund', 
    COALESCE(order_record.total_amount, order_record.amount, 0)::NUMERIC;
END;
$$;

-- Add function to get refund statistics
CREATE OR REPLACE FUNCTION public.get_refund_statistics()
RETURNS TABLE(
  total_refunds BIGINT,
  pending_refunds BIGINT,
  successful_refunds BIGINT,
  failed_refunds BIGINT,
  total_refund_amount NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_refunds,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_refunds,
    COUNT(*) FILTER (WHERE status = 'success') as successful_refunds,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_refunds,
    COALESCE(SUM(amount) FILTER (WHERE status = 'success'), 0) as total_refund_amount
  FROM public.refund_transactions;
END;
$$;

-- Add refund columns to orders table if they don't exist
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
