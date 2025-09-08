#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fcmauibvdqbocwhloqov.supabase.co'
const supabaseKey = '[REMOVED_SUPABASE_SERVICE_KEY]'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupReviewsSchema() {
  try {
    console.log('🛠️ Setting up reviews table schema...\n')
    
    // SQL to add missing columns
    const alterTableSQL = `
      DO $$
      BEGIN
          -- user_name 컬럼 추가
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'reviews' AND column_name = 'user_name') THEN
              ALTER TABLE reviews ADD COLUMN user_name TEXT;
          END IF;
          
          -- accommodation_id 컬럼 추가
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'reviews' AND column_name = 'accommodation_id') THEN
              ALTER TABLE reviews ADD COLUMN accommodation_id UUID REFERENCES accommodations(id);
          END IF;
          
          -- rating 컬럼 추가
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'reviews' AND column_name = 'rating') THEN
              ALTER TABLE reviews ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);
          END IF;
          
          -- content 컬럼 추가
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'reviews' AND column_name = 'content') THEN
              ALTER TABLE reviews ADD COLUMN content TEXT;
          END IF;
          
          -- user_email 컬럼 추가
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'reviews' AND column_name = 'user_email') THEN
              ALTER TABLE reviews ADD COLUMN user_email TEXT;
          END IF;
          
          -- is_verified 컬럼 추가
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'reviews' AND column_name = 'is_verified') THEN
              ALTER TABLE reviews ADD COLUMN is_verified BOOLEAN DEFAULT false;
          END IF;
          
          -- host_response 컬럼 추가
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'reviews' AND column_name = 'host_response') THEN
              ALTER TABLE reviews ADD COLUMN host_response TEXT;
          END IF;
          
          -- host_response_date 컬럼 추가
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'reviews' AND column_name = 'host_response_date') THEN
              ALTER TABLE reviews ADD COLUMN host_response_date TIMESTAMPTZ;
          END IF;
          
          -- helpful_count 컬럼 추가
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'reviews' AND column_name = 'helpful_count') THEN
              ALTER TABLE reviews ADD COLUMN helpful_count INTEGER DEFAULT 0;
          END IF;
          
          -- is_visible 컬럼 추가
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'reviews' AND column_name = 'is_visible') THEN
              ALTER TABLE reviews ADD COLUMN is_visible BOOLEAN DEFAULT true;
          END IF;

          RAISE NOTICE 'Reviews table columns updated successfully';
      END
      $$;
    `
    
    console.log('🔧 Adding missing columns to reviews table...')
    const { error: alterError } = await supabase.from('_sql').insert({ query: alterTableSQL })
    
    if (alterError) {
      console.error('❌ 테이블 수정 실패:', alterError.message)
      return
    }
    
    console.log('✅ 테이블 구조 수정 완료')
    
    // 통계 뷰 생성
    console.log('📊 Creating accommodation stats view...')
    
    const createViewSQL = `
      CREATE OR REPLACE VIEW accommodation_stats AS
      SELECT 
          a.id,
          a.name,
          COUNT(r.id) as review_count,
          COALESCE(ROUND(AVG(r.rating::numeric), 1), 0) as average_rating,
          COUNT(CASE WHEN r.rating = 5 THEN 1 END) as rating_5_count,
          COUNT(CASE WHEN r.rating = 4 THEN 1 END) as rating_4_count,
          COUNT(CASE WHEN r.rating = 3 THEN 1 END) as rating_3_count,
          COUNT(CASE WHEN r.rating = 2 THEN 1 END) as rating_2_count,
          COUNT(CASE WHEN r.rating = 1 THEN 1 END) as rating_1_count
      FROM accommodations a
      LEFT JOIN reviews r ON a.id = r.accommodation_id AND r.is_visible = true
      GROUP BY a.id, a.name;
    `
    
    const { error: viewError } = await supabase.rpc('exec_sql', { sql: createViewSQL })
    
    if (viewError) {
      console.error('❌ 뷰 생성 실패:', viewError.message)
    } else {
      console.log('✅ accommodation_stats 뷰 생성 완료')
    }
    
    // 인덱스 생성
    console.log('🚀 Creating indexes for performance...')
    
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_reviews_accommodation_id ON reviews(accommodation_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
      CREATE INDEX IF NOT EXISTS idx_reviews_is_visible ON reviews(is_visible);
      CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
    `
    
    const { error: indexError } = await supabase.rpc('exec_sql', { sql: createIndexesSQL })
    
    if (indexError) {
      console.error('❌ 인덱스 생성 실패:', indexError.message)
    } else {
      console.log('✅ 성능 인덱스 생성 완료')
    }
    
    console.log('\n✅ Reviews 스키마 설정 완료!')
    console.log('이제 scripts/populate-simple-reviews.js를 실행할 수 있습니다.')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

setupReviewsSchema()