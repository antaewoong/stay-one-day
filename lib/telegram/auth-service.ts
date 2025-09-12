/**
 * 완전한 RLS 정책을 준수하는 텔레그램 봇 인증 서비스
 * - 관리자만 접근 가능
 * - 모든 DB 작업은 RLS 정책을 완전히 준수
 * - Service Role 사용 없이 안전한 인증
 */

import { createClient } from '@/lib/supabase/server'

interface TelegramSession {
  id: string
  admin_id: string
  chat_id: number
  telegram_user_id: number
  telegram_username?: string
  telegram_first_name?: string
  is_active: boolean
  last_activity: string
  created_at: string
}

interface TelegramToken {
  id: string
  token: string
  admin_email: string
  created_by_admin_id: string
  expires_at: string
  is_used: boolean
  used_at?: string
  created_at: string
}

/**
 * RLS 정책을 완전히 준수하는 텔레그램 봇 인증 서비스
 */
export class TelegramAuthService {

  /**
   * 관리자 등록 토큰 생성 (RLS 준수) - 직접 방식
   */
  async generateRegistrationTokenDirect(
    adminEmail: string, 
    requestedByAdminEmail: string,
    requestingAdminUserId: string
  ): Promise<string | null> {
    try {
      console.log(`🔍 직접 토큰 생성 시작: ${adminEmail} by ${requestedByAdminEmail}`)
      
      // 1. 요청한 관리자 확인 (이미 API에서 검증됨)
      const supabase = createClient()
      
      const { data: requestingAdmin, error: requestingError } = await supabase
        .from('admin_accounts')
        .select('id, email, is_active')
        .eq('auth_user_id', requestingAdminUserId)
        .eq('is_active', true)
        .single()

      if (requestingError || !requestingAdmin) {
        console.error('❌ 요청 관리자 확인 실패:', requestingError)
        return null
      }

      // 2. 안전한 토큰 생성
      const token = this.generateSecureToken()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1시간 후

      // 3. 토큰을 DB에 저장 (RLS 정책 준수)
      const { data, error } = await supabase
        .from('telegram_registration_tokens')
        .insert({
          token,
          admin_email: adminEmail.toLowerCase(),
          created_by_admin_id: requestingAdmin.id,
          expires_at: expiresAt
        })
        .select()
        .single()

      if (error) {
        console.error('❌ 토큰 저장 실패:', error)
        return null
      }

      console.log(`✅ 텔레그램 등록 토큰 생성: ${adminEmail} by ${requestedByAdminEmail}`)
      return token

    } catch (error) {
      console.error('직접 토큰 생성 실패:', error)
      return null
    }
  }

  /**
   * 토큰을 사용한 관리자 등록 (RLS 준수)
   */
  async registerAdminWithToken(token: string, telegramUser: {
    chatId: number
    userId: number
    username?: string
    firstName?: string
    lastName?: string
  }): Promise<{ success: boolean; admin?: any; error?: string }> {
    try {
      const supabase = createClient()

      // 1. 토큰 유효성 확인
      const { data: tokenData, error: tokenError } = await supabase
        .from('telegram_registration_tokens')
        .select('*')
        .eq('token', token)
        .eq('is_used', false)
        .gte('expires_at', new Date().toISOString())
        .single()

      if (tokenError || !tokenData) {
        return { 
          success: false, 
          error: tokenError?.code === 'PGRST116' 
            ? '유효하지 않거나 만료된 토큰입니다' 
            : '토큰 확인 중 오류가 발생했습니다' 
        }
      }

      // 2. 대상 관리자 정보 조회
      const { data: admin, error: adminError } = await supabase
        .from('admin_accounts')
        .select('id, email, is_active')
        .eq('email', tokenData.admin_email)
        .eq('is_active', true)
        .single()

      if (adminError || !admin) {
        return { success: false, error: '관리자 계정을 찾을 수 없습니다' }
      }

      // 3. 기존 세션이 있으면 비활성화
      await supabase
        .from('telegram_sessions')
        .update({ is_active: false })
        .eq('admin_id', admin.id)

      // 4. 새로운 세션 생성
      const { data: session, error: sessionError } = await supabase
        .from('telegram_sessions')
        .insert({
          admin_id: admin.id,
          chat_id: telegramUser.chatId,
          telegram_user_id: telegramUser.userId,
          telegram_username: telegramUser.username,
          telegram_first_name: telegramUser.firstName
        })
        .select()
        .single()

      if (sessionError) {
        console.error('세션 생성 실패:', sessionError)
        return { success: false, error: '세션 생성에 실패했습니다' }
      }

      // 5. 토큰을 사용됨으로 표시
      await supabase
        .from('telegram_registration_tokens')
        .update({ 
          is_used: true, 
          used_at: new Date().toISOString() 
        })
        .eq('id', tokenData.id)

      // 6. 관리자 테이블에 텔레그램 정보 업데이트
      await supabase
        .from('admin_accounts')
        .update({
          telegram_chat_id: telegramUser.chatId,
          telegram_username: telegramUser.username,
          telegram_first_name: telegramUser.firstName
        })
        .eq('id', admin.id)

      console.log(`✅ 텔레그램 관리자 등록 완료: ${admin.email} (${telegramUser.chatId})`)

      return {
        success: true,
        admin: {
          adminId: admin.id,
          email: admin.email,
          telegram_chat_id: telegramUser.chatId,
          is_active: true,
          registered_at: session.created_at
        }
      }

    } catch (error) {
      console.error('관리자 등록 실패:', error)
      return { success: false, error: '등록 처리 중 오류가 발생했습니다' }
    }
  }

  /**
   * 관리자 인증 확인 (RLS 준수)
   */
  async authenticateAdmin(chatId: number): Promise<{ isValid: boolean; admin?: any }> {
    try {
      const supabase = createClient()

      // 활성 세션 조회
      const { data: session, error } = await supabase
        .from('telegram_sessions')
        .select(`
          *,
          admin_accounts!inner(id, email, is_active)
        `)
        .eq('chat_id', chatId)
        .eq('is_active', true)
        .single()

      if (error || !session || !session.admin_accounts.is_active) {
        return { isValid: false }
      }

      // 세션 활동 시간 업데이트
      await supabase
        .from('telegram_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', session.id)

      return {
        isValid: true,
        admin: {
          adminId: session.admin_id,
          email: session.admin_accounts.email,
          chatId: session.chat_id
        }
      }

    } catch (error) {
      console.error('인증 확인 실패:', error)
      return { isValid: false }
    }
  }

  /**
   * 관리자 로그아웃 (세션 종료) (RLS 준수)
   */
  async logoutAdmin(chatId: number): Promise<boolean> {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('telegram_sessions')
        .update({ is_active: false })
        .eq('chat_id', chatId)

      if (error) {
        console.error('로그아웃 실패:', error)
        return false
      }

      console.log(`📤 텔레그램 관리자 로그아웃: ${chatId}`)
      return true

    } catch (error) {
      console.error('로그아웃 처리 실패:', error)
      return false
    }
  }

  /**
   * 활성 세션 목록 조회 (RLS 준수)
   */
  async getActiveSessions(): Promise<Array<{
    chatId: number
    email: string
    createdAt: string
    lastActivity: string
  }>> {
    try {
      const supabase = createClient()

      const { data: sessions, error } = await supabase
        .from('telegram_sessions')
        .select(`
          chat_id,
          created_at,
          last_activity,
          admin_accounts!inner(email)
        `)
        .eq('is_active', true)

      if (error) {
        console.error('세션 목록 조회 실패:', error)
        return []
      }

      return sessions.map(session => ({
        chatId: session.chat_id,
        email: session.admin_accounts.email,
        createdAt: session.created_at,
        lastActivity: session.last_activity
      }))

    } catch (error) {
      console.error('세션 목록 조회 실패:', error)
      return []
    }
  }

  /**
   * 비상시 모든 세션 무효화 (RLS 준수)
   */
  async emergencyInvalidateAllSessions(reason: string): Promise<{ success: boolean; count: number }> {
    try {
      const supabase = createClient()

      // 현재 활성 세션 수 조회
      const { count } = await supabase
        .from('telegram_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // 모든 세션 비활성화
      const { error } = await supabase
        .from('telegram_sessions')
        .update({ is_active: false })
        .eq('is_active', true)

      if (error) {
        console.error('비상 세션 무효화 실패:', error)
        return { success: false, count: 0 }
      }

      // 모든 미사용 토큰 무효화
      await supabase
        .from('telegram_registration_tokens')
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq('is_used', false)

      console.log(`🚨 비상 조치: ${count || 0}개 세션 모두 무효화됨 (사유: ${reason})`)
      return { success: true, count: count || 0 }

    } catch (error) {
      console.error('비상 무효화 실패:', error)
      return { success: false, count: 0 }
    }
  }

  /**
   * 특정 세션 종료 (RLS 준수)
   */
  async terminateSession(chatId: number): Promise<boolean> {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('telegram_sessions')
        .update({ is_active: false })
        .eq('chat_id', chatId)

      if (error) {
        console.error('세션 종료 실패:', error)
        return false
      }

      console.log(`🔒 텔레그램 세션 종료: ${chatId}`)
      return true

    } catch (error) {
      console.error('세션 종료 처리 실패:', error)
      return false
    }
  }

  /**
   * 안전한 토큰 생성
   */
  private generateSecureToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let token = ''
    
    for (let i = 0; i < 64; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    return token
  }

  /**
   * 로그 기록 (RLS 준수 - 실제 필요시 구현)
   */
  async logSecurityEvent(chatId: number, eventType: string, details: any = {}): Promise<void> {
    // RLS 원칙에 따라 보안 로그는 별도 시스템으로 분리하거나
    // 필요시 admin_activity_logs 테이블 활용
    console.log(`📝 [${eventType}] Chat ${chatId}:`, details)
  }
}

// 싱글톤 인스턴스
export const telegramAuth = new TelegramAuthService()