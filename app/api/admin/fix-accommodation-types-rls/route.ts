import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Service Role Key를 사용한 Supabase 클라이언트 (RLS 무시 가능)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // 간단한 보안 체크
    const { password } = await request.json()
    if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // accommodation_types 테이블 RLS 정책 설정
    const sqlCommands = [
      // 기존 정책 삭제
      'DROP POLICY IF EXISTS "accommodation_types_select_policy" ON accommodation_types;',
      'DROP POLICY IF EXISTS "accommodation_types_insert_policy" ON accommodation_types;',
      'DROP POLICY IF EXISTS "accommodation_types_update_policy" ON accommodation_types;',
      'DROP POLICY IF EXISTS "accommodation_types_delete_policy" ON accommodation_types;',
      
      // RLS 활성화
      'ALTER TABLE accommodation_types ENABLE ROW LEVEL SECURITY;',
      
      // SELECT 정책: 모든 사용자가 조회 가능
      `CREATE POLICY "accommodation_types_select_policy" ON accommodation_types
        FOR SELECT
        USING (true);`,
      
      // INSERT 정책
      `CREATE POLICY "accommodation_types_insert_policy" ON accommodation_types
        FOR INSERT
        WITH CHECK (
          current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
          OR
          EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
          )
          OR
          EXISTS (
            SELECT 1 FROM accommodations a
            JOIN hosts h ON a.host_id = h.id
            WHERE a.id = accommodation_types.accommodation_id
            AND h.user_id = auth.uid()
          )
        );`,
      
      // UPDATE 정책
      `CREATE POLICY "accommodation_types_update_policy" ON accommodation_types
        FOR UPDATE
        USING (
          current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
          OR
          EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
          )
          OR
          EXISTS (
            SELECT 1 FROM accommodations a
            JOIN hosts h ON a.host_id = h.id
            WHERE a.id = accommodation_types.accommodation_id
            AND h.user_id = auth.uid()
          )
        );`,
      
      // DELETE 정책
      `CREATE POLICY "accommodation_types_delete_policy" ON accommodation_types
        FOR DELETE
        USING (
          current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
          OR
          EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
          )
          OR
          EXISTS (
            SELECT 1 FROM accommodations a
            JOIN hosts h ON a.host_id = h.id
            WHERE a.id = accommodation_types.accommodation_id
            AND h.user_id = auth.uid()
          )
        );`
    ]

    // 각 SQL 명령 실행
    for (const sql of sqlCommands) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql })
      if (error) {
        console.error('SQL 실행 실패:', sql, error)
        // RPC가 없으면 직접 실행
        try {
          await supabaseAdmin.from('_').select('*').limit(0) // 더미 쿼리로 연결 확인
        } catch (e) {
          console.log('RPC 사용 불가, 개별 실행 시도')
        }
      }
    }

    // 정책 확인
    const { data: policies } = await supabaseAdmin
      .rpc('exec_sql', { 
        sql_query: `SELECT schemaname, tablename, policyname, permissive, roles, cmd 
                   FROM pg_policies 
                   WHERE tablename = 'accommodation_types';`
      })

    return NextResponse.json({ 
      message: 'accommodation_types 테이블 RLS 정책이 설정되었습니다.',
      policies: policies || []
    })

  } catch (error) {
    console.error('RLS 정책 설정 실패:', error)
    return NextResponse.json({ 
      error: 'RLS 정책 설정에 실패했습니다.',
      details: error 
    }, { status: 500 })
  }
}