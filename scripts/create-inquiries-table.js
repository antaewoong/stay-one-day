#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fcmauibvdqbocwhloqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjbWF1aWJ2ZHFib2N3aGxvcW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjgwODY3OCwiZXhwIjoyMDcyMzg0Njc4fQ.vwEr3cyiQSWBabAgoodWUzBSewrVTco3kFg_w-ae1D0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createInquiriesTable() {
  try {
    console.log('📝 Creating inquiries table and populating with sample data...\n')
    
    // inquiries 테이블이 존재하는지 먼저 확인
    const { data: existingData, error: checkError } = await supabase
      .from('inquiries')
      .select('*')
      .limit(1)
    
    if (!checkError) {
      console.log('✅ inquiries table already exists')
    } else if (checkError.code === 'PGRST116') {
      console.log('❌ inquiries table does not exist - need to create manually in Supabase dashboard')
    } else {
      console.log('⚠️ inquiries table access error:', checkError.message)
    }
    
    // 샘플 데이터로 문의사항 생성 (테이블이 존재한다고 가정)
    const inquiries = [
      {
        user_name: '김철수',
        user_email: 'kimcs@example.com',
        user_phone: '010-1234-5678',
        inquiry_type: 'booking',
        title: '예약 취소 관련 문의',
        content: '예약했던 숙소를 취소하고 싶은데 환불 정책이 궁금합니다.',
        status: 'pending',
        priority: 'medium',
        accommodation_id: null
      },
      {
        user_name: '박영희',
        user_email: 'parkyh@example.com',
        user_phone: '010-9876-5432',
        inquiry_type: 'service',
        title: '숙소 시설 문제',
        content: '체크인했는데 온수가 나오지 않습니다. 빠른 조치 부탁드립니다.',
        status: 'in_progress',
        priority: 'high',
        accommodation_id: null
      },
      {
        user_name: '이민수',
        user_email: 'leems@example.com',
        user_phone: '010-5555-7777',
        inquiry_type: 'general',
        title: '결제 방법 문의',
        content: '현장에서 현금 결제가 가능한지 문의드립니다.',
        status: 'resolved',
        priority: 'low',
        accommodation_id: null
      },
      {
        user_name: '정수진',
        user_email: 'jungsj@example.com',
        user_phone: '010-3333-4444',
        inquiry_type: 'booking',
        title: '추가 인원 예약 가능 여부',
        content: '원래 4명으로 예약했는데 6명으로 변경이 가능한지 문의드립니다.',
        status: 'pending',
        priority: 'medium',
        accommodation_id: null
      },
      {
        user_name: '최현진',
        user_email: 'choihj@example.com',
        user_phone: '010-7777-8888',
        inquiry_type: 'complaint',
        title: '청소 상태 불만',
        content: '체크인했는데 청소가 제대로 되어있지 않았습니다. 개선 부탁드립니다.',
        status: 'resolved',
        priority: 'high',
        accommodation_id: null
      }
    ]
    
    console.log(`Trying to insert ${inquiries.length} inquiries...`)
    
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .insert(inquiries)
        .select()
      
      if (error) {
        console.error('❌ Insert error:', error.message)
        console.log('\n⚠️ The inquiries table may not exist or have different column structure.')
        console.log('   Please create the table manually in Supabase dashboard with these columns:')
        console.log('   - id (uuid, primary key)')
        console.log('   - user_name (text)')
        console.log('   - user_email (text)')
        console.log('   - user_phone (text, optional)')
        console.log('   - inquiry_type (text)')
        console.log('   - title (text)')
        console.log('   - content (text)')
        console.log('   - status (text, default: pending)')
        console.log('   - priority (text, default: medium)')
        console.log('   - accommodation_id (uuid, optional)')
        console.log('   - admin_response (text, optional)')
        console.log('   - admin_id (uuid, optional)')
        console.log('   - responded_at (timestamptz, optional)')
        console.log('   - created_at (timestamptz, default: now())')
        console.log('   - updated_at (timestamptz, default: now())')
        return
      }
      
      console.log('✅ Successfully inserted inquiries:')
      data.forEach((inquiry, index) => {
        console.log(`   ${index + 1}. ${inquiry.title} - ${inquiry.user_name} (${inquiry.status})`)
      })
      
    } catch (insertError) {
      console.error('❌ Failed to insert inquiries:', insertError.message)
    }
    
    console.log('\n📊 Checking total inquiries count...')
    
    try {
      const { count } = await supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
      
      console.log(`   Total inquiries in database: ${count}`)
    } catch (countError) {
      console.log('❌ Failed to count inquiries:', countError.message)
    }
    
    console.log('\n✅ Inquiries setup completed!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

createInquiriesTable()