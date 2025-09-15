// app/api/auth/session/route.ts
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseOnEdge } from '@/lib/supabase-edge'

export async function POST(req: NextRequest) {
  const { supabase, cookies } = createSupabaseOnEdge(req)
  let payload: any = {}
  try { payload = await req.json() } catch {}

  const { event, session } = payload

  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
    if (session?.access_token && session?.refresh_token) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      })
    }
  } else if (event === 'SIGNED_OUT') {
    await supabase.auth.signOut()
  }

  const response = new NextResponse(null, { status: 204 })

  // Set cookies from supabase session
  Object.entries(cookies).forEach(([name, value]) => {
    if (value) {
      response.cookies.set(name, value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
    } else {
      response.cookies.delete(name)
    }
  })

  return response
}