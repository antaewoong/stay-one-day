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
      console.log(`✅ Saved to localStorage: ${key}`)
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
  // Return existing instance if already created (singleton pattern)
  if (supabaseClientInstance) {
    return supabaseClientInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // Create new instance only if none exists
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