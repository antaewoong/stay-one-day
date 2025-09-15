/**
 * 스토리지 정리 API
 * P1-3: 스토리지 링크 정책 완성의 일부
 * 만료된 파일 자동 정리
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, addRateLimitHeaders } from '@/lib/rate-limiter'

interface CleanupRequest {
  bucket: string
  maxAge?: number // days
  dryRun?: boolean
}

// 버킷별 기본 정리 정책
const CLEANUP_POLICIES: Record<string, { maxAge: number, pattern?: string }> = {
  'video-assets': {
    maxAge: 7, // 7일 후 정리
    pattern: 'jobs/' // jobs 폴더만
  },
  'video-renders': {
    maxAge: 30, // 30일 후 정리
    pattern: 'renders/' // renders 폴더만
  }
}

export async function POST(request: NextRequest) {
  let rateLimitResult: any = null

  try {
    // Rate limiting 검사 (관리 작업이므로 엄격하게)
    rateLimitResult = await checkRateLimit(
      request,
      '/api/storage/cleanup'
    )

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          success: false,
          error: '요청 한도를 초과했습니다',
          code: 'RATE_LIMIT_EXCEEDED',
          details: `${rateLimitResult.retryAfter}초 후에 다시 시도해주세요`
        },
        { status: 429 }
      )
      return addRateLimitHeaders(response, rateLimitResult)
    }

    const body: CleanupRequest = await request.json()
    const { bucket, maxAge, dryRun = false } = body

    if (!bucket || !CLEANUP_POLICIES[bucket]) {
      return NextResponse.json(
        {
          success: false,
          error: '지원되지 않는 버킷입니다',
          code: 'INVALID_BUCKET'
        },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: '인증이 필요합니다',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    }

    // 관리자 권한 확인
    const { data: adminData } = await supabase
      .from('admin_accounts')
      .select('is_active')
      .eq('auth_user_id', user.id)
      .single()

    if (!adminData?.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: '관리자 권한이 필요합니다',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    console.log(`[STORAGE_CLEANUP] 시작: ${bucket} (${dryRun ? 'DRY RUN' : 'EXECUTE'})`)

    const policy = CLEANUP_POLICIES[bucket]
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - (maxAge || policy.maxAge))

    // 정리 대상 파일 조회
    const { data: objects, error: listError } = await supabase.storage
      .from(bucket)
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'asc' }
      })

    if (listError) {
      console.error(`[STORAGE_CLEANUP] 파일 목록 조회 실패:`, listError)
      return NextResponse.json(
        {
          success: false,
          error: '파일 목록을 조회할 수 없습니다'
        },
        { status: 500 }
      )
    }

    // 만료된 파일 필터링
    const expiredFiles = objects.filter(obj => {
      if (!obj.created_at) return false

      const fileDate = new Date(obj.created_at)
      const isExpired = fileDate < cutoffDate

      // 패턴 매칭 (지정된 폴더만)
      const matchesPattern = policy.pattern ? obj.name.startsWith(policy.pattern) : true

      return isExpired && matchesPattern
    })

    console.log(`[STORAGE_CLEANUP] 발견된 만료 파일: ${expiredFiles.length}개`)

    if (expiredFiles.length === 0) {
      const response = NextResponse.json({
        success: true,
        message: '정리할 파일이 없습니다',
        deleted: 0,
        bucket,
        cutoffDate: cutoffDate.toISOString()
      })
      return addRateLimitHeaders(response, rateLimitResult)
    }

    let deletedCount = 0
    let errors: string[] = []

    if (!dryRun) {
      // 배치 삭제 (최대 100개씩)
      const batchSize = 100
      for (let i = 0; i < expiredFiles.length; i += batchSize) {
        const batch = expiredFiles.slice(i, i + batchSize)
        const filePaths = batch.map(f => f.name)

        const { error: deleteError } = await supabase.storage
          .from(bucket)
          .remove(filePaths)

        if (deleteError) {
          console.error(`[STORAGE_CLEANUP] 배치 삭제 실패:`, deleteError)
          errors.push(`배치 ${Math.floor(i / batchSize) + 1}: ${deleteError.message}`)
        } else {
          deletedCount += batch.length
          console.log(`[STORAGE_CLEANUP] 배치 삭제 성공: ${batch.length}개 파일`)
        }
      }
    } else {
      // Dry run - 실제로 삭제하지 않음
      deletedCount = expiredFiles.length
    }

    const response = NextResponse.json({
      success: true,
      message: dryRun
        ? `${deletedCount}개 파일이 정리 대상입니다 (실행하지 않음)`
        : `${deletedCount}개 파일을 정리했습니다`,
      deleted: deletedCount,
      errors: errors.length > 0 ? errors : undefined,
      bucket,
      cutoffDate: cutoffDate.toISOString(),
      dryRun,
      files: dryRun ? expiredFiles.map(f => ({
        name: f.name,
        size: f.metadata?.size,
        created_at: f.created_at
      })) : undefined
    })

    return addRateLimitHeaders(response, rateLimitResult)

  } catch (error) {
    console.error('[STORAGE_CLEANUP] 오류:', error)

    const response = NextResponse.json(
      {
        success: false,
        error: '스토리지 정리 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )

    return rateLimitResult ? addRateLimitHeaders(response, rateLimitResult) : response
  }
}

// GET 메서드로 정리 상태 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get('bucket')

    if (!bucket || !CLEANUP_POLICIES[bucket]) {
      return NextResponse.json(
        {
          success: false,
          error: '지원되지 않는 버킷입니다'
        },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 파일 통계 조회
    const { data: objects, error } = await supabase.storage
      .from(bucket)
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: '파일 정보를 조회할 수 없습니다'
        },
        { status: 500 }
      )
    }

    const policy = CLEANUP_POLICIES[bucket]
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - policy.maxAge)

    const stats = {
      total: objects.length,
      expired: objects.filter(obj => {
        if (!obj.created_at) return false
        const fileDate = new Date(obj.created_at)
        const matchesPattern = policy.pattern ? obj.name.startsWith(policy.pattern) : true
        return fileDate < cutoffDate && matchesPattern
      }).length,
      totalSize: objects.reduce((sum, obj) => sum + (obj.metadata?.size || 0), 0),
      oldestFile: objects.length > 0 ? objects[objects.length - 1].created_at : null,
      newestFile: objects.length > 0 ? objects[0].created_at : null
    }

    return NextResponse.json({
      success: true,
      bucket,
      policy,
      cutoffDate: cutoffDate.toISOString(),
      stats
    })

  } catch (error) {
    console.error('[STORAGE_CLEANUP] 상태 조회 오류:', error)

    return NextResponse.json(
      {
        success: false,
        error: '상태 조회 중 오류가 발생했습니다'
      },
      { status: 500 }
    )
  }
}