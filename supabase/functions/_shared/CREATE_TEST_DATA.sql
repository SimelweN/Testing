-- Create test data for edge function testing
-- Run this in your Supabase SQL editor to create test records

-- Insert test profiles (users)
INSERT INTO profiles (id, name, email, phone, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Test Buyer', 'buyer@example.com', '0123456789', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'Test Seller', 'seller@example.com', '0987654321', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = NOW();

-- Insert test book
INSERT INTO books (id, title, author, price, description, seller_id, condition, subject, university, sold, created_at, updated_at, isbn)
VALUES 
  ('00000000-0000-0000-0000-000000000003', 'Test Textbook', 'Test Author', 250.00, 'A test book for testing functions', '00000000-0000-0000-0000-000000000002', 'good', 'Mathematics', 'University of Cape Town', false, NOW(), NOW(), '9781234567890')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  price = EXCLUDED.price,
  sold = false,
  updated_at = NOW();

-- Insert test order
INSERT INTO orders (id, buyer_id, seller_id, book_id, status, total_amount, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'pending_commit', 250.00, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  status = 'pending_commit',
  updated_at = NOW();

-- Insert test transaction
INSERT INTO transactions (id, user_id, amount, type, status, description, order_id, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 250.00, 'purchase', 'completed', 'Test purchase transaction', '00000000-0000-0000-0000-000000000004', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  status = 'completed',
  updated_at = NOW();

-- Verify the data was created
SELECT 'Test data created successfully!' as message;
SELECT 'Books:' as table_name, count(*) as record_count FROM books WHERE id = '00000000-0000-0000-0000-000000000003';
SELECT 'Profiles:' as table_name, count(*) as record_count FROM profiles WHERE id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');
SELECT 'Orders:' as table_name, count(*) as record_count FROM orders WHERE id = '00000000-0000-0000-0000-000000000004';
