#!/usr/bin/env node

// 긴급 데이터 정리 스크립트
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 환경변수가 설정되지 않았습니다.')
  console.error('NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function emergencyCleanup() {
  try {
    console.log('🚨 긴급 히어로 슬라이드 데이터 정리 시작')

    // 현재 슬라이드 수 확인
    const { count: beforeCount } = await supabase
      .from('hero_slides')
      .select('*', { count: 'exact', head: true })

    console.log(`현재 슬라이드 수: ${beforeCount}개`)

    if (beforeCount === 0) {
      console.log('✅ 정리할 데이터가 없습니다.')
      return
    }

    // Service Role로 모든 슬라이드 삭제
    console.log('🗑️  모든 히어로 슬라이드 삭제 중...')
    const { error: deleteError } = await supabase
      .from('hero_slides')
      .delete()
      .neq('id', '')

    if (deleteError) {
      console.error('❌ 삭제 실패:', deleteError.message)
      throw deleteError
    }

    // 삭제 후 확인
    const { count: afterCount } = await supabase
      .from('hero_slides')
      .select('*', { count: 'exact', head: true })

    console.log(`정리 후 슬라이드 수: ${afterCount}개`)
    console.log(`삭제된 슬라이드 수: ${(beforeCount || 0) - (afterCount || 0)}개`)

    console.log('✅ 긴급 데이터 정리 완료!')
    console.log('')
    console.log('📋 다음 단계:')
    console.log('1. PUT API 로직 완전히 재설계')
    console.log('2. 프론트엔드에서 실제 DB ID 전달 확인')
    console.log('3. 계약 기반 테스트로 재발 방지')

  } catch (error) {
    console.error('💥 긴급 정리 실패:', error.message)
    process.exit(1)
  }
}

emergencyCleanup()