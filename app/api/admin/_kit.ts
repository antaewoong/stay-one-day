import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/middleware/withAdminAuth'
import { createClient } from '@supabase/supabase-js'

export const adminRoute = (fn: (req: NextRequest, ctx?: any) => Promise<NextResponse>) =>
  (req: NextRequest) => withAdminAuth(req, fn)

export const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const ok = (data: any) => NextResponse.json({ ok: true, data })
export const bad = (error: any, code = 400) =>
  NextResponse.json({ ok: false, error: String(error?.message ?? error) }, { status: code })