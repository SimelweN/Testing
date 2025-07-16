-- Database functions for atomic checkout operations
-- These functions ensure data consistency and prevent race conditions

-- Function to create order with all validation in a single transaction
CREATE OR REPLACE FUNCTION create_order_transaction(
  p_buyer_email TEXT,
  p_seller_id UUID,
  p_book_ids UUID[],
  p_amount INTEGER,
  p_paystack_ref TEXT,
  p_shipping_address JSONB,
  p_delivery_method TEXT,
  p_delivery_fee INTEGER DEFAULT 0,
  p_platform_fee INTEGER DEFAULT 0,
  p_seller_amount INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_book_record RECORD;
  v_seller_record RECORD;
  v_order_items JSONB := '[]'::JSONB;
  v_total_book_price INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Start transaction (implicit in function)
  
  -- 1. Validate seller exists and has proper setup
    SELECT id, name, email, subaccount_code
  INTO v_seller_record
  FROM profiles 
  WHERE id = p_seller_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Seller not found'
    );
  END IF;
  
  -- Warn if seller banking not complete (but don't fail)
  IF v_seller_record.subaccount_code IS NULL THEN
    -- Log warning but continue
    RAISE WARNING 'Seller % has no subaccount code set up', p_seller_id;
  END IF;
  
  -- 2. Validate and lock books to prevent concurrent sales
  FOR v_book_record IN (
    SELECT id, title, author, price, seller_id, sold, availability
    FROM books 
    WHERE id = ANY(p_book_ids)
    FOR UPDATE -- Lock rows to prevent concurrent modifications
  ) LOOP
    -- Check if book is available
    IF v_book_record.sold = true OR v_book_record.availability != 'available' THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', format('Book "%s" is no longer available', v_book_record.title)
      );
    END IF;
    
    -- Check if seller matches
    IF v_book_record.seller_id != p_seller_id THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Books must belong to the same seller'
      );
    END IF;
    
    -- Add to order items
    v_order_items := v_order_items || jsonb_build_object(
      'type', 'book',
      'book_id', v_book_record.id,
      'book_title', v_book_record.title,
      'book_author', v_book_record.author,
      'price', v_book_record.price * 100, -- Convert to cents
      'quantity', 1,
      'seller_id', v_book_record.seller_id
    );
    
    v_total_book_price := v_total_book_price + (v_book_record.price * 100);
  END LOOP;
  
  -- 3. Validate amount matches calculated total
  IF p_amount != (v_total_book_price + p_delivery_fee) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format(
        'Amount mismatch: expected %s, got %s', 
        v_total_book_price + p_delivery_fee, 
        p_amount
      )
    );
  END IF;
  
  -- 4. Create order record
  INSERT INTO orders (
    buyer_email,
    seller_id,
    amount,
    paystack_ref,
    status,
    items,
    shipping_address,
    delivery_data,
    metadata,
    created_at
  ) VALUES (
    p_buyer_email,
    p_seller_id,
    p_amount,
    p_paystack_ref,
    'pending',
    v_order_items,
    p_shipping_address,
    jsonb_build_object(
      'delivery_method', p_delivery_method,
      'delivery_price', p_delivery_fee,
      'estimated_days', 3,
      'pickup_address', null
    ),
    jsonb_build_object(
      'book_total', v_total_book_price,
      'delivery_fee', p_delivery_fee,
      'platform_fee', p_platform_fee,
      'seller_amount', p_seller_amount,
      'created_by_function', true
    ),
    NOW()
  ) RETURNING id INTO v_order_id;
  
  -- 5. Reserve books (mark as reserved but not sold yet)
  UPDATE books 
  SET availability = 'reserved',
      updated_at = NOW()
  WHERE id = ANY(p_book_ids);
  
  -- 6. Return success with order details
  SELECT row_to_json(o.*) INTO v_result
  FROM orders o 
  WHERE o.id = v_order_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'order', v_result,
    'message', 'Order created successfully'
  );
  
EXCEPTION 
  WHEN OTHERS THEN
    -- Return error details
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Function to complete payment and finalize order
CREATE OR REPLACE FUNCTION complete_payment_transaction(
  p_paystack_ref TEXT,
  p_book_ids UUID[],
  p_verification_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_record RECORD;
  v_result JSONB;
BEGIN
  -- 1. Find and lock the order
  SELECT id, seller_id, buyer_email, status, amount
  INTO v_order_record
  FROM orders 
  WHERE paystack_ref = p_paystack_ref
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Order not found'
    );
  END IF;
  
  IF v_order_record.status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Order status is %s, expected pending', v_order_record.status)
    );
  END IF;
  
  -- 2. Update order status to paid
  UPDATE orders 
  SET 
    status = 'paid',
    paid_at = NOW(),
    updated_at = NOW(),
    metadata = metadata || jsonb_build_object(
      'paystack_verification', p_verification_data,
      'completed_at', NOW()
    )
  WHERE id = v_order_record.id;
  
  -- 3. Mark books as sold
  UPDATE books 
  SET 
    sold = true,
    availability = 'sold',
    sold_at = NOW(),
    updated_at = NOW()
  WHERE id = ANY(p_book_ids);
  
  -- 4. Log the successful transaction
  INSERT INTO activity_logs (
    user_id,
    action,
    details,
    created_at
  ) VALUES (
    (SELECT auth.uid()),
    'order_completed',
    jsonb_build_object(
      'order_id', v_order_record.id,
      'paystack_ref', p_paystack_ref,
      'amount', v_order_record.amount,
      'book_ids', p_book_ids
    ),
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_record.id,
    'message', 'Payment completed successfully'
  );
  
EXCEPTION 
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Function to cleanup failed orders
CREATE OR REPLACE FUNCTION cleanup_failed_order(
  p_order_id UUID,
  p_paystack_ref TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_book_ids UUID[];
BEGIN
  -- 1. Get book IDs from the order
  SELECT array_agg((item->>'book_id')::UUID)
  INTO v_book_ids
  FROM orders,
       jsonb_array_elements(items) AS item
  WHERE id = p_order_id;
  
  -- 2. Release book reservations
  IF v_book_ids IS NOT NULL THEN
    UPDATE books 
    SET 
      availability = 'available',
      updated_at = NOW()
    WHERE id = ANY(v_book_ids)
    AND availability = 'reserved'; -- Only update if still reserved
  END IF;
  
  -- 3. Delete the failed order
  DELETE FROM orders 
  WHERE id = p_order_id 
  OR paystack_ref = p_paystack_ref;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Failed order cleaned up successfully'
  );
  
EXCEPTION 
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Function to check and expire old pending orders (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_orders()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expired_count INTEGER := 0;
  v_expired_order RECORD;
BEGIN
  -- Find orders that are pending for more than 1 hour
  FOR v_expired_order IN (
    SELECT id, paystack_ref, 
           array_agg((item->>'book_id')::UUID) as book_ids
    FROM orders,
         jsonb_array_elements(items) AS item
    WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '1 hour'
    GROUP BY id, paystack_ref
  ) LOOP
    
    -- Release book reservations
    UPDATE books 
    SET 
      availability = 'available',
      updated_at = NOW()
    WHERE id = ANY(v_expired_order.book_ids)
    AND availability = 'reserved';
    
    -- Update order status to cancelled
    UPDATE orders 
    SET 
      status = 'cancelled',
      updated_at = NOW(),
      metadata = metadata || jsonb_build_object(
        'cancelled_reason', 'expired',
        'cancelled_at', NOW()
      )
    WHERE id = v_expired_order.id;
    
    v_expired_count := v_expired_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'expired_orders', v_expired_count,
    'message', format('Cleaned up %s expired orders', v_expired_count)
  );
END;
$$;

-- Create activity_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for activity logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_order_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION complete_payment_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_failed_order TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_orders TO service_role;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON activity_logs TO authenticated;
GRANT ALL ON activity_logs TO service_role;
