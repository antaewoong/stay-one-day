import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fcmauibvdqbocwhloqov.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjbWF1aWJ2ZHFib2N3aGxvcW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDg2NzgsImV4cCI6MjA3MjM4NDY3OH0.0EiDZcqGMEaMmlLw5PBYLcr6LbmJcY-VXAU3UjCsez8'

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}