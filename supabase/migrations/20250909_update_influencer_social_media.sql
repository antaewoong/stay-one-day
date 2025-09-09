-- Update influencers table to use dynamic social media links instead of individual columns
ALTER TABLE influencers 
DROP COLUMN IF EXISTS instagram_handle,
DROP COLUMN IF EXISTS youtube_channel,
DROP COLUMN IF EXISTS tiktok_handle,
DROP COLUMN IF EXISTS blog_url;

-- Add social media links as JSON column
ALTER TABLE influencers 
ADD COLUMN social_media_links JSONB DEFAULT '[]'::jsonb;

-- Update existing sample data to use new structure
UPDATE influencers 
SET social_media_links = jsonb_build_array(
  jsonb_build_object('platform', 'instagram', 'url', '@travel_lover_jieun'),
  jsonb_build_object('platform', 'youtube', 'url', '지은의 여행일기'),
  jsonb_build_object('platform', 'blog', 'url', 'https://blog.naver.com/jieun_travel')
)
WHERE name = '여행러버_지은';

UPDATE influencers 
SET social_media_links = jsonb_build_array(
  jsonb_build_object('platform', 'instagram', 'url', '@emotional_camping'),
  jsonb_build_object('platform', 'youtube', 'url', '민수의 감성캠핑')
)
WHERE name = '감성캠핑_민수';

UPDATE influencers 
SET social_media_links = jsonb_build_array(
  jsonb_build_object('platform', 'instagram', 'url', '@pension_review_sy'),
  jsonb_build_object('platform', 'blog', 'url', 'https://blog.naver.com/pension_review')
)
WHERE name = '펜션리뷰_소영';

UPDATE influencers 
SET social_media_links = jsonb_build_array(
  jsonb_build_object('platform', 'instagram', 'url', '@healing_stay_jh'),
  jsonb_build_object('platform', 'youtube', 'url', '준호의 힐링스테이')
)
WHERE name = '힐링스테이_준호';

-- Create index for social media links queries
CREATE INDEX IF NOT EXISTS idx_influencers_social_media_links ON influencers USING GIN(social_media_links);