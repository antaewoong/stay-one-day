#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// 환경 변수
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const DO_WRITE = process.env.DO_WRITE === 'true'

// 설정 검증
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ 필수 환경변수 누락:')
  console.error('  SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_EMAIL, ADMIN_PASSWORD')
  process.exit(1)
}

console.log('🔍 Admin API 스모크 테스트 시작')
console.log(`📍 Base URL: ${BASE_URL}`)
console.log(`📝 Write 테스트: ${DO_WRITE ? '활성화' : '비활성화'}`)
console.log('─'.repeat(60))

class SmokeTest {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    this.accessToken = null
    this.results = []
  }

  async login() {
    console.log('🔐 관리자 로그인 시도...')
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    })

    if (error) {
      console.error('❌ 로그인 실패:', error.message)
      throw error
    }

    this.accessToken = data.session.access_token
    console.log('✅ 로그인 성공')
  }

  async apiCall(method, path, body = null, expectedStatus = 200) {
    const url = `${BASE_URL}${path}`
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'x-supabase-auth': this.accessToken,
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      cache: 'no-store'
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, options)
      const responseBody = await response.text()
      let data = null

      try {
        data = JSON.parse(responseBody)
      } catch {
        data = { text: responseBody }
      }

      const success = response.status === expectedStatus
      const result = {
        method,
        path,
        status: response.status,
        success,
        data: success ? data : null,
        error: success ? null : (data.error || data.message || responseBody)
      }

      this.results.push(result)

      const icon = success ? '✅' : '❌'
      const statusInfo = success ? response.status : `${response.status} (expected ${expectedStatus})`
      console.log(`${icon} ${method} ${path} → ${statusInfo}`)

      if (!success) {
        console.log(`   Error: ${result.error}`)
      }

      return result
    } catch (err) {
      const result = {
        method,
        path,
        status: 0,
        success: false,
        data: null,
        error: err.message
      }

      this.results.push(result)
      console.log(`❌ ${method} ${path} → Network Error`)
      console.log(`   Error: ${err.message}`)
      return result
    }
  }

  async testReadEndpoints() {
    console.log('\n📖 읽기 API 테스트')

    const readTests = [
      ['GET', '/api/admin/hero-slides'],
      ['GET', '/api/admin/sections'],
      ['GET', '/api/admin/accommodations'],
      ['GET', '/api/admin/reservations'],
      ['GET', '/api/admin/hosts'],
      ['GET', '/api/admin/admins'],
      ['GET', '/api/admin/notices'],
      ['GET', '/api/admin/inquiries']
    ]

    for (const [method, path] of readTests) {
      await this.apiCall(method, path)
    }
  }

  async testHeroSlidesContract() {
    if (!DO_WRITE) {
      console.log('\n⏭️  쓰기 테스트 생략 (DO_WRITE=true로 활성화)')
      return
    }

    console.log('\n📝 히어로 슬라이드 계약 테스트')

    // 1. POST with missing image_url (should fail)
    await this.apiCall('POST', '/api/admin/hero-slides', {
      headline: '테스트 제목',
      subheadline: '테스트 부제목'
    }, 400)

    // 2. POST with missing headline (should fail)
    await this.apiCall('POST', '/api/admin/hero-slides', {
      image_url: 'https://example.com/image.jpg',
      subheadline: '테스트 부제목'
    }, 400)

    // 3. POST with valid data (should succeed)
    const validSlide = {
      image_url: 'https://example.com/test-slide.jpg',
      headline: '스모크 테스트 슬라이드',
      subheadline: '자동 생성된 테스트 슬라이드입니다',
      cta_text: '예약하기',
      is_active: true,
      sort_order: 999
    }

    const createResult = await this.apiCall('POST', '/api/admin/hero-slides', validSlide, 200)

    if (createResult.success && createResult.data?.data?.id) {
      const createdId = createResult.data.data.id
      console.log(`   ✅ 생성된 슬라이드 ID: ${createdId}`)

      // 4. PUT with valid array (should succeed)
      await this.apiCall('PUT', '/api/admin/hero-slides', [{
        id: createdId,
        title: '수정된 제목',
        subtitle: '수정된 부제목',
        active: true,
        slide_order: 999
      }], 200)

      // 5. PUT with invalid non-array (should fail)
      await this.apiCall('PUT', '/api/admin/hero-slides', {
        id: createdId,
        title: '잘못된 형태'
      }, 400)

      // 6. Cleanup - delete test slide
      await this.apiCall('DELETE', `/api/admin/hero-slides/${createdId}`, null, 200)
      console.log(`   🧹 테스트 슬라이드 정리 완료`)
    }
  }

  async run() {
    try {
      await this.login()
      await this.testReadEndpoints()
      await this.testHeroSlidesContract()

      console.log('\n' + '─'.repeat(60))
      console.log('📊 테스트 결과 요약')

      const total = this.results.length
      const passed = this.results.filter(r => r.success).length
      const failed = this.results.filter(r => !r.success).length

      console.log(`총 테스트: ${total}`)
      console.log(`✅ 성공: ${passed}`)
      console.log(`❌ 실패: ${failed}`)

      if (failed > 0) {
        console.log('\n💥 실패한 테스트:')
        this.results.filter(r => !r.success).forEach(r => {
          console.log(`  ${r.method} ${r.path} → ${r.status} (${r.error})`)
        })
        process.exit(1)
      } else {
        console.log('\n🎉 모든 테스트 통과!')
      }

    } catch (error) {
      console.error('💥 테스트 실행 실패:', error.message)
      process.exit(1)
    } finally {
      await this.supabase.auth.signOut()
    }
  }
}

// 실행
const smokeTest = new SmokeTest()
smokeTest.run()