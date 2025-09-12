import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const runtime = 'nodejs'

export async function GET() {
  const sb = createClient(URL, ANON, { auth: { persistSession: false } })
  const { data, error } = await sb
    .from('hero_slides')
    .select('id,image_url,headline,subheadline,cta_text,cta_link,sort_order,created_at')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ ok:false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok:true, data }, { status: 200 })
}