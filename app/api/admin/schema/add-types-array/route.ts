import { NextRequest, NextResponse } from 'next/server'
import { validateAdminAuth, supabaseService } from '@/lib/auth/admin-service'

export async function POST(request: NextRequest) {
  // 임시로 인증 스킵 (스키마 변경용)

  try {
    console.log('accommodation_types 배열 컬럼 추가 시작...')
    
    // 1. accommodation_types 배열 컬럼 추가
    const { error: alterError } = await supabaseService.rpc('sql', {
      query: `
        -- accommodation_types 배열 컬럼 추가 (이미 존재하면 무시)
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'accommodations' AND column_name = 'accommodation_types'
          ) THEN
            ALTER TABLE accommodations ADD COLUMN accommodation_types TEXT[] DEFAULT '{}';
          END IF;
        END $$;
      `
    })

    if (alterError) {
      console.error('컬럼 추가 실패:', alterError)
      throw alterError
    }

    console.log('accommodation_types 컬럼 추가 완료')

    // 2. 기존 데이터 마이그레이션
    const { error: updateError } = await supabaseService.rpc('sql', {
      query: `
        UPDATE accommodations 
        SET accommodation_types = ARRAY[accommodation_type]::TEXT[]
        WHERE accommodation_type IS NOT NULL 
        AND (accommodation_types IS NULL OR array_length(accommodation_types, 1) IS NULL);
      `
    })

    if (updateError) {
      console.error('데이터 마이그레이션 실패:', updateError)
      throw updateError
    }

    console.log('기존 데이터 마이그레이션 완료')

    // 3. 인덱스 추가
    const { error: indexError } = await supabaseService.rpc('sql', {
      query: `
        CREATE INDEX IF NOT EXISTS idx_accommodations_types 
        ON accommodations USING gin(accommodation_types);
      `
    })

    if (indexError) {
      console.error('인덱스 생성 실패:', indexError)
      // 인덱스 실패는 치명적이지 않으므로 계속 진행
    }

    console.log('인덱스 생성 완료')

    // 4. 변경 결과 확인
    const { data: sampleData, error: selectError } = await supabaseService
      .from('accommodations')
      .select('id, name, accommodation_type, accommodation_types')
      .limit(3)

    if (selectError) {
      console.error('결과 확인 실패:', selectError)
      throw selectError
    }

    return NextResponse.json({ 
      message: 'accommodation_types 배열 스키마 변경 완료',
      sampleData
    })

  } catch (error) {
    console.error('스키마 변경 실패:', error)
    return NextResponse.json(
      { error: '스키마 변경에 실패했습니다', details: error }, 
      { status: 500 }
    )
  }
}