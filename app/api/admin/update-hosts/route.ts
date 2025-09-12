import { NextRequest } from 'next/server'
import { adminRoute, sb, ok, bad } from '../_kit'

export const POST = adminRoute(async (req: NextRequest) => {
  try {
    // 구공 계정
    await sb()
      .from('hosts')
      .update({ host_id: 'gugong90stay', password_hash: '90stay2024!!' })
      .eq('email', 'test@90stay.com')
      .is('host_id', null)

    // 스테이폴리오 계정
    await sb()
      .from('hosts')
      .update({ host_id: 'stayfolio', password_hash: 'stayfolio123!' })
      .eq('email', 'test@stay.com')
      .is('host_id', null)

    // 스토리나인 계정
    await sb()
      .from('hosts')
      .update({ host_id: 'storynine', password_hash: 'story9pass!' })
      .eq('email', 'storynine@stayonday.com')
      .is('host_id', null)

    // 박경순 계정 (스테이청주)
    await sb()
      .from('hosts')
      .update({ password_hash: 'cheongju123!' })
      .eq('host_id', 'host-c41c15d1')
      .is('password_hash', null)

    // 끄레아풀빌라 계정을 활성화
    await sb()
      .from('hosts')
      .update({ status: 'active' })
      .eq('host_id', 'crear')
      .eq('status', 'pending')

    return ok({ message: '호스트 계정 정보가 업데이트되었습니다.' })
  } catch (error) {
    console.error('Host update error:', error)
    return bad('업데이트 실패', 500)
  }
})