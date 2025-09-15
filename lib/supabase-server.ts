import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function getUserClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => cookieStore.set({ name, value, ...options }),
        remove: (name, options) => cookieStore.set({ name, value: '', ...options, expires: new Date(0) })
      }
    }
  )
}

// 관리자/집계용 (RLS 우회가 필요한 안전한 서버 전용 처리)
export function getServiceClient() {
  // Edge에서도 env 접근 가능
  const { createClient } = require('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // 절대 클라이언트로 노출 금지
    { auth: { persistSession: false } }
  )
}