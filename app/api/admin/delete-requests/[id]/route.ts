import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 삭제 요청 상세 조회 (GET)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const requestId = params.id

    const { data, error } = await supabase
      .from('delete_requests')
      .select(`
        *,
        hosts!inner(
          name,
          email,
          phone,
          host_id
        ),
        accommodations!inner(
          name,
          address,
          accommodation_type,
          description
        )
      `)
      .eq('id', requestId)
      .single()

    if (error) {
      console.error('삭제 요청 조회 실패:', error)
      return NextResponse.json({ error: '삭제 요청을 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error('삭제 요청 상세 조회 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 삭제 요청 처리 (승인/거절) (PATCH)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const requestId = params.id
    const body = await request.json()
    
    const { status, admin_notes } = body

    // 상태 검증
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태입니다.' },
        { status: 400 }
      )
    }

    // 삭제 요청 존재 확인
    const { data: deleteRequest, error: checkError } = await supabase
      .from('delete_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (checkError || !deleteRequest) {
      return NextResponse.json({ error: '삭제 요청을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 이미 처리된 요청인지 확인
    if (deleteRequest.status !== 'pending') {
      return NextResponse.json(
        { error: '이미 처리된 요청입니다.' },
        { status: 400 }
      )
    }

    // 요청 상태 업데이트
    const { data: updatedRequest, error: updateError } = await supabase
      .from('delete_requests')
      .update({
        status,
        admin_notes,
        processed_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single()

    if (updateError) {
      console.error('삭제 요청 처리 실패:', updateError)
      return NextResponse.json(
        { error: '삭제 요청 처리에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 승인된 경우 실제 삭제 수행
    if (status === 'approved') {
      try {
        if (deleteRequest.request_type === 'accommodation') {
          // 활성 예약이 있는지 확인
          const { data: activeReservations } = await supabase
            .from('reservations')
            .select('id')
            .eq('accommodation_id', deleteRequest.target_id)
            .in('status', ['pending', 'confirmed'])
            .limit(1)

          if (activeReservations && activeReservations.length > 0) {
            // 예약이 있으면 즉시 삭제하지 않고 비활성화만
            await supabase
              .from('accommodations')
              .update({ 
                status: 'inactive',
                updated_at: new Date().toISOString()
              })
              .eq('id', deleteRequest.target_id)

            // 관리자 노트 추가
            await supabase
              .from('delete_requests')
              .update({
                admin_notes: (admin_notes || '') + '\n\n[자동] 활성 예약이 있어 비활성화 처리됨. 예약 완료 후 재검토 필요.'
              })
              .eq('id', requestId)
          } else {
            // 예약이 없으면 소프트 삭제
            await supabase
              .from('accommodations')
              .update({ 
                status: 'deleted',
                updated_at: new Date().toISOString()
              })
              .eq('id', deleteRequest.target_id)
          }
        }
      } catch (deletionError) {
        console.error('실제 삭제 수행 실패:', deletionError)
        // 삭제 실패해도 요청은 승인됨 상태로 유지하고 관리자에게 알림
        await supabase
          .from('delete_requests')
          .update({
            admin_notes: (admin_notes || '') + '\n\n[오류] 실제 삭제 수행 실패: ' + (deletionError as Error).message
          })
          .eq('id', requestId)
      }
    }

    return NextResponse.json({ 
      message: `삭제 요청이 ${status === 'approved' ? '승인' : '거절'}되었습니다.`,
      data: updatedRequest 
    })

  } catch (error) {
    console.error('삭제 요청 처리 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 삭제 요청 취소 (DELETE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const requestId = params.id
    const body = await request.json()
    const { host_id } = body

    // 삭제 요청 존재 및 권한 확인
    const { data: deleteRequest, error: checkError } = await supabase
      .from('delete_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (checkError || !deleteRequest) {
      return NextResponse.json({ error: '삭제 요청을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 본인의 요청인지 확인
    if (deleteRequest.host_id !== host_id) {
      return NextResponse.json(
        { error: '본인의 요청만 취소할 수 있습니다.' },
        { status: 403 }
      )
    }

    // pending 상태만 취소 가능
    if (deleteRequest.status !== 'pending') {
      return NextResponse.json(
        { error: '처리 중이거나 완료된 요청은 취소할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 요청 삭제
    const { error: deleteError } = await supabase
      .from('delete_requests')
      .delete()
      .eq('id', requestId)

    if (deleteError) {
      console.error('삭제 요청 취소 실패:', deleteError)
      return NextResponse.json(
        { error: '삭제 요청 취소에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: '삭제 요청이 성공적으로 취소되었습니다.'
    })

  } catch (error) {
    console.error('삭제 요청 취소 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}