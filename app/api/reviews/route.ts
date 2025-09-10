import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const dynamic = 'force-dynamic'

// Get reviews (GET)
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const accommodationId = searchParams.get('accommodation_id')
    const userId = searchParams.get('user_id')
    const hostId = searchParams.get('hostId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const rating = searchParams.get('rating')

    // Base query
    let query = supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        images,
        created_at,
        updated_at,
        user_id,
        accommodation_id,
        reservation_id,
        host_reply,
        reply_date,
        accommodations(name, accommodation_type, region, host_id),
        reservations(guest_name)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (accommodationId) {
      query = query.eq('accommodation_id', accommodationId)
    }
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    if (hostId) {
      query = query.eq('accommodations.host_id', hostId)
    }
    
    if (rating) {
      query = query.eq('rating', parseInt(rating))
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: reviews, error, count } = await query
      .range(from, to)

    if (error) {
      console.error('리뷰 조회 실패:', error)
      return NextResponse.json({ error: '리뷰를 불러올 수 없습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      data: reviews,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('리뷰 조회 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// Create review (POST)
export async function POST(request: NextRequest) {
  try {
    // For now, skip auth check since we're using service key
    // In production, implement proper auth validation
    const { user_id } = await request.json()

    const { 
      accommodation_id,
      reservation_id,
      rating,
      comment,
      images 
    } = await request.json()

    // Validate required fields
    if (!accommodation_id || !reservation_id || !rating) {
      return NextResponse.json({ 
        error: '필수 정보가 누락되었습니다. (숙소, 예약, 평점)' 
      }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ 
        error: '평점은 1~5점 사이여야 합니다.' 
      }, { status: 400 })
    }

    // Check if reservation exists and belongs to user
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('id, accommodation_id, user_id, status')
      .eq('id', reservation_id)
      .eq('user_id', user.id)
      .single()

    if (reservationError || !reservation) {
      return NextResponse.json({ 
        error: '유효하지 않은 예약입니다.' 
      }, { status: 404 })
    }

    if (reservation.accommodation_id !== accommodation_id) {
      return NextResponse.json({ 
        error: '예약과 숙소 정보가 일치하지 않습니다.' 
      }, { status: 400 })
    }

    if (reservation.status !== 'completed') {
      return NextResponse.json({ 
        error: '완료된 예약에 대해서만 리뷰를 작성할 수 있습니다.' 
      }, { status: 400 })
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', user.id)
      .eq('reservation_id', reservation_id)
      .single()

    if (existingReview) {
      return NextResponse.json({ 
        error: '이미 리뷰를 작성한 예약입니다.' 
      }, { status: 409 })
    }

    // Create review
    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        accommodation_id,
        reservation_id,
        rating,
        comment: comment?.trim() || null,
        images: images || []
      })
      .select(`
        id,
        rating,
        comment,
        images,
        created_at,
        accommodations(name, accommodation_type),
        reservations(guest_name)
      `)
      .single()

    if (insertError) {
      console.error('리뷰 생성 실패:', insertError)
      return NextResponse.json({ error: '리뷰 작성에 실패했습니다.' }, { status: 500 })
    }

    // Update accommodation rating (optional: run in background)
    updateAccommodationRating(accommodation_id)

    return NextResponse.json({
      message: '리뷰가 성공적으로 작성되었습니다.',
      data: review
    }, { status: 201 })

  } catch (error) {
    console.error('리뷰 생성 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// Update accommodation rating (helper function)
async function updateAccommodationRating(accommodationId: string) {
  try {
    
    // Calculate average rating
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('accommodation_id', accommodationId)

    if (reviews && reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      const roundedRating = Math.round(avgRating * 10) / 10 // Round to 1 decimal

      // Update accommodation
      await supabase
        .from('accommodations')
        .update({
          rating: roundedRating,
          review_count: reviews.length,
          updated_at: new Date().toISOString()
        })
        .eq('id', accommodationId)
    }
  } catch (error) {
    console.error('평점 업데이트 실패:', error)
    // Don't throw error, just log it
  }
}