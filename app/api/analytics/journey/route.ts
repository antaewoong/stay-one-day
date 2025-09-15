import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    const {
      sessionId,
      userId,
      eventType,
      pagePath,
      pageTitle,
      elementId,
      elementClass,
      elementText,
      timeOnPage,
      scrollDepth,
      conversionType,
      conversionValue
    } = body

    // 사용자 여정 이벤트 저장
    const { error } = await supabase
      .from('user_journey_events')
      .insert({
        session_id: sessionId,
        user_id: userId,
        event_type: eventType,
        page_path: pagePath,
        page_title: pageTitle,
        element_id: elementId,
        element_class: elementClass,
        element_text: elementText,
        time_on_page: timeOnPage,
        scroll_depth: scrollDepth,
        conversion_type: conversionType,
        conversion_value: conversionValue
      })

    if (error) {
      console.error('여정 이벤트 저장 실패:', error)
      return NextResponse.json({ error: '이벤트 저장 실패' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('여정 추적 오류:', error)
    return NextResponse.json({ error: '여정 추적 오류' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('range') || '7d'
    
    // 관리자 권한 확인 (임시로 주석 처리하고 빈 데이터 반환)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('User not authenticated, returning empty data')
        return NextResponse.json({ journeyData: [] })
      }

      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (!userRole || userRole.role !== 'admin') {
        console.log('User not admin, returning empty data')
        return NextResponse.json({ journeyData: [] })
      }
    } catch (authError) {
      console.log('Auth error, returning empty data:', authError)
      return NextResponse.json({ journeyData: [] })
    }

    // 날짜 범위 계산
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // 사용자 여정 데이터 조회
    const { data: journeyEvents } = await supabase
      .from('user_journey_events')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at')

    if (!journeyEvents || journeyEvents.length === 0) {
      return NextResponse.json({ journeyData: [] })
    }

    // 세션별로 그룹화
    const sessionGroups = journeyEvents.reduce((acc: any, event: any) => {
      if (!acc[event.session_id]) {
        acc[event.session_id] = []
      }
      acc[event.session_id].push(event)
      return acc
    }, {})

    // 공통 여정 패턴 분석
    const journeyPatterns: any = {}
    
    Object.values(sessionGroups).forEach((events: any) => {
      const pages = events.map((e: any) => e.page_path)
      const patternKey = pages.join(' -> ')
      
      if (!journeyPatterns[patternKey]) {
        journeyPatterns[patternKey] = {
          pattern: pages,
          sessions: [],
          totalUsers: 0,
          conversions: 0,
          totalTime: 0
        }
      }
      
      const sessionTime = events.reduce((sum: number, e: any) => sum + (e.time_on_page || 0), 0)
      const hasConversion = events.some((e: any) => e.event_type === 'conversion')
      
      journeyPatterns[patternKey].sessions.push(events[0].session_id)
      journeyPatterns[patternKey].totalUsers += 1
      journeyPatterns[patternKey].totalTime += sessionTime
      if (hasConversion) {
        journeyPatterns[patternKey].conversions += 1
      }
    })

    // 상위 5개 여정 패턴 선택
    const topJourneys = Object.entries(journeyPatterns)
      .sort(([,a]: any, [,b]: any) => b.totalUsers - a.totalUsers)
      .slice(0, 5)
      .map(([pattern, data]: any) => {
        const steps = data.pattern.map((page: string, index: number) => {
          const pageEvents = journeyEvents.filter((e: any) => 
            data.sessions.includes(e.session_id) && e.page_path === page
          )
          
          const totalUsers = pageEvents.length
          const nextStepEvents = index < data.pattern.length - 1 ? 
            journeyEvents.filter((e: any) => 
              data.sessions.includes(e.session_id) && e.page_path === data.pattern[index + 1]
            ) : []
          
          const dropRate = index < data.pattern.length - 1 ? 
            ((totalUsers - nextStepEvents.length) / totalUsers * 100) : 0
          
          const avgTime = pageEvents.reduce((sum: number, e: any) => sum + (e.time_on_page || 0), 0) / 
            (pageEvents.length || 1)

          return {
            step: index + 1,
            page: getPageDisplayName(page),
            users: totalUsers,
            drop_rate: parseFloat(dropRate.toFixed(1)),
            avg_time: parseFloat((avgTime / 60).toFixed(1)) // 분 단위
          }
        })

        return {
          journey_name: getJourneyName(data.pattern),
          total_users: data.totalUsers,
          conversion_rate: parseFloat((data.conversions / data.totalUsers * 100).toFixed(1)),
          avg_journey_time: parseFloat((data.totalTime / data.totalUsers / 60).toFixed(1)),
          steps
        }
      })

    return NextResponse.json({ journeyData: topJourneys })
  } catch (error) {
    console.error('여정 데이터 조회 오류:', error)
    return NextResponse.json({ error: '데이터 조회 실패' }, { status: 500 })
  }
}

// 헬퍼 함수들
function getPageDisplayName(path: string): string {
  const pageNames: { [key: string]: string } = {
    '/': '메인 페이지',
    '/search': '숙소 검색',
    '/accommodations': '숙소 목록',
    '/booking': '예약 폼',
    '/booking/complete': '예약 완료',
    '/login': '로그인',
    '/signup': '회원가입',
    '/mypage': '마이페이지'
  }
  
  if (pageNames[path]) return pageNames[path]
  if (path.includes('/accommodation/')) return '숙소 상세'
  if (path.includes('/host/')) return '호스트 페이지'
  if (path.includes('/admin/')) return '관리자 페이지'
  
  return path
}

function getJourneyName(pattern: string[]): string {
  if (pattern.length === 0) return '빈 여정'
  
  const hasBooking = pattern.some(p => p.includes('booking'))
  const hasSearch = pattern.some(p => p.includes('search'))
  const hasAccommodation = pattern.some(p => p.includes('accommodation'))
  const hasLogin = pattern.some(p => p.includes('login'))
  const isMobile = pattern.length <= 4
  
  if (hasLogin && hasBooking) return '재방문자 예약'
  if (hasSearch && hasAccommodation && hasBooking) return '일반 예약 경로'
  if (isMobile && hasBooking) return '모바일 간편 예약'
  if (hasSearch && !hasBooking) return '검색 후 이탈'
  if (pattern[0] === '/' && hasBooking) return '메인에서 직접 예약'
  
  return '기타 여정'
}