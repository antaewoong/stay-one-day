-- Fix database schema to match API expectations
-- This script updates the accommodations table structure

-- Add missing columns that the API expects
ALTER TABLE accommodations 
  ADD COLUMN IF NOT EXISTS accommodation_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS address VARCHAR(255),
  ADD COLUMN IF NOT EXISTS region VARCHAR(100),
  ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS checkin_time TIME DEFAULT '15:00',
  ADD COLUMN IF NOT EXISTS checkout_time TIME DEFAULT '23:00',
  ADD COLUMN IF NOT EXISTS host_id UUID,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS bedrooms INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS bathrooms INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS weekend_price INTEGER,
  ADD COLUMN IF NOT EXISTS business_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS usage_guide TEXT,
  ADD COLUMN IF NOT EXISTS refund_policy TEXT,
  ADD COLUMN IF NOT EXISTS seller_info TEXT,
  ADD COLUMN IF NOT EXISTS extra_options JSONB DEFAULT '[]'::jsonb;

-- Update existing data if any exists
UPDATE accommodations 
SET 
  accommodation_type = COALESCE(accommodation_type, type),
  address = COALESCE(address, location),
  region = COALESCE(region, SPLIT_PART(location, ' ', 1)),
  max_capacity = COALESCE(max_capacity, max_guests),
  checkin_time = COALESCE(checkin_time, check_in_time),
  checkout_time = COALESCE(checkout_time, check_out_time)
WHERE accommodation_type IS NULL OR address IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accommodations_region ON accommodations(region);
CREATE INDEX IF NOT EXISTS idx_accommodations_accommodation_type ON accommodations(accommodation_type);
CREATE INDEX IF NOT EXISTS idx_accommodations_status ON accommodations(status);
CREATE INDEX IF NOT EXISTS idx_accommodations_host_id ON accommodations(host_id);

-- Add host table if it doesn't exist
CREATE TABLE IF NOT EXISTS hosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  host_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  commission_rate DECIMAL(4,2) DEFAULT 0.05,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS for hosts table
ALTER TABLE hosts ENABLE ROW LEVEL SECURITY;

-- Host RLS policies
CREATE POLICY "Hosts can view their own data" ON hosts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Hosts can update their own data" ON hosts
  FOR UPDATE USING (auth.uid() = user_id);

-- Add foreign key constraint for host_id in accommodations
ALTER TABLE accommodations 
  ADD CONSTRAINT fk_accommodations_host_id 
  FOREIGN KEY (host_id) REFERENCES hosts(id) ON DELETE CASCADE;

-- Insert sample host data
INSERT INTO hosts (user_id, business_name, host_name, phone, email) 
SELECT 
  id,
  'Stay One Day',
  'System Host',
  '02-1234-5678',
  'host@stay-oneday.com'
FROM auth.users 
WHERE email = 'admin@stay-oneday.com'
ON CONFLICT (user_id) DO NOTHING;