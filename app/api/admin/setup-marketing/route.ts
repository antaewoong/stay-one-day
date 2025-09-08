import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST() {
  try {
    const marketingTablesSQL = `
      -- 웹 세션 추적 테이블
      CREATE TABLE IF NOT EXISTS web_sessions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          session_id TEXT NOT NULL UNIQUE,
          user_id UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          -- 유입 정보
          utm_source TEXT,
          utm_medium TEXT,
          utm_campaign TEXT,
          utm_term TEXT,
          utm_content TEXT,
          referrer TEXT,
          landing_page TEXT,
          
          -- 세션 정보
          ip_address INET,
          user_agent TEXT,
          device_type TEXT,
          browser TEXT,
          os TEXT,
          country TEXT,
          city TEXT,
          
          -- 행동 데이터
          page_views INTEGER DEFAULT 1,
          duration_seconds INTEGER DEFAULT 0,
          bounced BOOLEAN DEFAULT false,
          converted BOOLEAN DEFAULT false,
          conversion_value DECIMAL(10,2),
          
          -- GA4 연동
          ga_client_id TEXT,
          ga_session_id TEXT,
          
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 이벤트 추적 테이블
      CREATE TABLE IF NOT EXISTS marketing_events (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          session_id TEXT NOT NULL,
          user_id UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          -- 이벤트 정보
          event_name TEXT NOT NULL,
          event_category TEXT,
          event_action TEXT,
          event_label TEXT,
          event_value DECIMAL(10,2),
          
          -- 페이지 정보
          page_url TEXT,
          page_title TEXT,
          
          -- 추가 데이터
          custom_parameters JSONB
      );

      -- 예약 전환 추적 테이블
      CREATE TABLE IF NOT EXISTS booking_conversions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          reservation_id UUID NOT NULL,
          session_id TEXT,
          user_id UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          -- 유입 정보
          utm_source TEXT,
          utm_medium TEXT,
          utm_campaign TEXT,
          utm_term TEXT,
          utm_content TEXT,
          referrer TEXT,
          
          -- 예약 정보
          accommodation_id UUID REFERENCES accommodations(id),
          booking_amount DECIMAL(10,2),
          guest_email TEXT,
          guest_phone TEXT,
          guest_name TEXT,
          
          -- 여정 추적
          first_visit_at TIMESTAMP WITH TIME ZONE,
          booking_at TIMESTAMP WITH TIME ZONE,
          journey_duration_minutes INTEGER,
          touchpoints_count INTEGER,
          
          -- GA4 연동
          ga_transaction_id TEXT,
          ga_client_id TEXT
      );

      -- 캠페인 성과 추적 테이블
      CREATE TABLE IF NOT EXISTS campaign_performance (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          date DATE NOT NULL,
          
          -- 캠페인 정보
          utm_source TEXT NOT NULL,
          utm_medium TEXT NOT NULL,
          utm_campaign TEXT,
          
          -- 성과 지표
          sessions INTEGER DEFAULT 0,
          users INTEGER DEFAULT 0,
          page_views INTEGER DEFAULT 0,
          bounce_rate DECIMAL(5,2),
          avg_session_duration INTEGER,
          
          -- 전환 지표
          conversions INTEGER DEFAULT 0,
          conversion_rate DECIMAL(5,2),
          revenue DECIMAL(10,2) DEFAULT 0,
          cost_per_acquisition DECIMAL(10,2),
          return_on_ad_spend DECIMAL(5,2),
          
          -- 광고비
          ad_spend DECIMAL(10,2) DEFAULT 0,
          
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          UNIQUE(date, utm_source, utm_medium, utm_campaign)
      );

      -- 인덱스 생성
      CREATE INDEX IF NOT EXISTS idx_web_sessions_created_at ON web_sessions(created_at);
      CREATE INDEX IF NOT EXISTS idx_web_sessions_utm_source ON web_sessions(utm_source);
      CREATE INDEX IF NOT EXISTS idx_web_sessions_session_id ON web_sessions(session_id);
      CREATE INDEX IF NOT EXISTS idx_marketing_events_session_id ON marketing_events(session_id);
      CREATE INDEX IF NOT EXISTS idx_marketing_events_event_name ON marketing_events(event_name);
      CREATE INDEX IF NOT EXISTS idx_booking_conversions_created_at ON booking_conversions(created_at);
      CREATE INDEX IF NOT EXISTS idx_campaign_performance_date ON campaign_performance(date);
    `

    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql: marketingTablesSQL
    })

    if (error) {
      // rpc가 없으면 직접 쿼리 실행 시도
      const { error: directError } = await supabaseAdmin.from('information_schema.tables').select('*').limit(1)
      
      if (directError) {
        throw new Error(`Database access failed: ${directError.message}`)
      }
      
      // 테이블별로 개별 생성
      const tables = [
        'web_sessions',
        'marketing_events', 
        'booking_conversions',
        'campaign_performance'
      ]
      
      const results = []
      
      for (const table of tables) {
        try {
          const { error: tableError } = await supabaseAdmin
            .from(table)
            .select('*')
            .limit(1)
          
          if (tableError && tableError.code === '42P01') {
            results.push(`Table ${table} needs to be created manually`)
          } else {
            results.push(`Table ${table} exists`)
          }
        } catch (e) {
          results.push(`Table ${table} check failed`)
        }
      }
      
      return NextResponse.json({ 
        message: 'Marketing tables setup initiated (manual creation needed)',
        results,
        sql: marketingTablesSQL
      })
    }

    return NextResponse.json({ 
      message: 'Marketing tables created successfully!' 
    })

  } catch (error: any) {
    console.error('Marketing setup error:', error)
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    )
  }
}