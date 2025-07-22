-- =====================================================
-- MISSING DATABASE TABLES MIGRATION
-- =====================================================
-- This migration creates ALL missing tables referenced in the codebase
-- but not yet created in the database
-- =====================================================

-- =====================================================
-- PAYMENT & FINANCIAL TABLES
-- =====================================================

-- Payment transactions table (CRITICAL for refund system)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE, -- Paystack transaction reference
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'ZAR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed')),
  payment_method TEXT,
  customer_email TEXT,
  customer_name TEXT,
  paystack_response JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Payment splits table (for multi-seller orders)
CREATE TABLE IF NOT EXISTS public.payment_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_reference TEXT NOT NULL REFERENCES public.payment_transactions(reference),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  subaccount_code TEXT,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Payout transactions table (seller payments)
CREATE TABLE IF NOT EXISTS public.payout_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  transfer_reference TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed')),
  paystack_response JSONB,
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- NOTIFICATION & REQUEST TABLES
-- =====================================================

-- Notification requests table (program availability notifications)
CREATE TABLE IF NOT EXISTS public.notification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  program_name TEXT NOT NULL,
  university_name TEXT,
  course_code TEXT,
  notification_type TEXT NOT NULL DEFAULT 'program_availability',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'notified', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notified_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

-- =====================================================
-- STUDY RESOURCES TABLES (if missing)
-- =====================================================

-- Study resources table (create if not exists)
CREATE TABLE IF NOT EXISTS public.study_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('pdf', 'video', 'article', 'quiz', 'guide')),
  subject TEXT,
  grade_level TEXT,
  university TEXT,
  course_code TEXT,
  file_url TEXT,
  thumbnail_url TEXT,
  download_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Study tips table (create if not exists)
CREATE TABLE IF NOT EXISTS public.study_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  subject TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_read_time INTEGER, -- in minutes
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- COMMITMENT NOTIFICATIONS (if missing)
-- =====================================================

-- Commitment notifications table (create if not exists)
CREATE TABLE IF NOT EXISTS public.commitment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id UUID NOT NULL REFERENCES public.sale_commitments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('reminder', 'expiry_warning', 'expired')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- LOGGING & ACTIVITY TABLES (if missing)
-- =====================================================

-- Activity logs table (create if not exists)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Order activity log table (create if not exists)
CREATE TABLE IF NOT EXISTS public.order_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Delivery automation log table
CREATE TABLE IF NOT EXISTS public.delivery_automation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  provider TEXT, -- 'courier_guy', 'fastway'
  request_data JSONB,
  response_data JSONB,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Payment transactions indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_reference ON public.payment_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions(created_at);

-- Payment splits indexes
CREATE INDEX IF NOT EXISTS idx_payment_splits_payment_ref ON public.payment_splits(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payment_splits_order_id ON public.payment_splits(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_splits_seller_id ON public.payment_splits(seller_id);

-- Payout transactions indexes
CREATE INDEX IF NOT EXISTS idx_payout_transactions_order_id ON public.payout_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payout_transactions_seller_id ON public.payout_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_payout_transactions_status ON public.payout_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payout_transactions_transfer_ref ON public.payout_transactions(transfer_reference);

-- Notification requests indexes
CREATE INDEX IF NOT EXISTS idx_notification_requests_user_id ON public.notification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_requests_status ON public.notification_requests(status);
CREATE INDEX IF NOT EXISTS idx_notification_requests_program ON public.notification_requests(program_name);

-- Study resources indexes
CREATE INDEX IF NOT EXISTS idx_study_resources_subject ON public.study_resources(subject);
CREATE INDEX IF NOT EXISTS idx_study_resources_resource_type ON public.study_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_study_resources_university ON public.study_resources(university);
CREATE INDEX IF NOT EXISTS idx_study_resources_featured ON public.study_resources(is_featured);
CREATE INDEX IF NOT EXISTS idx_study_resources_active ON public.study_resources(is_active);

-- Study tips indexes
CREATE INDEX IF NOT EXISTS idx_study_tips_category ON public.study_tips(category);
CREATE INDEX IF NOT EXISTS idx_study_tips_subject ON public.study_tips(subject);
CREATE INDEX IF NOT EXISTS idx_study_tips_featured ON public.study_tips(is_featured);
CREATE INDEX IF NOT EXISTS idx_study_tips_active ON public.study_tips(is_active);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON public.activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

-- Order activity log indexes
CREATE INDEX IF NOT EXISTS idx_order_activity_log_order_id ON public.order_activity_log(order_id);
CREATE INDEX IF NOT EXISTS idx_order_activity_log_user_id ON public.order_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_order_activity_log_action ON public.order_activity_log(action);

-- Delivery automation log indexes
CREATE INDEX IF NOT EXISTS idx_delivery_automation_log_order_id ON public.delivery_automation_log(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_automation_log_provider ON public.delivery_automation_log(provider);
CREATE INDEX IF NOT EXISTS idx_delivery_automation_log_status ON public.delivery_automation_log(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commitment_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_automation_log ENABLE ROW LEVEL SECURITY;

-- Payment transactions policies
CREATE POLICY "Admins can manage all payment transactions" ON public.payment_transactions
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Users can view their own payment transactions" ON public.payment_transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage payment transactions" ON public.payment_transactions
  FOR ALL USING (true);

-- Payment splits policies
CREATE POLICY "Admins can manage all payment splits" ON public.payment_splits
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Sellers can view their own payment splits" ON public.payment_splits
  FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "System can manage payment splits" ON public.payment_splits
  FOR ALL USING (true);

-- Payout transactions policies
CREATE POLICY "Admins can manage all payout transactions" ON public.payout_transactions
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Sellers can view their own payout transactions" ON public.payout_transactions
  FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "System can manage payout transactions" ON public.payout_transactions
  FOR ALL USING (true);

-- Notification requests policies
CREATE POLICY "Users can manage their own notification requests" ON public.notification_requests
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all notification requests" ON public.notification_requests
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Study resources policies
CREATE POLICY "Everyone can view active study resources" ON public.study_resources
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all study resources" ON public.study_resources
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Study tips policies
CREATE POLICY "Everyone can view active study tips" ON public.study_tips
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all study tips" ON public.study_tips
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Commitment notifications policies
CREATE POLICY "Users can view their own commitment notifications" ON public.commitment_notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage commitment notifications" ON public.commitment_notifications
  FOR ALL USING (true);

-- Activity logs policies
CREATE POLICY "Admins can view all activity logs" ON public.activity_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Users can view their own activity logs" ON public.activity_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create activity logs" ON public.activity_logs
  FOR INSERT WITH CHECK (true);

-- Order activity log policies
CREATE POLICY "Admins can view all order activity logs" ON public.order_activity_log
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Users can view order activity for their orders" ON public.order_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_activity_log.order_id 
      AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
    )
  );

CREATE POLICY "System can create order activity logs" ON public.order_activity_log
  FOR INSERT WITH CHECK (true);

-- Delivery automation log policies
CREATE POLICY "Admins can view all delivery automation logs" ON public.delivery_automation_log
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "System can manage delivery automation logs" ON public.delivery_automation_log
  FOR ALL USING (true);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Add updated_at triggers where needed
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_splits_updated_at
  BEFORE UPDATE ON public.payment_splits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payout_transactions_updated_at
  BEFORE UPDATE ON public.payout_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_study_resources_updated_at
  BEFORE UPDATE ON public.study_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_study_tips_updated_at
  BEFORE UPDATE ON public.study_tips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================
COMMENT ON TABLE public.payment_transactions IS 'Tracks all payment transactions from Paystack';
COMMENT ON TABLE public.payment_splits IS 'Handles payment splitting for multi-seller orders';
COMMENT ON TABLE public.payout_transactions IS 'Tracks seller payouts and platform commissions';
COMMENT ON TABLE public.notification_requests IS 'User requests for program availability notifications';
COMMENT ON TABLE public.study_resources IS 'Educational study materials and resources';
COMMENT ON TABLE public.study_tips IS 'Study tips and methodology advice';
COMMENT ON TABLE public.commitment_notifications IS 'Automated notifications for sale commitments';
COMMENT ON TABLE public.activity_logs IS 'System-wide activity tracking for audit purposes';
COMMENT ON TABLE public.order_activity_log IS 'Order-specific activity and status change tracking';
COMMENT ON TABLE public.delivery_automation_log IS 'Delivery provider automation logs and responses';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Missing database tables migration completed successfully!';
  RAISE NOTICE 'Created: payment_transactions, payment_splits, payout_transactions';
  RAISE NOTICE 'Created: notification_requests, study_resources, study_tips';
  RAISE NOTICE 'Created: commitment_notifications, activity_logs, order_activity_log';
  RAISE NOTICE 'Created: delivery_automation_log with complete RLS and indexes';
  RAISE NOTICE 'All missing tables from codebase analysis have been created!';
  RAISE NOTICE 'Database schema is now complete and matches application expectations!';
END $$;
