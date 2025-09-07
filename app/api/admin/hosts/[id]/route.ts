import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Service role client - RLS 우회 가능
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body
    const { id } = params

    if (!status) {
      return NextResponse.json(
        { error: '상태 정보가 필요합니다.' },
        { status: 400 }
      )
    }

    // hosts 테이블 상태 업데이트
    const { data: host, error: hostError } = await supabase
      .from('hosts')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (hostError) {
      console.error('호스트 상태 업데이트 오류:', hostError)
      return NextResponse.json(
        { error: `데이터베이스 오류: ${hostError.message}` },
        { status: 400 }
      )
    }

    if (!host) {
      return NextResponse.json(
        { error: '호스트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    console.log('호스트 상태 업데이트 성공:', host)

    return NextResponse.json({ 
      success: true, 
      host,
      message: '호스트 상태가 업데이트되었습니다.'
    })
  } catch (error) {
    console.error('호스트 상태 업데이트 실패:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}