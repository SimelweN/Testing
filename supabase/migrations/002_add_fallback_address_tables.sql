-- Create user_addresses table for dual address storage
CREATE TABLE IF NOT EXISTS user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('shipping', 'pickup', 'billing')),
  
  -- Google Maps data (high confidence)
  google_maps_data JSONB,
  
  -- Manual entry data (medium/low confidence)
  manual_entry_data JSONB,
  
  -- Which method was selected by user
  selected_method TEXT NOT NULL CHECK (selected_method IN ('google_maps', 'manual_entry')),
  
  -- Primary address for this type
  is_primary BOOLEAN DEFAULT FALSE,
  
  -- Metadata for tracking and validation
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure only one primary address per user per type
  CONSTRAINT unique_primary_per_type UNIQUE (user_id, type, is_primary) DEFERRABLE INITIALLY DEFERRED
);

-- Create partial unique index to allow only one primary address per user per type
DROP INDEX IF EXISTS idx_user_addresses_primary_unique;
CREATE UNIQUE INDEX idx_user_addresses_primary_unique 
ON user_addresses (user_id, type) 
WHERE is_primary = true;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_type ON user_addresses(type);
CREATE INDEX IF NOT EXISTS idx_user_addresses_selected_method ON user_addresses(selected_method);
CREATE INDEX IF NOT EXISTS idx_user_addresses_created_at ON user_addresses(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_addresses_updated_at ON user_addresses;
CREATE TRIGGER update_user_addresses_updated_at
  BEFORE UPDATE ON user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create address validation history table
CREATE TABLE IF NOT EXISTS address_validation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address_id UUID REFERENCES user_addresses(id) ON DELETE CASCADE,
  validation_method TEXT NOT NULL CHECK (validation_method IN ('google_maps', 'manual_check', 'courier_validation')),
  validation_result JSONB NOT NULL,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  validated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Store the address data that was validated
  validated_address_data JSONB NOT NULL
);

-- Create indexes for validation history
CREATE INDEX IF NOT EXISTS idx_address_validation_history_user_address_id ON address_validation_history(user_address_id);
CREATE INDEX IF NOT EXISTS idx_address_validation_history_validated_at ON address_validation_history(validated_at);
CREATE INDEX IF NOT EXISTS idx_address_validation_history_confidence_score ON address_validation_history(confidence_score);

-- Create function to get best address for user
CREATE OR REPLACE FUNCTION get_best_user_address(
  p_user_id UUID,
  p_address_type TEXT DEFAULT 'shipping'
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Get the primary address of the specified type, or the most recent one
  SELECT 
    CASE 
      WHEN google_maps_data IS NOT NULL THEN google_maps_data
      ELSE manual_entry_data
    END
  INTO result
  FROM user_addresses
  WHERE user_id = p_user_id 
    AND type = p_address_type
    AND (google_maps_data IS NOT NULL OR manual_entry_data IS NOT NULL)
  ORDER BY is_primary DESC, created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to set primary address
CREATE OR REPLACE FUNCTION set_primary_address(
  p_address_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  address_type TEXT;
BEGIN
  -- Get the type of the address being set as primary
  SELECT type INTO address_type
  FROM user_addresses
  WHERE id = p_address_id AND user_id = p_user_id;
  
  IF address_type IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Unset all primary addresses of this type for this user
  UPDATE user_addresses
  SET is_primary = FALSE
  WHERE user_id = p_user_id AND type = address_type;
  
  -- Set the specified address as primary
  UPDATE user_addresses
  SET is_primary = TRUE
  WHERE id = p_address_id AND user_id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS)
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE address_validation_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_addresses
DROP POLICY IF EXISTS "Users can view own addresses" ON user_addresses;
CREATE POLICY "Users can view own addresses" ON user_addresses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own addresses" ON user_addresses;
CREATE POLICY "Users can insert own addresses" ON user_addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own addresses" ON user_addresses;
CREATE POLICY "Users can update own addresses" ON user_addresses
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own addresses" ON user_addresses;
CREATE POLICY "Users can delete own addresses" ON user_addresses
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for address_validation_history
DROP POLICY IF EXISTS "Users can view own validation history" ON address_validation_history;
CREATE POLICY "Users can view own validation history" ON address_validation_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_addresses ua 
      WHERE ua.id = user_address_id AND ua.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own validation history" ON address_validation_history;
CREATE POLICY "Users can insert own validation history" ON address_validation_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_addresses ua 
      WHERE ua.id = user_address_id AND ua.user_id = auth.uid()
    )
  );

-- Grant permissions to authenticated users
GRANT ALL ON user_addresses TO authenticated;
GRANT ALL ON address_validation_history TO authenticated;
GRANT EXECUTE ON FUNCTION get_best_user_address(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION set_primary_address(UUID, UUID) TO authenticated;

-- Add helpful comments
COMMENT ON TABLE user_addresses IS 'Stores user addresses with dual storage (Google Maps + Manual entry) for fallback functionality';
COMMENT ON COLUMN user_addresses.google_maps_data IS 'Address data from Google Maps API (high confidence)';
COMMENT ON COLUMN user_addresses.manual_entry_data IS 'Manually entered address data (medium/low confidence)';
COMMENT ON COLUMN user_addresses.selected_method IS 'Which method the user actually used to enter this address';
COMMENT ON COLUMN user_addresses.metadata IS 'Additional metadata like confidence level, validation attempts, fallback reason';

COMMENT ON TABLE address_validation_history IS 'Tracks validation attempts and results for addresses';
COMMENT ON FUNCTION get_best_user_address(UUID, TEXT) IS 'Returns the best available address for a user, prioritizing Google Maps data';
COMMENT ON FUNCTION set_primary_address(UUID, UUID) IS 'Sets an address as primary and unsets others of the same type';

COMMIT;
