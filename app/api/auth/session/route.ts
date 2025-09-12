import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(URL, ANON, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) => cookieStore.set({ name, value, ...options }),
      remove: (name, options) => cookieStore.delete({ name, ...options }),
    },
  })

  const { event, session } = await req.json().catch(() => ({ event: null, session: null }))

  // 로그인/리프레시 시 서버 쿠키 동기화
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    await supabase.auth.setSession(session)
  }
  // 로그아웃 시 서버 쿠키 제거
  if (event === 'SIGNED_OUT') {
    await supabase.auth.signOut()
  }

  return new Response(null, { status: 204 })
}