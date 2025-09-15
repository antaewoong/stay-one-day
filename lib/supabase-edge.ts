// lib/supabase-edge.ts
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export function createSupabaseOnEdge(req: NextRequest) {
  let cookies: Record<string, string> = {}

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          cookies[name] = value
        },
        remove: (name, options) => {
          cookies[name] = ''
        },
      },
    }
  )

  return { supabase, cookies }
}