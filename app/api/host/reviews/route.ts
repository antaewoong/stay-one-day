import { NextResponse } from 'next/server'
import { withHostAuth } from '@/lib/auth/withHostAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withHostAuth(async ({ req, supabase, roleIds }) => {
  try {
    const hostId = roleIds.hostId!

    // 호스트 숙소에 대한 리뷰 조회
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        user_profile:user_profiles!inner(
          first_name,
          last_name
        ),
        accommodation:accommodations!inner(
          id,
          name,
          host_id
        )
      `)
      .eq('accommodation.host_id', hostId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (reviewsError) {
      console.error('Reviews query error:', reviewsError)
      return NextResponse.json({ 
        ok: false, 
        code: 'QUERY_ERROR', 
        message: reviewsError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      data: reviews || []
    })

  } catch (error) {
    console.error('Host reviews API error:', error)
    return NextResponse.json(
      { ok: false, code: 'QUERY_ERROR', message: 'Failed to load reviews' },
      { status: 500 }
    )
  }
})