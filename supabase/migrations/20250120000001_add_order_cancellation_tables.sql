-- Add delivery_status and other cancellation-related fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS courier_booking_id TEXT,
ADD COLUMN IF NOT EXISTS courier_service TEXT,
ADD COLUMN IF NOT EXISTS pickup_scheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pickup_failed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pickup_failure_reason TEXT,
ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS decline_reason TEXT,
ADD COLUMN IF NOT EXISTS delivery_info JSONB;

-- Add constraints for delivery_status
ALTER TABLE orders 
ADD CONSTRAINT orders_delivery_status_check 
CHECK (delivery_status IN (
  'pending', 
  'pickup_failed', 
  'rescheduled_by_seller', 
  'picked_up', 
  'in_transit', 
  'delivered'
));

-- Add constraints for status
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN (
  'pending', 
  'confirmed', 
  'dispatched', 
  'delivered', 
  'cancelled_by_buyer',
  'declined_by_seller',
  'cancelled_by_seller_after_missed_pickup'
));

-- Create order_activity_log table for tracking order events
CREATE TABLE IF NOT EXISTS order_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_courier_booking_id ON orders(courier_booking_id);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_scheduled ON orders(pickup_scheduled_at);
CREATE INDEX IF NOT EXISTS idx_order_activity_log_order_id ON order_activity_log(order_id);
CREATE INDEX IF NOT EXISTS idx_order_activity_log_action ON order_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_order_activity_log_created_at ON order_activity_log(created_at);

-- Add action_required and order_id fields to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS action_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS action_type TEXT;

-- Add indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_action_required ON notifications(action_required);
CREATE INDEX IF NOT EXISTS idx_notifications_order_id ON notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_action_type ON notifications(action_type);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers for relevant tables
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies for order_activity_log
ALTER TABLE order_activity_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view activity logs for their own orders
CREATE POLICY "Users can view their order activity logs" ON order_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_activity_log.order_id 
      AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
    )
  );

-- Policy: System can insert activity logs
CREATE POLICY "System can insert order activity logs" ON order_activity_log
  FOR INSERT WITH CHECK (true);

-- Update notifications policies to include new fields
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Add sample delivery statuses for existing orders (optional)
-- UPDATE orders SET delivery_status = 'pending' WHERE delivery_status IS NULL;

-- Add comment for documentation
COMMENT ON TABLE order_activity_log IS 'Tracks all order-related activities including cancellations, reschedules, and status changes';
COMMENT ON COLUMN orders.delivery_status IS 'Current status of the delivery/pickup process';
COMMENT ON COLUMN orders.courier_booking_id IS 'External courier service booking reference';
COMMENT ON COLUMN orders.pickup_scheduled_at IS 'When the courier pickup is scheduled';
COMMENT ON COLUMN notifications.action_required IS 'Whether this notification requires user action';
COMMENT ON COLUMN notifications.order_id IS 'Related order ID for order-specific notifications';
