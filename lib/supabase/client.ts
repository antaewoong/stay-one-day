'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

declare global {
  // HMR에서도 유지되는 싱글톤
  var __sod_supabase__: SupabaseClient | undefined
}

export function browserSB(): SupabaseClient {
  if (!globalThis.__sod_supabase__) {
    globalThis.__sod_supabase__ = createBrowserClient(url, anon, {
      auth: {
        persistSession: true,
        storageKey: 'sod-auth-v1', // 스토리지 키 명시
      },
    })
  }
  return globalThis.__sod_supabase__!
}

// 레거시 호환을 위한 createClient (deprecated)
export function createClient() {
  return browserSB()
}