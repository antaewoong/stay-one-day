import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function serverSB(): SupabaseClient {
  const cookieStore = cookies()
  return createServerClient(url, anon, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      // Route Handler에서 쿠키 세팅이 필요하면 set/remove 구현 추가
      // 여기선 읽기만 필요하니 생략해도 무방
      set: () => {},
      remove: () => {},
    },
  })
}

// Service Role 클라이언트 (서명 URL 생성용)
export function createServiceRoleClient() {
  // 브라우저 가드: Service Role 키가 클라이언트로 번들링되는 것을 방지
  if (typeof window !== 'undefined') {
    throw new Error('Do not import server supabase client on the client')
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// 레거시 호환을 위한 createClient (deprecated)
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}