import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const runtime = 'nodejs'

export async function GET() {
  const sb = createClient(URL, ANON, { auth: { persistSession: false } })
  const { data, error } = await sb
    .from('main_page_sections')
    .select('*')
    .eq('active', true)
    .order('section_id', { ascending: true })

  if (error) return NextResponse.json({ ok:false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok:true, data }, { status: 200 })
}