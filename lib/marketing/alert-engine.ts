/**
 * 🚨 Stay OneDay 마케팅 알림 엔진
 * 
 * 호스트가 놓치면 안 되는 중요한 순간들을 실시간으로 알림
 * - 지역 상권 급등 (LHI_SPIKE): "300m 거리 맛집 대박!"
 * - CPA 급증 (CPA_SPIKE): "광고비 효율 악화 감지!" 
 * - 리뷰 속도 하락 (REVIEW_VELOCITY_DROP): "경쟁사 대비 리뷰 급감!"
 * 
 * ⚠️  알림 전송 방식: 
 * - 호스트: 웹 알림 + 이메일 (대시보드 내 알림함)
 * - 관리자: 텔레그램 봇 (운영진 모니터링용)
 */

import { createClient } from '@/lib/supabase/client'
import { telegramAuth } from '@/lib/telegram/auth-service'

export interface AlertRule {
  id: string
  hostId: string
  ruleType: 'LHI_SPIKE' | 'CPA_SPIKE' | 'REVIEW_VELOCITY_DROP' | 'CONVERSION_DROP' | 'COMPETITOR_SURGE' | 'LHI_GROUP_SPIKE' | 'KIDS_MOMENTUM' | 'BRIDAL_OPPORTUNITY'
  ruleName: string
  threshold: {
    delta?: number
    minThreshold?: number
    windowDays?: number
    minCost?: number
    minClicks?: number
    competitorGrowth?: number
  }
  cooldownHours: number
  enabled: boolean
  personaTarget?: 'all' | 'moms' | 'bridal' | 'friends' | 'couples'
  emotionThreshold?: number
}

export interface AlertTrigger {
  ruleId: string
  hostId: string
  alertType: string
  title: string
  message: string
  data: any
  priority: 1 | 2 | 3 // 1=높음, 2=보통, 3=낮음
}

export class MarketingAlertEngine {
  private supabase = createClient()

  /**
   * 🔥 메인 알림 체크 루틴 - 크론으로 실행
   */
  async checkAllAlerts(): Promise<void> {
    try {
      console.log('🔍 마케팅 알림 체크 시작...', new Date().toISOString())

      // 활성화된 모든 알림 룰 조회
      const { data: activeRules } = await this.supabase
        .from('alert_rules')
        .select('*')
        .eq('enabled', true)

      if (!activeRules || activeRules.length === 0) {
        console.log('활성화된 알림 룰이 없습니다.')
        return
      }

      console.log(`📋 ${activeRules.length}개 알림 룰 검사 중...`)

      for (const rule of activeRules) {
        await this.checkSingleRule(rule)
        
        // 각 룰 간 0.5초 간격 (API 부하 방지)
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      console.log('✅ 모든 알림 체크 완료')

    } catch (error) {
      console.error('❌ 알림 체크 실행 실패:', error)
      throw error
    }
  }

  /**
   * 개별 알림 룰 체크
   */
  private async checkSingleRule(rule: AlertRule): Promise<void> {
    try {
      // 쿨다운 체크 - 최근에 같은 룰로 알림을 보냈는지 확인
      const cooldownCheck = await this.supabase
        .from('alerts_outbox')
        .select('sent_at')
        .eq('host_id', rule.hostId)
        .eq('rule_id', rule.id)
        .eq('status', 'sent')
        .gte('sent_at', new Date(Date.now() - rule.cooldownHours * 60 * 60 * 1000).toISOString())
        .single()

      if (cooldownCheck.data) {
        console.log(`⏰ 룰 ${rule.ruleName} - 쿨다운 중 (${rule.cooldownHours}시간)`)
        return
      }

      // 룰 타입별 체크 실행
      let trigger: AlertTrigger | null = null

      switch (rule.ruleType) {
        case 'LHI_SPIKE':
          trigger = await this.checkLHISpike(rule)
          break
        case 'CPA_SPIKE':
          trigger = await this.checkCPASpike(rule)
          break
        case 'REVIEW_VELOCITY_DROP':
          trigger = await this.checkReviewVelocityDrop(rule)
          break
        case 'CONVERSION_DROP':
          trigger = await this.checkConversionDrop(rule)
          break
        case 'COMPETITOR_SURGE':
          trigger = await this.checkCompetitorSurge(rule)
          break
        // 🎯 새로운 모임 특화 알림 룰들
        case 'LHI_GROUP_SPIKE':
          trigger = await this.checkLHIGroupSpike(rule)
          break
        case 'KIDS_MOMENTUM':
          trigger = await this.checkKidsMomentum(rule)
          break
        case 'BRIDAL_OPPORTUNITY':
          trigger = await this.checkBridalOpportunity(rule)
          break
      }

      // 알림 트리거 발생 시 outbox에 추가
      if (trigger) {
        await this.addToAlertOutbox(trigger)
        console.log(`🚨 알림 발생: ${trigger.title} (호스트: ${rule.hostId})`)
      }

    } catch (error) {
      console.error(`❌ 룰 체크 실패 (${rule.ruleName}):`, error)
    }
  }

  /**
   * 🔥 지역 히트 인덱스 급등 체크
   */
  private async checkLHISpike(rule: AlertRule): Promise<AlertTrigger | null> {
    try {
      const { delta = 15, windowDays = 3, minThreshold = 50 } = rule.threshold

      // 호스트의 숙소들 조회
      const { data: accommodations } = await this.supabase
        .from('accommodations')
        .select('id, name, location_lat, location_lng')
        .eq('host_id', rule.hostId)

      if (!accommodations || accommodations.length === 0) return null

      for (const accommodation of accommodations) {
        // 최근 LHI 데이터 조회
        const { data: lhiData } = await this.supabase
          .from('poi_heat_daily')
          .select('heat_score, trend_7d, top_contributors, date')
          .eq('accommodation_id', accommodation.id)
          .eq('buffer_m', 500)
          .order('date', { ascending: false })
          .limit(windowDays)

        if (!lhiData || lhiData.length < 2) continue

        const latestLHI = lhiData[0]
        const previousLHI = lhiData[1]

        // LHI 급등 체크
        const change = ((latestLHI.heat_score - previousLHI.heat_score) / previousLHI.heat_score) * 100

        if (change >= delta && latestLHI.heat_score >= minThreshold) {
          const topPOIs = latestLHI.top_contributors || []
          const topPOINames = topPOIs.slice(0, 2).map((poi: any) => poi.name).join(', ')

          return {
            ruleId: rule.id,
            hostId: rule.hostId,
            alertType: 'LHI_SPIKE',
            title: '🔥 지역 히트 급등 감지!',
            message: `📍${accommodation.name} 주변 500m (+${Math.round(change)}%)
- Top POI: ${topPOINames}
- 제안: 현수막·리퍼럴 제휴 / 인스타 릴스 3컷 업로드 / 네이버 포토 12장 보강
[빠른 실행] 맛집 사장과 제휴 협의  |  [무시] /mute_LHI_24h`,
            data: {
              accommodationId: accommodation.id,
              accommodationName: accommodation.name,
              lhiChange: Math.round(change),
              currentScore: latestLHI.heat_score,
              topPOIs: topPOIs.slice(0, 3),
              bufferM: 500
            },
            priority: change > 25 ? 1 : 2
          }
        }
      }

      return null

    } catch (error) {
      console.error('LHI 스파이크 체크 실패:', error)
      return null
    }
  }

  /**
   * 💰 CPA 급증 체크
   */
  private async checkCPASpike(rule: AlertRule): Promise<AlertTrigger | null> {
    try {
      const { delta = 30, minCost = 50000, windowDays = 1 } = rule.threshold

      // 최근 광고 성과 데이터 조회 (RLS 자동 적용)
      const { data: recentSpend } = await this.supabase
        .from('spend_daily')
        .select('channel, cost, conversions, date')
        .eq('host_id', rule.hostId)
        .gte('date', new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .gte('cost', minCost)

      if (!recentSpend || recentSpend.length === 0) return null

      // 이전 기간 데이터 조회
      const { data: previousSpend } = await this.supabase
        .from('spend_daily')
        .select('channel, cost, conversions, date')
        .eq('host_id', rule.hostId)
        .gte('date', new Date(Date.now() - windowDays * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .lt('date', new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      if (!previousSpend || previousSpend.length === 0) return null

      // 채널별 CPA 계산
      for (const channel of ['naver', 'google', 'instagram', 'facebook']) {
        const recentChannelData = recentSpend.filter(s => s.channel === channel)
        const previousChannelData = previousSpend.filter(s => s.channel === channel)

        if (recentChannelData.length === 0 || previousChannelData.length === 0) continue

        const recentCPA = this.calculateCPA(recentChannelData)
        const previousCPA = this.calculateCPA(previousChannelData)

        if (recentCPA && previousCPA) {
          const change = ((recentCPA - previousCPA) / previousCPA) * 100

          if (change >= delta) {
            return {
              ruleId: rule.id,
              hostId: rule.hostId,
              alertType: 'CPA_SPIKE',
              title: '💸 CPA 급증 알림',
              message: `📊 ${channel} 채널 CPA +${Math.round(change)}% 증가
- 현재 CPA: ${recentCPA.toLocaleString()}원
- 이전 CPA: ${previousCPA.toLocaleString()}원
- 제안: 타겟팅 재검토 / 크리에이티브 교체 / 예산 일시 중단
[긴급 대응] 광고 설정 점검  |  [분석] /cpa_detail_${channel}`,
              data: {
                channel,
                currentCPA: Math.round(recentCPA),
                previousCPA: Math.round(previousCPA),
                change: Math.round(change),
                totalCost: recentChannelData.reduce((sum, s) => sum + s.cost, 0)
              },
              priority: change > 50 ? 1 : 2
            }
          }
        }
      }

      return null

    } catch (error) {
      console.error('CPA 스파이크 체크 실패:', error)
      return null
    }
  }

  /**
   * 📉 리뷰 속도 하락 체크
   */
  private async checkReviewVelocityDrop(rule: AlertRule): Promise<AlertTrigger | null> {
    try {
      const { delta = -20, windowDays = 7 } = rule.threshold

      // 호스트의 숙소들 조회
      const { data: accommodations } = await this.supabase
        .from('accommodations')
        .select('id, name')
        .eq('host_id', rule.hostId)

      if (!accommodations || accommodations.length === 0) return null

      for (const accommodation of accommodations) {
        // 최근 경쟁사 스냅샷 조회
        const { data: snapshots } = await this.supabase
          .from('competitor_snapshot')
          .select('competitor_name, recent_reviews_7d, captured_at')
          .eq('accommodation_id', accommodation.id)
          .eq('channel', 'naver_place')
          .gte('captured_at', new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString())
          .order('captured_at', { ascending: false })

        if (!snapshots || snapshots.length < 2) continue

        // 내 숙소 vs 경쟁사 리뷰 속도 비교
        const mySnapshots = snapshots.filter(s => s.competitor_name === accommodation.name)
        const competitorSnapshots = snapshots.filter(s => s.competitor_name !== accommodation.name)

        if (mySnapshots.length === 0 || competitorSnapshots.length === 0) continue

        const myRecentReviews = mySnapshots[0]?.recent_reviews_7d || 0
        const avgCompetitorReviews = competitorSnapshots.reduce((sum, s) => sum + s.recent_reviews_7d, 0) / competitorSnapshots.length

        if (avgCompetitorReviews > 0) {
          const relativeDrop = ((myRecentReviews - avgCompetitorReviews) / avgCompetitorReviews) * 100

          if (relativeDrop <= delta) {
            return {
              ruleId: rule.id,
              hostId: rule.hostId,
              alertType: 'REVIEW_VELOCITY_DROP',
              title: '📉 리뷰 속도 하락 감지',
              message: `📝 ${accommodation.name} 리뷰 속도 ${Math.abs(Math.round(relativeDrop))}% 하락
- 내 리뷰: 최근 7일 ${myRecentReviews}개
- 경쟁사 평균: ${Math.round(avgCompetitorReviews)}개
- 제안: 체크아웃 리뷰 유도 문자 / 리뷰 이벤트 / 서비스 품질 점검
[즉시 대응] 리뷰 유도 강화  |  [분석] /review_analysis`,
              data: {
                accommodationId: accommodation.id,
                accommodationName: accommodation.name,
                myReviews: myRecentReviews,
                competitorAvg: Math.round(avgCompetitorReviews),
                relativeDrop: Math.round(relativeDrop)
              },
              priority: Math.abs(relativeDrop) > 40 ? 1 : 2
            }
          }
        }
      }

      return null

    } catch (error) {
      console.error('리뷰 속도 체크 실패:', error)
      return null
    }
  }

  /**
   * 📱 전환율 급락 체크
   */
  private async checkConversionDrop(rule: AlertRule): Promise<AlertTrigger | null> {
    try {
      const { delta = -25, minClicks = 100, windowDays = 3 } = rule.threshold

      // 최근 전환 데이터
      const { data: recentData } = await this.supabase
        .from('spend_daily')
        .select('clicks, conversions, channel')
        .eq('host_id', rule.hostId)
        .gte('date', new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      if (!recentData || recentData.length === 0) return null

      const totalClicks = recentData.reduce((sum, d) => sum + d.clicks, 0)
      const totalConversions = recentData.reduce((sum, d) => sum + d.conversions, 0)

      if (totalClicks < minClicks) return null

      const currentConversionRate = (totalConversions / totalClicks) * 100

      // 이전 기간 데이터
      const { data: previousData } = await this.supabase
        .from('spend_daily')
        .select('clicks, conversions, channel')
        .eq('host_id', rule.hostId)
        .gte('date', new Date(Date.now() - windowDays * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .lt('date', new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      if (!previousData || previousData.length === 0) return null

      const prevTotalClicks = previousData.reduce((sum, d) => sum + d.clicks, 0)
      const prevTotalConversions = previousData.reduce((sum, d) => sum + d.conversions, 0)

      if (prevTotalClicks === 0) return null

      const previousConversionRate = (prevTotalConversions / prevTotalClicks) * 100
      const change = ((currentConversionRate - previousConversionRate) / previousConversionRate) * 100

      if (change <= delta) {
        return {
          ruleId: rule.id,
          hostId: rule.hostId,
          alertType: 'CONVERSION_DROP',
          title: '📉 전환율 급락 알림',
          message: `📊 전환율 ${Math.abs(Math.round(change))}% 하락
- 현재 전환율: ${currentConversionRate.toFixed(1)}%
- 이전 전환율: ${previousConversionRate.toFixed(1)}%
- 제안: 랜딩페이지 점검 / 예약 프로세스 확인 / 가격 경쟁력 검토
[긴급 점검] 예약 프로세스 확인  |  [분석] /conversion_analysis`,
          data: {
            currentRate: Math.round(currentConversionRate * 10) / 10,
            previousRate: Math.round(previousConversionRate * 10) / 10,
            change: Math.round(change),
            totalClicks,
            totalConversions
          },
          priority: Math.abs(change) > 40 ? 1 : 2
        }
      }

      return null

    } catch (error) {
      console.error('전환율 급락 체크 실패:', error)
      return null
    }
  }

  /**
   * 🏆 경쟁사 급성장 체크
   */
  private async checkCompetitorSurge(rule: AlertRule): Promise<AlertTrigger | null> {
    try {
      const { competitorGrowth = 50, windowDays = 7 } = rule.threshold

      // 호스트 숙소별 경쟁사 데이터 조회
      const { data: accommodations } = await this.supabase
        .from('accommodations')
        .select('id, name')
        .eq('host_id', rule.hostId)

      if (!accommodations || accommodations.length === 0) return null

      for (const accommodation of accommodations) {
        const { data: competitorData } = await this.supabase
          .from('competitor_snapshot')
          .select('competitor_name, recent_reviews_7d, review_count, captured_at')
          .eq('accommodation_id', accommodation.id)
          .eq('channel', 'naver_place')
          .neq('competitor_name', accommodation.name) // 내 숙소 제외
          .gte('captured_at', new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString())
          .order('recent_reviews_7d', { ascending: false })

        if (!competitorData || competitorData.length === 0) continue

        // 가장 많이 성장한 경쟁사 찾기
        const topCompetitor = competitorData[0]
        
        if (topCompetitor.recent_reviews_7d >= competitorGrowth) {
          return {
            ruleId: rule.id,
            hostId: rule.hostId,
            alertType: 'COMPETITOR_SURGE',
            title: '🏆 경쟁사 급성장 감지',
            message: `🚀 ${topCompetitor.competitor_name} 최근 7일 리뷰 ${topCompetitor.recent_reviews_7d}개 급증
- 총 리뷰: ${topCompetitor.review_count}개
- 제안: 경쟁사 전략 분석 / 서비스 차별화 강화 / 프로모션 대응
[경쟁 분석] 상세 경쟁사 리포트  |  [대응전략] /competitor_response`,
            data: {
              accommodationId: accommodation.id,
              accommodationName: accommodation.name,
              competitorName: topCompetitor.competitor_name,
              competitorGrowth: topCompetitor.recent_reviews_7d,
              competitorTotal: topCompetitor.review_count
            },
            priority: topCompetitor.recent_reviews_7d > 100 ? 1 : 2
          }
        }
      }

      return null

    } catch (error) {
      console.error('경쟁사 급성장 체크 실패:', error)
      return null
    }
  }

  /**
   * 알림을 outbox에 추가
   */
  private async addToAlertOutbox(trigger: AlertTrigger): Promise<void> {
    try {
      await this.supabase
        .from('alerts_outbox')
        .insert({
          host_id: trigger.hostId,
          rule_id: trigger.ruleId,
          alert_type: trigger.alertType,
          title: trigger.title,
          message: trigger.message,
          data: trigger.data,
          priority: trigger.priority,
          status: 'pending',
          scheduled_at: new Date().toISOString()
        })

      console.log(`✅ 알림 outbox 추가: ${trigger.title}`)

    } catch (error) {
      console.error('❌ 알림 outbox 추가 실패:', error)
      throw error
    }
  }

  /**
   * outbox 알림 전송 처리
   */
  async processAlertOutbox(): Promise<void> {
    try {
      // 전송 대기 중인 알림들 조회
      const { data: pendingAlerts } = await this.supabase
        .from('alerts_outbox')
        .select(`
          *,
          alert_rules!inner(host_id)
        `)
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(10) // 한 번에 최대 10개씩 처리

      if (!pendingAlerts || pendingAlerts.length === 0) {
        console.log('전송할 알림이 없습니다.')
        return
      }

      console.log(`📨 ${pendingAlerts.length}개 알림 전송 처리 중...`)

      for (const alert of pendingAlerts) {
        try {
          // 호스트에게 웹 알림 전송 (대시보드 알림함)
          const hostSuccess = await this.sendHostWebNotification(alert)
          
          // 관리자에게 텔레그램 모니터링 알림 (중요도 1-2만)
          let adminSuccess = true
          if (alert.priority <= 2) {
            adminSuccess = await this.sendAdminTelegramAlert(alert)
          }

          // 전송 결과 업데이트
          await this.supabase
            .from('alerts_outbox')
            .update({
              status: (hostSuccess && adminSuccess) ? 'sent' : 'failed',
              sent_at: (hostSuccess && adminSuccess) ? new Date().toISOString() : null,
              metadata: {
                ...alert.metadata,
                host_notification_sent: hostSuccess,
                admin_notification_sent: adminSuccess,
                last_attempt: new Date().toISOString()
              }
            })
            .eq('id', alert.id)

          if (hostSuccess && adminSuccess) {
            console.log(`✅ 알림 전송 성공: ${alert.title}`)
          } else {
            console.log(`❌ 알림 전송 실패: ${alert.title} (호스트: ${hostSuccess}, 관리자: ${adminSuccess})`)
          }

          // 각 전송 간 0.5초 간격
          await new Promise(resolve => setTimeout(resolve, 500))

        } catch (error) {
          console.error(`❌ 개별 알림 처리 실패 (ID: ${alert.id}):`, error)
          
          await this.supabase
            .from('alerts_outbox')
            .update({
              status: 'failed',
              attempts: alert.attempts + 1,
              error_message: error instanceof Error ? error.message : 'Unknown error'
            })
            .eq('id', alert.id)
        }
      }

      console.log('✅ 알림 outbox 처리 완료')

    } catch (error) {
      console.error('❌ 알림 outbox 처리 실패:', error)
      throw error
    }
  }

  /**
   * 호스트에게 웹 알림 전송 (대시보드 알림함)
   */
  private async sendHostWebNotification(alert: any): Promise<boolean> {
    try {
      // notifications 테이블에 알림 추가
      await this.supabase
        .from('notifications')
        .insert({
          user_id: alert.host_id,
          title: alert.title,
          message: alert.message,
          type: 'marketing_alert',
          priority: alert.priority,
          metadata: {
            alert_type: alert.alert_type,
            alert_data: alert.metadata,
            accommodation_id: alert.metadata?.accommodationId
          },
          is_read: false,
          created_at: new Date().toISOString()
        })

      console.log(`✅ 호스트 웹 알림 전송 성공: ${alert.host_id}`)
      return true

    } catch (error) {
      console.error('❌ 호스트 웹 알림 전송 실패:', error)
      return false
    }
  }

  /**
   * 관리자에게 텔레그램 모니터링 알림 전송 (중요한 알림만)
   */
  private async sendAdminTelegramAlert(alert: any): Promise<boolean> {
    try {
      // 관리자 세션들 조회 (Ryan, Frank)
      const activeSessions = await telegramAuth.getActiveSessions()

      if (!activeSessions || activeSessions.length === 0) {
        console.log('❌ 활성화된 관리자 텔레그램 세션 없음')
        return false
      }

      const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
      
      if (!telegramBotToken) {
        console.error('❌ TELEGRAM_BOT_TOKEN이 설정되지 않음')
        return false
      }

      // 관리자용 모니터링 메시지 생성
      const adminMessage = `🔍 호스트 마케팅 알림 모니터링\n\n` +
        `📍 호스트: ${alert.host_id}\n` +
        `🎯 알림 타입: ${alert.alert_type}\n` +
        `⚡ 우선순위: ${alert.priority}\n\n` +
        `${alert.title}\n${alert.message}`

      // 모든 관리자에게 전송
      let successCount = 0
      for (const session of activeSessions) {
        try {
          const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              chat_id: session.chatId,
              text: adminMessage,
              parse_mode: 'Markdown'
            })
          })

          const result = await response.json()
          
          if (result.ok) {
            successCount++
            console.log(`✅ 관리자 텔레그램 전송 성공: ${session.chatId}`)
          } else {
            console.error('❌ 관리자 텔레그램 API 오류:', result)
          }
        } catch (sessionError) {
          console.error('❌ 개별 관리자 텔레그램 전송 실패:', sessionError)
        }
      }

      return successCount > 0

    } catch (error) {
      console.error('❌ 관리자 텔레그램 알림 전송 실패:', error)
      return false
    }
  }

  /**
   * 🎯 그룹 LHI 급상승 체크 (모임 특화)
   */
  private async checkLHIGroupSpike(rule: AlertRule): Promise<AlertTrigger | null> {
    try {
      const { delta = 20, windowDays = 7 } = rule.threshold

      // 호스트의 숙소들 조회
      const { data: accommodations } = await this.supabase
        .from('accommodations')
        .select('id, name')
        .eq('host_id', rule.hostId)

      if (!accommodations || accommodations.length === 0) return null

      for (const accommodation of accommodations) {
        // 최근 7일 평균 vs 오늘 LHI Group 점수 비교
        const { data: recentData } = await this.supabase
          .from('mv_poi_heat_group')
          .select('lhi_group, top_contributors')
          .eq('accommodation_id', accommodation.id)
          .gte('date', new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString())
          .order('date', { ascending: false })

        if (!recentData || recentData.length < 2) continue

        const today = recentData[0]
        const weekAvg = recentData.slice(1).reduce((sum, d) => sum + d.lhi_group, 0) / (recentData.length - 1)
        
        if (weekAvg > 0 && ((today.lhi_group - weekAvg) / weekAvg * 100) >= delta) {
          const topPOI = today.top_contributors?.[0]
          
          return {
            ruleId: rule.id,
            hostId: rule.hostId,
            alertType: 'LHI_GROUP_SPIKE',
            title: '👪 그룹 모임 지수 급상승!',
            message: this.generateGroupSpikeMessage(accommodation.name, today.lhi_group, weekAvg, topPOI),
            data: {
              accommodationId: accommodation.id,
              currentScore: today.lhi_group,
              previousAvg: weekAvg,
              changePercent: ((today.lhi_group - weekAvg) / weekAvg * 100).toFixed(1),
              topContributor: topPOI
            },
            priority: 2
          }
        }
      }

      return null
    } catch (error) {
      console.error('LHI Group Spike 체크 실패:', error)
      return null
    }
  }

  /**
   * 👶 키즈 모멘텀 체크 (자모 모임 특화)
   */
  private async checkKidsMomentum(rule: AlertRule): Promise<AlertTrigger | null> {
    try {
      const { delta = 30, windowDays = 14 } = rule.threshold

      // 호스트 숙소의 키즈 친화 점수 변화 확인
      const { data: accommodations } = await this.supabase
        .from('accommodations')
        .select('id, name')
        .eq('host_id', rule.hostId)

      if (!accommodations || accommodations.length === 0) return null

      for (const accommodation of accommodations) {
        const { data: kidsData } = await this.supabase
          .from('mv_poi_heat_group')
          .select('total_kids_friendly_score, top_contributors')
          .eq('accommodation_id', accommodation.id)
          .gte('date', new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString())
          .order('date', { ascending: false })

        if (!kidsData || kidsData.length < 2) continue

        const recent = kidsData[0]
        const pastAvg = kidsData.slice(1).reduce((sum, d) => sum + d.total_kids_friendly_score, 0) / (kidsData.length - 1)
        
        if (pastAvg > 0 && ((recent.total_kids_friendly_score - pastAvg) / pastAvg * 100) >= delta) {
          const kidsPOIs = recent.top_contributors?.filter((poi: any) => poi.category?.includes('kids') || poi.category?.includes('family'))
          
          return {
            ruleId: rule.id,
            hostId: rule.hostId,
            alertType: 'KIDS_MOMENTUM',
            title: '🧸 키즈 친화 지수 상승!',
            message: this.generateKidsMomentumMessage(accommodation.name, recent.total_kids_friendly_score, pastAvg, kidsPOIs),
            data: {
              accommodationId: accommodation.id,
              currentScore: recent.total_kids_friendly_score,
              previousAvg: pastAvg,
              changePercent: ((recent.total_kids_friendly_score - pastAvg) / pastAvg * 100).toFixed(1),
              kidsPOIs
            },
            priority: 2
          }
        }
      }

      return null
    } catch (error) {
      console.error('Kids Momentum 체크 실패:', error)
      return null
    }
  }

  /**
   * 💒 브라이덜 기회 체크 (브라이덜샤워 특화)
   */
  private async checkBridalOpportunity(rule: AlertRule): Promise<AlertTrigger | null> {
    try {
      const { delta = 25 } = rule.threshold

      // 호스트 숙소의 포토존 + 감성공간 동시 상승 체크
      const { data: accommodations } = await this.supabase
        .from('accommodations')
        .select('id, name')
        .eq('host_id', rule.hostId)

      if (!accommodations || accommodations.length === 0) return null

      for (const accommodation of accommodations) {
        const { data: bridalData } = await this.supabase
          .from('mv_poi_heat_group')
          .select('total_photo_spot_score, total_sentiment_score, top_contributors')
          .eq('accommodation_id', accommodation.id)
          .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('date', { ascending: false })

        if (!bridalData || bridalData.length < 2) continue

        const recent = bridalData[0]
        const pastAvg = {
          photo: bridalData.slice(1).reduce((sum, d) => sum + d.total_photo_spot_score, 0) / (bridalData.length - 1),
          sentiment: bridalData.slice(1).reduce((sum, d) => sum + d.total_sentiment_score, 0) / (bridalData.length - 1)
        }
        
        const photoIncrease = pastAvg.photo > 0 ? ((recent.total_photo_spot_score - pastAvg.photo) / pastAvg.photo * 100) : 0
        const sentimentIncrease = pastAvg.sentiment > 0 ? ((recent.total_sentiment_score - pastAvg.sentiment) / pastAvg.sentiment * 100) : 0
        
        // 포토존과 감성공간이 동시에 상승한 경우
        if (photoIncrease >= delta && sentimentIncrease >= delta) {
          const bridalPOIs = recent.top_contributors?.filter((poi: any) => 
            poi.category?.includes('cafe') || poi.category?.includes('photo') || poi.category?.includes('emotional')
          )
          
          return {
            ruleId: rule.id,
            hostId: rule.hostId,
            alertType: 'BRIDAL_OPPORTUNITY',
            title: '💒 브라이덜샤워 기회 감지!',
            message: this.generateBridalOpportunityMessage(accommodation.name, photoIncrease, sentimentIncrease, bridalPOIs),
            data: {
              accommodationId: accommodation.id,
              photoIncrease: photoIncrease.toFixed(1),
              sentimentIncrease: sentimentIncrease.toFixed(1),
              bridalPOIs
            },
            priority: 1
          }
        }
      }

      return null
    } catch (error) {
      console.error('Bridal Opportunity 체크 실패:', error)
      return null
    }
  }

  /**
   * 모임 특화 메시지 생성 템플릿들
   */
  private generateGroupSpikeMessage(accommodationName: string, current: number, avg: number, topPOI: any): string {
    const increase = ((current - avg) / avg * 100).toFixed(1)
    const templates = [
      // 기회형
      `👪 그룹 모임 히트! ${accommodationName} 주변 모임 적합도 +${increase}%. ${topPOI?.name || '주요 POI'}가 뜨고 있어요. 평일 10-18시 타겟으로 '가족 모임' 오퍼 띄우면 좋을 것 같아요!`,
      
      // 실행형  
      `🍻 모임 지수 업! ${accommodationName} 근처 그룹 편의 시설 조합이 좋네요. '6시간 패키지' 만들어서 홍보해볼까요?`
    ]
    
    return templates[Math.floor(Math.random() * templates.length)]
  }

  private generateKidsMomentumMessage(accommodationName: string, current: number, avg: number, kidsPOIs: any[]): string {
    const increase = ((current - avg) / avg * 100).toFixed(1)
    const nearbyKids = kidsPOIs?.[0]?.name || '키즈 시설'
    
    const templates = [
      `👶 키즈 동선 히트! ${accommodationName} 반경 1km 아이 동반 편의 +${increase}%. ${nearbyKids} 덕분에 자모 모임 타이밍이에요.`,
      
      `🧸 자모 모임 기회! ${accommodationName} 주변 키즈 친화 시설이 급상승 중. 주말 가족 패키지로 어필해보세요!`
    ]
    
    return templates[Math.floor(Math.random() * templates.length)]
  }

  private generateBridalOpportunityMessage(accommodationName: string, photoInc: number, sentimentInc: number, bridalPOIs: any[]): string {
    const photoPOI = bridalPOIs?.[0]?.name || '포토존'
    
    const templates = [
      `💒 브라이덜샤워 촬영각! ${accommodationName} 포토존 +${photoInc.toFixed(1)}% + 감성공간 +${sentimentInc.toFixed(1)}% 동시상승. ${photoPOI} 조합으로 2주 내 주말 패키지 추천해요.`,
      
      `📸 감성 촬영 기회! ${accommodationName} 근처 ${photoPOI}가 핫해지고 있어요. 브라이덜샤워 타겟 마케팅 타이밍입니다!`
    ]
    
    return templates[Math.floor(Math.random() * templates.length)]
  }

  /**
   * CPA 계산 헬퍼 함수
   */
  private calculateCPA(spendData: any[]): number | null {
    const totalCost = spendData.reduce((sum, s) => sum + s.cost, 0)
    const totalConversions = spendData.reduce((sum, s) => sum + s.conversions, 0)
    
    return totalConversions > 0 ? totalCost / totalConversions : null
  }
}

// 싱글톤 인스턴스
export const marketingAlertEngine = new MarketingAlertEngine()