-- Sample notifications to demonstrate the notification system
-- These show different types of notifications users would receive

-- First, let's create some sample user profiles if they don't exist
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'sarah.johnson@student.uct.ac.za', NOW(), NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'michael.chen@student.wits.ac.za', NOW(), NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'priya.patel@student.up.ac.za', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create corresponding profiles
INSERT INTO profiles (id, name, email, status, created_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Sarah Johnson', 'sarah.johnson@student.uct.ac.za', 'active', NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'Michael Chen', 'michael.chen@student.wits.ac.za', 'active', NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'Priya Patel', 'priya.patel@student.up.ac.za', 'active', NOW())
ON CONFLICT (id) DO NOTHING;

-- Now create sample notifications showing different scenarios
INSERT INTO notifications (user_id, type, title, message, read, action_required, order_id, created_at)
VALUES 
  -- Order confirmations (success type)
  ('550e8400-e29b-41d4-a716-446655440001', 'success', '🛒 Order Confirmed!', 'Your order for "Introduction to Computer Science" has been confirmed. Total: R150.00. The seller will commit within 48 hours. Order ID: ORD001', false, false, 'ORD001', NOW() - INTERVAL '10 minutes'),
  
  -- New sale notifications (info type)
  ('550e8400-e29b-41d4-a716-446655440002', 'info', '📦 New Order Received!', 'Great news! You have received a new order for "Calculus Made Easy" worth R200.00. Please commit within 48 hours. Order ID: ORD002', false, true, 'ORD002', NOW() - INTERVAL '5 minutes'),
  
  -- Commit confirmations (success type)
  ('550e8400-e29b-41d4-a716-446655440001', 'success', '✅ Order Confirmed', 'Your order for "Physics Fundamentals" has been confirmed by the seller. Pickup will be scheduled. Order ID: ORD003', false, false, 'ORD003', NOW() - INTERVAL '2 hours'),
  
  -- Shipping notifications (info type)
  ('550e8400-e29b-41d4-a716-446655440003', 'info', '📦 Your Order Has Shipped!', 'Great news! Your order for "Biology Textbook" has been shipped and is on its way to you. Tracking: CG12345678', false, false, 'ORD004', NOW() - INTERVAL '1 hour'),
  
  -- Delivery updates (info type)
  ('550e8400-e29b-41d4-a716-446655440001', 'info', '🚚 Your Order is on the Way!', 'Good news! Your order for "Chemistry Lab Manual" is now in transit and on its way to you. Expected delivery: 1-3 business days.', false, false, 'ORD005', NOW() - INTERVAL '30 minutes'),
  
  -- Out for delivery (info type)
  ('550e8400-e29b-41d4-a716-446655440002', 'info', '🚛 Your Order is Out for Delivery!', 'Your order for "Mathematics Workbook" is out for delivery and should arrive today! Please be available to receive it.', false, false, 'ORD006', NOW() - INTERVAL '15 minutes'),
  
  -- Delivered notifications (success type)
  ('550e8400-e29b-41d4-a716-446655440003', 'success', '✅ Order Delivered Successfully!', 'Excellent news! Your order for "History of South Africa" has been successfully delivered. Enjoy your purchase!', true, false, 'ORD007', NOW() - INTERVAL '3 hours'),
  
  -- Collection notifications (success type)
  ('550e8400-e29b-41d4-a716-446655440002', 'success', '📦 Order Collected Successfully!', 'Order for "Engineering Design" has been collected and is being shipped to the buyer.', true, false, 'ORD008', NOW() - INTERVAL '4 hours'),
  
  -- Cancellation notifications (error type)
  ('550e8400-e29b-41d4-a716-446655440001', 'error', '❌ Order Cancelled', 'Your order has been cancelled by the seller. Refund processed and will appear in 3-5 business days. Order ID: ORD009', false, false, 'ORD009', NOW() - INTERVAL '6 hours'),
  
  -- Decline notifications (error type)
  ('550e8400-e29b-41d4-a716-446655440003', 'error', '❌ Order Declined', 'Your order has been declined by the seller. Refund processed and will appear in 3-5 business days. Order ID: ORD010', false, false, 'ORD010', NOW() - INTERVAL '8 hours'),
  
  -- Payment confirmations (success type)
  ('550e8400-e29b-41d4-a716-446655440002', 'success', '💳 Payment Successful', 'Payment of R180.00 for "Statistics Textbook" has been processed successfully. Your order is now confirmed. Order ID: ORD011', true, false, 'ORD011', NOW() - INTERVAL '1 day'),
  
  -- Reminder notifications (warning type)
  ('550e8400-e29b-41d4-a716-446655440001', 'warning', '⏰ Commit to Sale Reminder', 'You have 12 hours remaining to commit to selling "Economics 101". Please complete your commitment to avoid order cancellation. Order ID: ORD012', false, true, 'ORD012', NOW() - INTERVAL '12 hours'),
  
  -- System notifications (info type)
  ('550e8400-e29b-41d4-a716-446655440002', 'info', '🔔 Account Update', 'Your profile information has been successfully updated. Thank you for keeping your details current!', true, false, NULL, NOW() - INTERVAL '2 days'),
  
  -- Welcome notifications (success type)
  ('550e8400-e29b-41d4-a716-446655440003', 'success', '🎉 Welcome to ReBooked!', 'Welcome to ReBooked Solutions! Your account has been created successfully. Start buying and selling textbooks today!', true, false, NULL, NOW() - INTERVAL '3 days'),
  
  -- Admin notification (for testing admin features)
  ('550e8400-e29b-41d4-a716-446655440001', 'info', '📚 Auto-Expire: 5 books back on market', '5 books have been freed up and are back on the market! Total value: R750.00. Generated: ' || NOW()::text, false, false, NULL, NOW() - INTERVAL '1 day');
