import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseClientInstance: SupabaseClient | null = null

// Custom storage adapter to ensure localStorage works
const customStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(key, value)
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(key)
    } catch {
      // ignore
    }
  }
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // 개발 환경에서는 항상 새 인스턴스 생성하여 GoTrueClient 중복 방지
  if (process.env.NODE_ENV === 'development') {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'sb-fcmauibvdqbocwhloqov-auth-token',
        storage: customStorage,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  }

  // 프로덕션에서만 싱글톤 패턴 사용
  if (supabaseClientInstance) {
    return supabaseClientInstance
  }

  supabaseClientInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: 'sb-fcmauibvdqbocwhloqov-auth-token',
      storage: customStorage,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })

  return supabaseClientInstance
}