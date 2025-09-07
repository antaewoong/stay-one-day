-- Create inquiry tables for partnership and hosting inquiries

-- Partnership inquiries table
CREATE TABLE IF NOT EXISTS partnership_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  business_type VARCHAR(100) NOT NULL,
  inquiry TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Partner (hosting) inquiries table  
CREATE TABLE IF NOT EXISTS partner_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  website_url VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  space_type VARCHAR(100) NOT NULL,
  daily_rate VARCHAR(100) NOT NULL,
  average_idle_days VARCHAR(100) NOT NULL,
  parking_spaces VARCHAR(100),
  amenities TEXT,
  notes TEXT,
  privacy_consent BOOLEAN NOT NULL DEFAULT false,
  marketing_consent BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  admin_notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_partnership_inquiries_status ON partnership_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_partnership_inquiries_created_at ON partnership_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_inquiries_status ON partner_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_partner_inquiries_created_at ON partner_inquiries(created_at DESC);

-- Enable RLS
ALTER TABLE partnership_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_inquiries ENABLE ROW LEVEL SECURITY;

-- Admin can view all inquiries
CREATE POLICY "Admin can view all partnership inquiries" ON partnership_inquiries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.uid() = id 
      AND email = 'admin@stay-oneday.com'
    )
  );

CREATE POLICY "Admin can update partnership inquiries" ON partnership_inquiries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.uid() = id 
      AND email = 'admin@stay-oneday.com'
    )
  );

CREATE POLICY "Admin can view all partner inquiries" ON partner_inquiries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.uid() = id 
      AND email = 'admin@stay-oneday.com'
    )
  );

CREATE POLICY "Admin can update partner inquiries" ON partner_inquiries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.uid() = id 
      AND email = 'admin@stay-oneday.com'
    )
  );

-- Contact inquiries table (1:1 문의)
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  admin_notes TEXT
);

-- Create indexes for contact inquiries
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON contact_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON contact_inquiries(created_at DESC);

-- Enable RLS for contact inquiries
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Admin can view all contact inquiries
CREATE POLICY "Admin can view all contact inquiries" ON contact_inquiries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.uid() = id 
      AND email = 'admin@stay-oneday.com'
    )
  );

CREATE POLICY "Admin can update contact inquiries" ON contact_inquiries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.uid() = id 
      AND email = 'admin@stay-oneday.com'
    )
  );

-- Anyone can insert inquiries (for form submissions)
CREATE POLICY "Anyone can submit partnership inquiries" ON partnership_inquiries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can submit partner inquiries" ON partner_inquiries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can submit contact inquiries" ON contact_inquiries
  FOR INSERT WITH CHECK (true);