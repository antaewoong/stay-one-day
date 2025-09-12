import { createClient } from '@supabase/supabase-js'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function pickToken(h: Headers) {
  const a = h.get('authorization') || h.get('Authorization') || ''
  const x = h.get('x-supabase-auth') || h.get('X-Supabase-Auth') || ''
  const raw = a || x || ''
  const t = /^Bearer\s+/i.test(raw) ? raw.replace(/^Bearer\s+/i,'').trim() : raw.trim()
  return t || null
}
const isJWT = (t?: string|null) => !!t && /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(t)

export async function GET(req: Request) {
  const token = pickToken(new Headers(req.headers))
  if (!isJWT(token)) {
    return Response.json({ ok:false, stage:'format', error:'invalid token format' }, { status:401 })
  }
  const supa = createClient(URL, ANON, { auth:{ persistSession:false, autoRefreshToken:false } })
  const { data, error } = await supa.auth.getUser(token!)
  if (error || !data?.user) {
    return Response.json({ ok:false, stage:'getUser', error: error?.message || 'no user' }, { status:401 })
  }
  return Response.json({ ok:true, userId: data.user.id })
}