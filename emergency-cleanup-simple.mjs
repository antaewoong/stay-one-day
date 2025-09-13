#!/usr/bin/env node

// 간단한 방법으로 모든 데이터 삭제
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fcmauibvdqbocwhloqov.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjbWF1aWJ2ZHFib2N3aGxvcW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjgwODY3OCwiZXhwIjoyMDcyMzg0Njc4fQ.vwEr3cyiQSWBabAgoodWUzBSewrVTco3kFg_w-ae1D0'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function cleanup() {
  try {
    console.log('🚨 긴급 정리 시작...')

    // 현재 개수 확인
    const { count } = await supabase
      .from('hero_slides')
      .select('*', { count: 'exact', head: true })

    console.log(`현재 슬라이드 개수: ${count}개`)

    // 모든 데이터 삭제 (간단한 방법)
    const { error } = await supabase
      .from('hero_slides')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000') // 모든 UUID 매치

    if (error) {
      console.error('❌ 삭제 실패:', error.message)
      throw error
    }

    // 확인
    const { count: afterCount } = await supabase
      .from('hero_slides')
      .select('*', { count: 'exact', head: true })

    console.log(`정리 후 개수: ${afterCount}개`)
    console.log('✅ 정리 완료!')

  } catch (err) {
    console.error('💥 실패:', err.message)
    process.exit(1)
  }
}

cleanup()