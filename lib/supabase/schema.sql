-- Stay One Day Database Schema
-- 이 스키마를 Supabase SQL Editor에서 실행하세요

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (카카오 로그인 사용자)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  profile_image VARCHAR(512),
  kakao_id VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hosts table (스테이 운영자)
CREATE TABLE hosts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  business_number VARCHAR(20) UNIQUE,
  representative_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  bank_name VARCHAR(100),
  account_number VARCHAR(50),
  account_holder VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  commission_rate DECIMAL(4,2) DEFAULT 5.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table (스테이 카테고리)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stays table (스테이 정보)
CREATE TABLE stays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID REFERENCES hosts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  address TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  base_capacity INTEGER NOT NULL DEFAULT 4,
  max_capacity INTEGER NOT NULL DEFAULT 8,
  base_price INTEGER NOT NULL,
  extra_person_fee INTEGER DEFAULT 0,
  check_in_time TIME DEFAULT '15:00',
  check_out_time TIME DEFAULT '23:00',
  amenities JSONB DEFAULT '[]',
  rules TEXT,
  cancellation_policy JSONB,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'active', 'inactive', 'suspended')),
  rating DECIMAL(3,2) DEFAULT 0.0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stay images table
CREATE TABLE stay_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stay_id UUID REFERENCES stays(id) ON DELETE CASCADE,
  image_url VARCHAR(512) NOT NULL,
  alt_text VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Options table (스테이 옵션)
CREATE TABLE stay_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stay_id UUID REFERENCES stays(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INTEGER DEFAULT 0,
  option_type VARCHAR(50) NOT NULL,
  is_included BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reservations table (예약 정보)
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  stay_id UUID REFERENCES stays(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  usage_start_time TIME NOT NULL DEFAULT '15:00',
  usage_end_time TIME NOT NULL DEFAULT '23:00',
  guest_count INTEGER NOT NULL,
  base_price INTEGER NOT NULL,
  extra_fee INTEGER DEFAULT 0,
  option_fee INTEGER DEFAULT 0,
  total_price INTEGER NOT NULL,
  special_requests TEXT,
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'in_use', 'completed', 'cancelled', 'no_show')),
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table (결제 정보)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('card', 'kakaopay', 'transfer')),
  payment_provider VARCHAR(100),
  card_number VARCHAR(20),
  approval_number VARCHAR(100),
  payment_key VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  fee_amount INTEGER DEFAULT 0,
  actual_amount INTEGER NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table (리뷰)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  stay_id UUID REFERENCES stays(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  content TEXT NOT NULL,
  images JSONB DEFAULT '[]',
  host_reply TEXT,
  host_reply_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('pending', 'published', 'hidden', 'reported')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS templates table (문자 템플릿)
CREATE TABLE sms_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stay_id UUID REFERENCES stays(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  message_content TEXT NOT NULL,
  template_type VARCHAR(20) NOT NULL CHECK (template_type IN ('check_in', 'check_out')),
  send_timing VARCHAR(20) NOT NULL CHECK (send_timing IN ('booking', 'day_before', 'check_in_time', 'manual')),
  send_time TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notices table (공지사항)
CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID REFERENCES hosts(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  notice_type VARCHAR(20) DEFAULT 'general' CHECK (notice_type IN ('general', 'urgent', 'maintenance')),
  is_pinned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settlement reports table (정산 리포트)
CREATE TABLE settlement_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID REFERENCES hosts(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_revenue INTEGER NOT NULL DEFAULT 0,
  platform_fee INTEGER NOT NULL DEFAULT 0,
  net_revenue INTEGER NOT NULL DEFAULT 0,
  fee_rate DECIMAL(4,2) NOT NULL DEFAULT 5.00,
  reservation_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed')),
  settlement_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_stays_host_id ON stays(host_id);
CREATE INDEX idx_stays_category_id ON stays(category_id);
CREATE INDEX idx_stays_status ON stays(status);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_stay_id ON reservations(stay_id);
CREATE INDEX idx_reservations_check_in_date ON reservations(check_in_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_payments_reservation_id ON payments(reservation_id);
CREATE INDEX idx_reviews_stay_id ON reviews(stay_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);

-- RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stays ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be customized based on requirements)
-- Users can read and update their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Stays are publicly readable but only editable by the host
CREATE POLICY "Stays are publicly readable" ON stays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Hosts can manage their stays" ON stays FOR ALL USING (auth.uid() IN (SELECT user_id FROM hosts WHERE id = host_id));

-- Insert initial categories
INSERT INTO categories (name, description, icon) VALUES
('프라이빗독채', '프라이빗 독채형 스테이', 'home'),
('한옥체험', '전통 한옥 체험 공간', 'temple'),
('키즈전용', '아이들과 함께하는 키즈 전용 공간', 'baby'),
('사계절온수풀', '사계절 이용 가능한 온수풀', 'waves'),
('반려견동반', '반려견과 함께하는 공간', 'dog'),
('오션뷰', '바다 전망을 즐길 수 있는 공간', 'eye');

-- Trigger to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hosts_updated_at BEFORE UPDATE ON hosts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stays_updated_at BEFORE UPDATE ON stays FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notices_updated_at BEFORE UPDATE ON notices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();