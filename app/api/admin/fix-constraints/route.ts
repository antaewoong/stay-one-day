import { NextRequest } from 'next/server'
import { adminRoute, sb, ok, bad } from '../_kit'

export const POST = adminRoute(async (req: NextRequest) => {
  try {
    console.log('accommodation_type 제약조건 수정 시작...')
    
    // 1. 기존 제약조건 삭제
    const { error: dropError } = await sb().rpc('exec_sql', {
      sql: 'ALTER TABLE accommodations DROP CONSTRAINT IF EXISTS accommodations_accommodation_type_check;'
    })

    if (dropError) {
      console.error('기존 제약조건 삭제 실패:', dropError)
      // 제약조건이 없을 수도 있으므로 계속 진행
    }

    console.log('기존 제약조건 삭제 완료')

    // 2. 새로운 제약조건 추가
    const { error: addError } = await sb().rpc('exec_sql', {
      sql: `
        ALTER TABLE accommodations 
        ADD CONSTRAINT accommodations_accommodation_type_check 
        CHECK (accommodation_type IN ('풀빌라', '독채', '펜션', '루프탑', '글램핑', '캠핑', '게스트하우스', '모텔', '호텔', '키즈', '기타'));
      `
    })

    if (addError) {
      console.error('새 제약조건 추가 실패:', addError)
      throw addError
    }

    console.log('새 제약조건 추가 완료')

    return ok({ 
      message: 'accommodation_type 제약조건 수정 완료',
      allowedTypes: ['풀빌라', '독채', '펜션', '루프탑', '글램핑', '캠핑', '게스트하우스', '모텔', '호텔', '키즈', '기타']
    })

  } catch (error) {
    console.error('제약조건 수정 실패:', error)
    return bad('제약조건 수정에 실패했습니다', 500)
  }
})