#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fcmauibvdqbocwhloqov.supabase.co'
const supabaseKey = '[REMOVED_SUPABASE_SERVICE_KEY]'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createAdminSettings() {
  try {
    console.log('⚙️ Creating admin_settings table and populating with default values...\n')
    
    // admin_settings 테이블 생성 SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS admin_settings (
        id SERIAL PRIMARY KEY,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        setting_type TEXT NOT NULL DEFAULT 'string',
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- RLS 정책 설정
      ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
      
      -- admin 역할만 접근 가능하도록 정책 생성
      CREATE POLICY admin_settings_policy ON admin_settings
        FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
    `
    
    // 테이블 생성
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    })
    
    if (createError) {
      console.log('⚠️ Table creation error (may already exist):', createError.message)
    } else {
      console.log('✅ admin_settings table created successfully')
    }
    
    // 기본 설정 값들
    const defaultSettings = [
      {
        setting_key: 'platform_name',
        setting_value: 'Stay OneDay',
        setting_type: 'string',
        description: '플랫폼 이름'
      },
      {
        setting_key: 'commission_rate',
        setting_value: '0.10',
        setting_type: 'number',
        description: '수수료율 (10%)'
      },
      {
        setting_key: 'maintenance_mode',
        setting_value: 'false',
        setting_type: 'boolean',
        description: '유지보수 모드'
      },
      {
        setting_key: 'support_email',
        setting_value: 'support@stay-oneday.com',
        setting_type: 'string',
        description: '고객 지원 이메일'
      },
      {
        setting_key: 'max_booking_days',
        setting_value: '30',
        setting_type: 'number',
        description: '최대 예약 가능 일수'
      },
      {
        setting_key: 'auto_approval',
        setting_value: 'true',
        setting_type: 'boolean',
        description: '숙소 등록 자동 승인 여부'
      }
    ]
    
    console.log(`Inserting ${defaultSettings.length} default settings...`)
    
    for (const setting of defaultSettings) {
      const { error } = await supabase
        .from('admin_settings')
        .upsert([setting], { onConflict: 'setting_key' })
      
      if (error) {
        console.log(`   ❌ ${setting.setting_key}: ${error.message}`)
      } else {
        console.log(`   ✅ ${setting.setting_key}: ${setting.setting_value}`)
      }
    }
    
    console.log('\n📊 Checking admin_settings data...')
    
    const { data: settings, error: selectError } = await supabase
      .from('admin_settings')
      .select('*')
      .order('setting_key')
    
    if (selectError) {
      console.log('❌ Failed to fetch settings:', selectError.message)
    } else {
      console.log(`   Total settings: ${settings.length}`)
      settings.forEach(setting => {
        console.log(`   ${setting.setting_key}: ${setting.setting_value} (${setting.setting_type})`)
      })
    }
    
    console.log('\n✅ Admin settings setup completed successfully!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

createAdminSettings()