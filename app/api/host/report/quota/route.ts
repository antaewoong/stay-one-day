import { NextRequest, NextResponse } from 'next/server'
import { withHostAuth } from '@/middleware/withHostAuth'
import { getQuotaStatus } from '@/utils/quota-manager'

export const GET = withHostAuth(async (req, db, { userId, host }) => {
  try {
    const quotaStatus = getQuotaStatus(userId)

    const response = {
      quota: {
        used: quotaStatus.total_runs,
        remaining: 2 - quotaStatus.total_runs,
        manual_runs: quotaStatus.manual_runs,
        admin_proxy_runs: quotaStatus.admin_proxy_runs
      },
      can_generate: quotaStatus.total_runs < 2,
      next_reset: quotaStatus.next_available,
      host_info: {
        id: host.id,
        business_name: host.business_name,
        representative_name: host.representative_name
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('쿼터 상태 조회 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
})