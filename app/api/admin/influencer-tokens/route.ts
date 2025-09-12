import { NextRequest } from 'next/server'
import { adminRoute, sb, ok, bad } from '../_kit'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

// POST: 인플루언서용 협업신청 토큰 생성 (RLS: admin만 insert 허용)
export const POST = adminRoute(async (req: NextRequest) => {
  const body = await req.json()
  const { influencer_id, expires_in_days = 30 } = body

  if (!influencer_id) {
    return bad('influencer_id required', 400)
  }

  // 인플루언서 존재 확인
  const { data: influencer, error: influencerError } = await sb()
    .from('influencers')
    .select('id, name, email, status')
    .eq('id', influencer_id)
    .single()

  if (influencerError || !influencer) {
    return bad('인플루언서를 찾을 수 없습니다', 404)
  }

  if (influencer.status !== 'active') {
    return bad('비활성화된 인플루언서입니다', 400)
  }

  // JWT 토큰 생성
  const expiresIn = expires_in_days * 24 * 60 * 60 // seconds
  const token = jwt.sign(
    { 
      influencerId: influencer_id,
      exp: Math.floor(Date.now() / 1000) + expiresIn
    },
    process.env.JWT_SECRET || 'your-secret-key'
  )

  const expiresAt = new Date(Date.now() + (expires_in_days * 24 * 60 * 60 * 1000)).toISOString()

  // influencer_tokens 테이블에 토큰 저장 (RLS에 의해 admin만 가능)
  const { data: tokenRecord, error } = await sb().from('influencer_tokens').insert({
    influencer_id,
    token,
    expires_at: expiresAt
  }).select().single()

  if (error) return bad(error) // RLS 실패 시 메시지 확인

  const collaborationLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/influencer/request/${token}`

  return ok({
    influencer: {
      id: influencer.id,
      name: influencer.name,
      email: influencer.email
    },
    token,
    collaboration_link: collaborationLink,
    expires_at: expiresAt,
    expires_in_days,
    token_record: tokenRecord
  })
})

// GET: 활성 인플루언서 목록 (토큰 생성용)
export const GET = adminRoute(async () => {
  const { data: influencers, error } = await sb()
    .from('influencers')
    .select('id, name, email, phone, instagram_handle, follower_count, status')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) return bad(error)
  return ok(influencers || [])
})