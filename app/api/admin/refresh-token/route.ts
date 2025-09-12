import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 토큰 리프레시 (사실상 필요 없음 - @supabase/ssr가 쿠키로 자동 갱신)
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase.auth.getSession()
  
  if (error || !data.session) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  
  return NextResponse.json({ 
    ok: true, 
    exp: data.session.expires_at 
  })
}