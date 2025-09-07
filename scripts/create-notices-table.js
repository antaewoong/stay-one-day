#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fcmauibvdqbocwhloqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjbWF1aWJ2ZHFib2N3aGxvcW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjgwODY3OCwiZXhwIjoyMDcyMzg0Njc4fQ.vwEr3cyiQSWBabAgoodWUzBSewrVTco3kFg_w-ae1D0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createNoticesTable() {
  try {
    console.log('Creating notices table and inserting sample data...')
    
    // First, let's check if the notices table exists by trying to query it
    const { data: existingNotices, error: queryError } = await supabase
      .from('notices')
      .select('*')
      .limit(1)
    
    if (queryError && queryError.code === 'PGRST116') {
      console.log('Notices table does not exist. Please create it manually in Supabase dashboard.')
      console.log('SQL to create the table:')
      console.log(`
CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name VARCHAR(100) NOT NULL,
  author_role VARCHAR(50) DEFAULT 'admin',
  views INTEGER NOT NULL DEFAULT 0,
  is_important BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  target_audience VARCHAR(20) DEFAULT 'all',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view published notices" ON notices
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage notices" ON notices
  FOR ALL USING (auth.uid() IS NOT NULL);
      `)
      return
    }
    
    if (!existingNotices || existingNotices.length === 0) {
      console.log('Table exists but is empty. Inserting sample data...')
      
      const sampleNotices = [
        {
          title: '시설가격 모니터링 팀장 요청',
          content: '시설 가격 모니터링 관련 업무 조율이 필요합니다. 각 숙소별 가격 변동 사항을 점검해 주시기 바랍니다.',
          author_name: '구공-박소정',
          author_role: 'manager',
          views: 10,
          is_important: false,
          target_audience: 'hosts'
        },
        {
          title: '[공지] 대기업 대상 10% 할인율로 홍보준비',
          content: '대기업 고객 대상 특별 할인 프로모션을 준비 중입니다. 관련 숙소 등록 및 준비사항을 확인해 주세요.',
          author_name: '구공-관리자',
          author_role: 'admin',
          views: 17,
          is_important: true,
          target_audience: 'all'
        },
        {
          title: '[공지] 월 정기 점검 안내',
          content: '매월 정기 시스템 점검이 예정되어 있습니다. 점검 시간 동안 서비스 이용에 제한이 있을 수 있습니다.',
          author_name: '구공-관리자',
          author_role: 'admin',
          views: 14,
          is_important: true,
          target_audience: 'all'
        },
        {
          title: '[시스템] 새로운 예약 관리 기능 업데이트',
          content: '예약 관리 시스템에 새로운 기능이 추가되었습니다. 대시보드에서 확인해 보세요.',
          author_name: '구공-관리자',
          author_role: 'admin',
          views: 8,
          is_important: false,
          target_audience: 'hosts'
        },
        {
          title: '고객 문의 응답 가이드라인 변경',
          content: '고객 문의 응답 시 새로운 가이드라인이 적용됩니다. 첨부된 매뉴얼을 참고해 주세요.',
          author_name: '구공-박소정',
          author_role: 'manager',
          views: 12,
          is_important: false,
          target_audience: 'hosts'
        }
      ]
      
      const { error: insertError } = await supabase
        .from('notices')
        .insert(sampleNotices)
      
      if (insertError) {
        console.error('Error inserting sample notices:', insertError.message)
      } else {
        console.log('✅ Sample notices inserted successfully!')
      }
    } else {
      console.log('Notices table already has data.')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

createNoticesTable()