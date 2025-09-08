#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fcmauibvdqbocwhloqov.supabase.co'
const supabaseKey = '[REMOVED_SUPABASE_SERVICE_KEY]'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseTables() {
  try {
    console.log('🔍 Checking Supabase database tables...\n')
    
    // 주요 테이블들 확인
    const tablesToCheck = [
      'accommodations',
      'reservations', 
      'wishlists',
      'reviews',
      'admin_settings',
      'notices',
      'inquiries',
      'hosts',
      'users'
    ]

    for (const tableName of tablesToCheck) {
      console.log(`📋 Checking table: ${tableName}`)
      
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          if (error.code === 'PGRST116') {
            console.log(`   ❌ Table '${tableName}' does NOT exist`)
          } else {
            console.log(`   ⚠️  Table '${tableName}' error: ${error.message}`)
          }
        } else {
          console.log(`   ✅ Table '${tableName}' exists with ${count || 0} rows`)
        }
      } catch (tableError) {
        console.log(`   ❌ Table '${tableName}' error: ${tableError.message}`)
      }
      
      // 테이블 구조도 확인
      if (tableName === 'accommodations' || tableName === 'admin_settings') {
        try {
          const { data: sample } = await supabase
            .from(tableName)
            .select('*')
            .limit(1)
          
          if (sample && sample.length > 0) {
            console.log(`   📊 Sample columns: ${Object.keys(sample[0]).join(', ')}`)
          }
        } catch (e) {
          // ignore
        }
      }
      
      console.log('')
    }
    
    // admin_settings 내용 확인
    console.log('🎛️ Checking admin_settings content...')
    try {
      const { data: settings } = await supabase
        .from('admin_settings')
        .select('*')
      
      if (settings) {
        settings.forEach(setting => {
          console.log(`   📝 ${setting.setting_key}: ${setting.description || 'No description'}`)
        })
      }
    } catch (e) {
      console.log('   ❌ Cannot read admin_settings')
    }
    
    console.log('\n✅ Database check completed!')
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message)
  }
}

checkDatabaseTables()