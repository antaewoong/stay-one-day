import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function GET() {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('hero_slides')
      .select('id, image_url, title, subtitle, description, cta_text, active, slide_order, badge, stats')
      .eq('active', true)
      .order('slide_order', { ascending: true })
    
    if (error) {
      console.error('Hero slides fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Map to frontend expected format
    const mappedData = data?.map(slide => ({
      id: slide.id, // Use slide ID for navigation
      title: slide.title,
      subtitle: slide.subtitle,
      description: slide.description || '', // Use actual description field
      image: slide.image_url?.replace(/\s+/g, ''),
      cta: slide.cta_text || '예약하기',
      badge: slide.badge || 'FEATURED',
      stats: slide.stats || {
        avgRating: '4.9',
        bookings: '1,200+',
        price: '₩150,000'
      },
      order: slide.slide_order,
      active: slide.active
    })) || []
    
    return NextResponse.json(mappedData)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}