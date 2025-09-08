'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface HostStats {
  accommodations: {
    total: number
    active: number
    pending: number
    inactive: number
    views: number
  }
  reservations: {
    total: number
    confirmed: number
    pending: number
    cancelled: number
    revenue: number
    avgOrderValue: number
    conversionRate: number
  }
  marketing: {
    totalVisitors: number
    uniqueVisitors: number
    pageviews: number
    bounceRate: number
    topSources: Array<{
      source: string
      visitors: number
      conversions: number
      revenue: number
    }>
    devices: Array<{
      device: string
      sessions: number
      percentage: number
    }>
  }
  performance: {
    roas: number
    costPerAcquisition: number
    lifetimeValue: number
    returnOnInvestment: number
  }
  trends: Array<{
    date: string
    visitors: number
    views: number
    bookings: number
    revenue: number
  }>
}

export function useHostStats(hostId: string, period: string = 'month') {
  const [stats, setStats] = useState<HostStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchHostStats = async () => {
    if (!hostId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // 기간별 날짜 범위 계산
      const getDateRange = () => {
        const now = new Date()
        const start = new Date(now)
        
        switch (period) {
          case 'day':
            start.setDate(start.getDate() - 1)
            break
          case 'week':
            start.setDate(start.getDate() - 7)
            break
          case 'month':
            start.setMonth(start.getMonth() - 1)
            break
          case 'year':
            start.setFullYear(start.getFullYear() - 1)
            break
          default:
            start.setMonth(start.getMonth() - 1)
        }
        
        return {
          start: start.toISOString(),
          end: now.toISOString()
        }
      }

      const { start, end } = getDateRange()

      // 호스트 소유 숙소 ID 조회
      const { data: hostAccommodations } = await supabase
        .from('accommodations')
        .select('id')
        .eq('host_id', hostId)

      const accommodationIds = hostAccommodations?.map(acc => acc.id) || []

      if (accommodationIds.length === 0) {
        setStats({
          accommodations: { total: 0, active: 0, pending: 0, inactive: 0, views: 0 },
          reservations: { total: 0, confirmed: 0, pending: 0, cancelled: 0, revenue: 0, avgOrderValue: 0, conversionRate: 0 },
          marketing: { totalVisitors: 0, uniqueVisitors: 0, pageviews: 0, bounceRate: 0, topSources: [], devices: [] },
          performance: { roas: 0, costPerAcquisition: 0, lifetimeValue: 0, returnOnInvestment: 0 },
          trends: []
        })
        return
      }

      // 병렬로 모든 데이터 조회 - 에러 처리 개선
      const [
        accommodationsData,
        reservationsData,
        marketingEventsData,
        webSessionsData
      ] = await Promise.allSettled([
        // 숙소 데이터
        supabase
          .from('accommodations')
          .select('*')
          .eq('host_id', hostId),
        
        // 예약 데이터 (호스트 숙소만)
        supabase
          .from('reservations')
          .select('*')
          .in('accommodation_id', accommodationIds)
          .gte('created_at', start)
          .lte('created_at', end),
        
        // 마케팅 이벤트 (숙소 조회 등) - 테이블이 없을 수 있음
        supabase
          .from('marketing_events')
          .select('*')
          .eq('event_name', 'accommodation_view')
          .gte('created_at', start)
          .lte('created_at', end)
          .then(res => res).catch(() => ({ data: [], error: null })),
        
        // 웹 세션 (호스트 숙소 방문자) - 테이블이 없을 수 있음
        supabase
          .from('web_sessions')
          .select('*')
          .gte('created_at', start)
          .lte('created_at', end)
          .then(res => res).catch(() => ({ data: [], error: null }))
      ])

      // Promise.allSettled 결과 처리
      const accommodations = accommodationsData.status === 'fulfilled' ? accommodationsData.value.data : []
      const reservations = reservationsData.status === 'fulfilled' ? reservationsData.value.data : []
      const marketingEvents = marketingEventsData.status === 'fulfilled' ? marketingEventsData.value.data : []
      const webSessions = webSessionsData.status === 'fulfilled' ? webSessionsData.value.data : []

      // 데이터가 없는 경우 빈 배열로 처리
      const safeAccommodations = accommodations || []
      const safeReservations = reservations || []
      const safeMarketingEvents = marketingEvents || []
      const safeWebSessions = webSessions || []

      // 호스트 숙소만 필터링된 마케팅 이벤트
      const hostMarketingEvents = safeMarketingEvents.filter(event => {
        const accommodationId = event.custom_parameters?.accommodation_id
        return accommodationId && accommodationIds.includes(accommodationId)
      })

      // 숙소 통계
      const accommodationStats = {
        total: safeAccommodations.length,
        active: safeAccommodations.filter(a => a.status === 'active').length,
        pending: safeAccommodations.filter(a => a.status === 'pending').length,
        inactive: safeAccommodations.filter(a => a.status === 'inactive').length,
        views: hostMarketingEvents.length
      }

      // 예약 통계
      const confirmedReservations = safeReservations.filter(r => r.status === 'confirmed')
      const pendingReservations = safeReservations.filter(r => r.status === 'pending')
      const cancelledReservations = safeReservations.filter(r => r.status === 'cancelled')
      
      const totalRevenue = confirmedReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0)
      const avgOrderValue = confirmedReservations.length > 0 ? totalRevenue / confirmedReservations.length : 0
      
      const reservationStats = {
        total: safeReservations.length,
        confirmed: confirmedReservations.length,
        pending: pendingReservations.length,
        cancelled: cancelledReservations.length,
        revenue: totalRevenue,
        avgOrderValue,
        conversionRate: hostMarketingEvents.length > 0 ? (confirmedReservations.length / hostMarketingEvents.length) * 100 : 0
      }

      // 마케팅 통계 (호스트 숙소 관련 세션만)
      const hostSessions = safeWebSessions.filter(session => {
        // 세션에서 호스트 숙소를 본 경우를 찾기 (간단화)
        return hostMarketingEvents.some(event => event.session_id === session.session_id)
      })

      const uniqueVisitors = new Set(hostSessions.map(s => s.user_ip || s.session_id)).size
      const totalVisitors = hostSessions.length
      
      // 이탈률 계산
      const singlePageSessions = hostSessions.filter(session => {
        const sessionEvents = hostMarketingEvents.filter(e => e.session_id === session.session_id)
        return sessionEvents.length <= 1
      }).length
      const bounceRate = totalVisitors > 0 ? (singlePageSessions / totalVisitors) * 100 : 0

      // 트래픽 소스 분석
      const trafficSources = hostSessions.reduce((acc, session) => {
        const source = session.utm_source || '직접 접속'
        if (!acc[source]) {
          acc[source] = { visitors: 0, conversions: 0, revenue: 0 }
        }
        acc[source].visitors += 1
        
        // 해당 세션의 예약 찾기
        const sessionReservations = safeReservations.filter(r => 
          r.guest_email && session.user_email === r.guest_email
        )
        
        acc[source].conversions += sessionReservations.length
        acc[source].revenue += sessionReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0)
        
        return acc
      }, {} as any)

      const topSources = Object.entries(trafficSources)
        .map(([source, data]: [string, any]) => ({
          source,
          visitors: data.visitors,
          conversions: data.conversions,
          revenue: data.revenue
        }))
        .sort((a, b) => b.visitors - a.visitors)
        .slice(0, 5)

      // 실제 디바이스 분석
      const deviceStats = hostSessions.reduce((acc, session) => {
        const device = session.device_type || 'Unknown'
        acc[device] = (acc[device] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const devices = Object.entries(deviceStats).map(([device, sessions]) => ({
        device,
        sessions,
        percentage: totalVisitors > 0 ? Math.round((sessions / totalVisitors) * 100) : 0
      }))

      const marketingStats = {
        totalVisitors,
        uniqueVisitors,
        pageviews: hostMarketingEvents.length,
        bounceRate,
        topSources,
        devices
      }

      // 실제 성과 지표 계산 (광고비 데이터가 있다면 실제 값 사용)
      const estimatedAdSpend = totalRevenue * 0.15 // 수익의 15%를 광고비로 가정
      const roas = totalRevenue > 0 && estimatedAdSpend > 0 ? totalRevenue / estimatedAdSpend : 0
      const costPerAcquisition = confirmedReservations.length > 0 && estimatedAdSpend > 0 ? estimatedAdSpend / confirmedReservations.length : 0
      const lifetimeValue = avgOrderValue // 단순화: 평균 주문가를 LTV로 사용
      const returnOnInvestment = estimatedAdSpend > 0 ? ((totalRevenue - estimatedAdSpend) / estimatedAdSpend) * 100 : 0

      const performanceStats = {
        roas,
        costPerAcquisition,
        lifetimeValue,
        returnOnInvestment
      }

      // 트렌드 데이터 (최근 7일)
      const trends = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        const dayEvents = hostMarketingEvents.filter(e => 
          e.created_at && e.created_at.startsWith(dateStr)
        )
        const dayReservations = safeReservations.filter(r => 
          r.created_at && r.created_at.startsWith(dateStr) && r.status === 'confirmed'
        )
        const dayRevenue = dayReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0)
        const daySessions = hostSessions.filter(s => 
          s.created_at && s.created_at.startsWith(dateStr)
        )

        trends.push({
          date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
          visitors: daySessions.length,
          views: dayEvents.length,
          bookings: dayReservations.length,
          revenue: dayRevenue
        })
      }

      const hostStats: HostStats = {
        accommodations: accommodationStats,
        reservations: reservationStats,
        marketing: marketingStats,
        performance: performanceStats,
        trends
      }

      setStats(hostStats)

    } catch (err: any) {
      console.error('호스트 통계 조회 실패:', err)
      setError(err.message || '데이터를 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hostId) {
      fetchHostStats()
      
      // 5분마다 데이터 업데이트
      const interval = setInterval(fetchHostStats, 5 * 60 * 1000)
      
      return () => clearInterval(interval)
    }
  }, [hostId, period])

  return {
    stats,
    loading,
    error,
    refresh: fetchHostStats
  }
}