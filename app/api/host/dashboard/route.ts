// app/api/host/dashboard/route.ts
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseOnEdge } from '@/lib/supabase-edge'

export async function GET(req: NextRequest) {
  const { supabase, cookies } = createSupabaseOnEdge(req)

  // 1) 쿠키로 세션 확인
  let { data: { user } } = await supabase.auth.getUser()

  // 2) 백업: Authorization 헤더 허용
  if (!user) {
    const auth = req.headers.get('authorization')
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined
    if (token) {
      const r = await supabase.auth.getUser(token)
      user = r.data.user ?? null
    }
  }

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    })
  }

  // TODO: 실제 KPI (RPC 권장). 일단 헬스 응답
  return new NextResponse(JSON.stringify({ ok: true, user_id: user.id }), {
    status: 200,
  })
}