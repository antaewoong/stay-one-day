import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      businessName,
      contactName,
      phone,
      websiteUrl,
      location,
      spaceType,
      dailyRate,
      averageIdleDays,
      parkingSpaces,
      amenities,
      notes,
      privacyConsent,
      marketingConsent
    } = body

    // Validate required fields
    if (!businessName || !contactName || !phone || !websiteUrl || !location || !spaceType || !dailyRate || !averageIdleDays || !privacyConsent) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // Insert partner inquiry into database
    const { data, error } = await supabase
      .from('partner_inquiries')
      .insert({
        business_name: businessName,
        contact_name: contactName,
        phone: phone,
        website_url: websiteUrl,
        location: location,
        space_type: spaceType,
        daily_rate: dailyRate,
        average_idle_days: averageIdleDays,
        parking_spaces: parkingSpaces || null,
        amenities: amenities || null,
        notes: notes || null,
        privacy_consent: privacyConsent,
        marketing_consent: marketingConsent || false
      })
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: '문의 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: '입점 문의가 성공적으로 접수되었습니다.',
        inquiry: data[0]
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Partner inquiry error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let query = supabase
      .from('partner_inquiries')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: '문의 목록을 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      inquiries: data,
      total: count,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    console.error('Get partner inquiries error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, adminNotes } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const updates: any = { updated_at: new Date().toISOString() }
    if (status) updates.status = status
    if (adminNotes !== undefined) updates.admin_notes = adminNotes

    const { data, error } = await supabase
      .from('partner_inquiries')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: '문의 업데이트 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: '문의가 성공적으로 업데이트되었습니다.',
      inquiry: data[0]
    })

  } catch (error) {
    console.error('Update partner inquiry error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}