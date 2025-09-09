import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Get user's wishlists (GET)
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    // Query wishlists with accommodation details
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: wishlists, error, count } = await supabase
      .from('wishlists')
      .select(`
        id,
        created_at,
        accommodation:accommodations(
          id,
          name,
          accommodation_type,
          address,
          region,
          base_price,
          max_capacity,
          images,
          rating,
          review_count,
          status,
          is_featured
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('위시리스트 조회 실패:', error)
      return NextResponse.json({ error: '위시리스트를 불러올 수 없습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      data: wishlists,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('위시리스트 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// Add to wishlist (POST)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { accommodation_id } = await request.json()

    if (!accommodation_id) {
      return NextResponse.json({ error: '숙소 ID가 필요합니다.' }, { status: 400 })
    }

    // Check if accommodation exists
    const { data: accommodation, error: accError } = await supabase
      .from('accommodations')
      .select('id, name')
      .eq('id', accommodation_id)
      .single()

    if (accError || !accommodation) {
      return NextResponse.json({ error: '존재하지 않는 숙소입니다.' }, { status: 404 })
    }

    // Check if already in wishlist
    const { data: existing } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('accommodation_id', accommodation_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: '이미 위시리스트에 추가된 숙소입니다.' }, { status: 409 })
    }

    // Add to wishlist
    const { data: wishlist, error: insertError } = await supabase
      .from('wishlists')
      .insert({
        user_id: user.id,
        accommodation_id
      })
      .select(`
        id,
        created_at,
        accommodation:accommodations(
          id,
          name,
          accommodation_type,
          address,
          region,
          base_price,
          images
        )
      `)
      .single()

    if (insertError) {
      console.error('위시리스트 추가 실패:', insertError)
      return NextResponse.json({ error: '위시리스트 추가에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      message: '위시리스트에 추가되었습니다.',
      data: wishlist
    }, { status: 201 })

  } catch (error) {
    console.error('위시리스트 추가 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// Remove from wishlist (DELETE)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { accommodation_id } = await request.json()

    if (!accommodation_id) {
      return NextResponse.json({ error: '숙소 ID가 필요합니다.' }, { status: 400 })
    }

    // Remove from wishlist
    const { error: deleteError } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', user.id)
      .eq('accommodation_id', accommodation_id)

    if (deleteError) {
      console.error('위시리스트 삭제 실패:', deleteError)
      return NextResponse.json({ error: '위시리스트에서 삭제할 수 없습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      message: '위시리스트에서 삭제되었습니다.'
    })

  } catch (error) {
    console.error('위시리스트 삭제 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}