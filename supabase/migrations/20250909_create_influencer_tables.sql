-- Create influencers table
CREATE TABLE IF NOT EXISTS influencers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  instagram_handle VARCHAR(100),
  youtube_channel VARCHAR(100),
  tiktok_handle VARCHAR(100),
  blog_url TEXT,
  follower_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(3,2) DEFAULT 0,
  average_views INTEGER DEFAULT 0,
  content_category TEXT[] DEFAULT '{}',
  collaboration_rate INTEGER DEFAULT 0,
  preferred_collaboration_type VARCHAR(20) CHECK (preferred_collaboration_type IN ('paid', 'barter', 'both')) DEFAULT 'both',
  bio TEXT,
  profile_image_url TEXT,
  location VARCHAR(50),
  status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'pending', 'suspended')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create influencer_posts table for community board
CREATE TABLE IF NOT EXISTS influencer_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  influencer_id UUID REFERENCES influencers(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  post_type VARCHAR(20) CHECK (post_type IN ('general', 'collaboration_request', 'showcase', 'question')) DEFAULT 'general',
  images TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) CHECK (status IN ('published', 'draft', 'hidden')) DEFAULT 'published',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create influencer_post_comments table
CREATE TABLE IF NOT EXISTS influencer_post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES influencer_posts(id) ON DELETE CASCADE,
  influencer_id UUID REFERENCES influencers(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES influencer_post_comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create influencer_collaboration_requests table
CREATE TABLE IF NOT EXISTS influencer_collaboration_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  influencer_id UUID REFERENCES influencers(id) ON DELETE CASCADE,
  accommodation_id UUID REFERENCES accommodations(id) ON DELETE CASCADE,
  host_id UUID REFERENCES hosts(id) ON DELETE CASCADE,
  request_type VARCHAR(20) CHECK (request_type IN ('paid', 'barter', 'partnership')) NOT NULL,
  proposed_rate INTEGER,
  message TEXT,
  check_in_date DATE,
  check_out_date DATE,
  guest_count INTEGER DEFAULT 1,
  status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')) DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_influencers_status ON influencers(status);
CREATE INDEX IF NOT EXISTS idx_influencers_content_category ON influencers USING GIN(content_category);
CREATE INDEX IF NOT EXISTS idx_influencer_posts_influencer_id ON influencer_posts(influencer_id);
CREATE INDEX IF NOT EXISTS idx_influencer_posts_status ON influencer_posts(status);
CREATE INDEX IF NOT EXISTS idx_influencer_posts_created_at ON influencer_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_influencer_post_comments_post_id ON influencer_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_requests_status ON influencer_collaboration_requests(status);
CREATE INDEX IF NOT EXISTS idx_collaboration_requests_influencer_id ON influencer_collaboration_requests(influencer_id);

-- Insert sample data
INSERT INTO influencers (name, email, phone, instagram_handle, youtube_channel, tiktok_handle, blog_url, follower_count, engagement_rate, average_views, content_category, collaboration_rate, preferred_collaboration_type, bio, profile_image_url, location, status) VALUES 
('여행러버_지은', 'jieun@travel.com', '010-1234-5678', '@travel_lover_jieun', '지은의 여행일기', '@jieun_travel', 'https://blog.naver.com/jieun_travel', 45000, 4.2, 8500, ARRAY['여행', '라이프스타일', '맛집'], 500000, 'both', '전국 곳곳을 누비며 숨겨진 맛집과 여행지를 소개하는 여행 인플루언서입니다.', 'https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=150&h=150&fit=crop&crop=face', '서울', 'active'),
('감성캠핑_민수', 'minsu@camping.com', '010-5678-9012', '@emotional_camping', '민수의 감성캠핑', NULL, NULL, 28000, 5.8, 12000, ARRAY['캠핑', '아웃도어', '힐링'], 300000, 'barter', '자연과 함께하는 감성 캠핑과 힐링 콘텐츠를 만듭니다.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', '부산', 'active'),
('펜션리뷰_소영', 'soyoung@pension.com', '010-9876-5432', '@pension_review_sy', NULL, NULL, 'https://blog.naver.com/pension_review', 35000, 3.9, 6800, ARRAY['펜션', '풀빌라', '가족여행'], 400000, 'paid', '가족과 함께하는 국내 펜션 및 풀빌라 전문 리뷰어입니다.', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', '경기', 'active'),
('힐링스테이_준호', 'junho@healing.com', '010-2468-1357', '@healing_stay_jh', '준호의 힐링스테이', NULL, NULL, 52000, 4.7, 15200, ARRAY['힐링', '독채', '커플여행'], 600000, 'both', '바쁜 일상에서 벗어나 힐링할 수 있는 국내 숙소를 소개합니다.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', '대전', 'active')
ON CONFLICT (email) DO NOTHING;

-- Update function for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_influencers_updated_at BEFORE UPDATE ON influencers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_influencer_posts_updated_at BEFORE UPDATE ON influencer_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_influencer_post_comments_updated_at BEFORE UPDATE ON influencer_post_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collaboration_requests_updated_at BEFORE UPDATE ON influencer_collaboration_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();