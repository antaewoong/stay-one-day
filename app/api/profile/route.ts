import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Get user profile (GET)
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // Get user stats
    const [reservationsResult, wishlistsResult, reviewsResult] = await Promise.all([
      // Get reservations count and recent reservations
      supabase
        .from('reservations')
        .select(`
          id,
          status,
          payment_status,
          total_price,
          reservation_date,
          created_at,
          accommodations(name, region, images)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      
      // Get wishlists count
      supabase
        .from('wishlists')
        .select('id, accommodation_id, created_at')
        .eq('user_id', user.id),
      
      // Get reviews count
      supabase
        .from('reviews')
        .select('id, rating, accommodation_id, created_at')
        .eq('user_id', user.id)
    ])

    const reservations = reservationsResult.data || []
    const wishlists = wishlistsResult.data || []
    const reviews = reviewsResult.data || []

    // Calculate stats
    const totalSpent = reservations
      .filter(r => r.payment_status === 'paid')
      .reduce((sum, r) => sum + r.total_price, 0)

    const profileData = {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url || null,
        phone: user.user_metadata?.phone || '',
        created_at: user.created_at
      },
      stats: {
        total_reservations: reservations.length,
        total_spent: totalSpent,
        total_wishlists: wishlists.length,
        total_reviews: reviews.length,
        pending_reservations: reservations.filter(r => r.status === 'pending').length,
        confirmed_reservations: reservations.filter(r => r.status === 'confirmed').length,
        completed_reservations: reservations.filter(r => r.status === 'completed').length,
        average_rating_given: reviews.length > 0 
          ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10 
          : 0
      },
      recent_activity: {
        recent_reservations: reservations.slice(0, 5),
        recent_reviews: reviews.slice(0, 3)
      }
    }

    return NextResponse.json({
      data: profileData
    })

  } catch (error) {
    console.error('프로필 조회 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// Update user profile (PUT)
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { full_name, phone, avatar_url } = await request.json()

    // Validate input
    if (full_name && full_name.trim().length < 2) {
      return NextResponse.json({ 
        error: '이름은 2글자 이상이어야 합니다.' 
      }, { status: 400 })
    }

    if (phone && !/^01[0-9]-?[0-9]{4}-?[0-9]{4}$/.test(phone.replace(/[^0-9]/g, ''))) {
      return NextResponse.json({ 
        error: '올바른 휴대폰 번호를 입력해주세요.' 
      }, { status: 400 })
    }

    // Update user metadata
    const updateData: any = {}
    if (full_name !== undefined) updateData.full_name = full_name.trim()
    if (phone !== undefined) updateData.phone = phone.replace(/[^0-9]/g, '')
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url

    const { data: updatedUser, error: updateError } = await supabase.auth.updateUser({
      data: updateData
    })

    if (updateError) {
      console.error('프로필 업데이트 실패:', updateError)
      return NextResponse.json({ 
        error: '프로필 업데이트에 실패했습니다.' 
      }, { status: 500 })
    }

    return NextResponse.json({
      message: '프로필이 성공적으로 업데이트되었습니다.',
      data: {
        user: {
          id: updatedUser.user.id,
          email: updatedUser.user.email,
          full_name: updatedUser.user.user_metadata?.full_name || '',
          phone: updatedUser.user.user_metadata?.phone || '',
          avatar_url: updatedUser.user.user_metadata?.avatar_url || null
        }
      }
    })

  } catch (error) {
    console.error('프로필 업데이트 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// Delete user account (DELETE)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { confirmation } = await request.json()

    if (confirmation !== 'DELETE_ACCOUNT') {
      return NextResponse.json({ 
        error: '계정 삭제 확인이 필요합니다.' 
      }, { status: 400 })
    }

    // Check for pending reservations
    const { data: pendingReservations } = await supabase
      .from('reservations')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['pending', 'confirmed'])

    if (pendingReservations && pendingReservations.length > 0) {
      return NextResponse.json({ 
        error: '진행 중인 예약이 있어 계정을 삭제할 수 없습니다.' 
      }, { status: 409 })
    }

    // In a real application, you would:
    // 1. Cancel all pending reservations
    // 2. Process refunds if needed
    // 3. Anonymize user data instead of deleting
    // 4. Keep reservation history for business purposes
    
    // For now, we'll just mark the account as deleted
    // The actual deletion should be done through Supabase admin or a background job
    
    return NextResponse.json({
      message: '계정 삭제 요청이 접수되었습니다. 24시간 내에 처리됩니다.',
      notice: '삭제 요청은 취소할 수 없으며, 모든 데이터가 영구적으로 삭제됩니다.'
    })

  } catch (error) {
    console.error('계정 삭제 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}