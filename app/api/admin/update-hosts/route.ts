import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST() {
  try {
    // 구공 계정
    await supabase
      .from('hosts')
      .update({ host_id: 'gugong90stay', password_hash: '90stay2024!!' })
      .eq('email', 'test@90stay.com')
      .is('host_id', null)

    // 스테이폴리오 계정
    await supabase
      .from('hosts')
      .update({ host_id: 'stayfolio', password_hash: 'stayfolio123!' })
      .eq('email', 'test@stay.com')
      .is('host_id', null)

    // 스토리나인 계정
    await supabase
      .from('hosts')
      .update({ host_id: 'storynine', password_hash: 'story9pass!' })
      .eq('email', 'storynine@stayonday.com')
      .is('host_id', null)

    // 박경순 계정 (스테이청주)
    await supabase
      .from('hosts')
      .update({ password_hash: 'cheongju123!' })
      .eq('host_id', 'host-c41c15d1')
      .is('password_hash', null)

    // 끄레아풀빌라 계정을 활성화
    await supabase
      .from('hosts')
      .update({ status: 'active' })
      .eq('host_id', 'crear')
      .eq('status', 'pending')

    return NextResponse.json({ success: true, message: '호스트 계정 정보가 업데이트되었습니다.' })
  } catch (error) {
    console.error('Host update error:', error)
    return NextResponse.json({ success: false, error: '업데이트 실패' }, { status: 500 })
  }
}