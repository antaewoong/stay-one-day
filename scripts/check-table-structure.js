#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fcmauibvdqbocwhloqov.supabase.co'
const supabaseKey = '[REMOVED_SUPABASE_SERVICE_KEY]'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTableStructure() {
  try {
    console.log('🔍 Checking notices table structure...\n')
    
    // notices 테이블 구조 확인을 위해 INSERT 시도
    try {
      const testNotice = {
        title: 'Test Notice',
        content: 'This is a test notice',
        author_name: 'System',
        author_role: 'admin',
        views: 0,
        is_important: false,
        is_published: true,
        target_audience: 'all'
      }
      
      const { data, error } = await supabase
        .from('notices')
        .insert([testNotice])
        .select()
      
      if (error) {
        console.log('❌ Insert error:', error.message)
        console.log('Error details:', error)
      } else {
        console.log('✅ Test insert successful!')
        console.log('Inserted data:', data)
        
        // 테스트 데이터 삭제
        await supabase
          .from('notices')
          .delete()
          .eq('title', 'Test Notice')
        
        console.log('🧹 Test data cleaned up')
      }
    } catch (insertError) {
      console.log('❌ Insert failed:', insertError.message)
    }
    
    // admin_settings 테이블 구조 확인
    console.log('\n🔍 Checking admin_settings table structure...\n')
    
    try {
      const testSetting = {
        setting_key: 'test_setting',
        setting_value: { test: true },
        description: 'Test setting'
      }
      
      const { data, error } = await supabase
        .from('admin_settings')
        .insert([testSetting])
        .select()
      
      if (error) {
        console.log('❌ Insert error:', error.message)
      } else {
        console.log('✅ admin_settings insert successful!')
        console.log('Inserted data:', data)
        
        // 테스트 데이터 삭제
        await supabase
          .from('admin_settings')
          .delete()
          .eq('setting_key', 'test_setting')
        
        console.log('🧹 Test data cleaned up')
      }
    } catch (insertError) {
      console.log('❌ admin_settings insert failed:', insertError.message)
    }
    
    console.log('\n✅ Table structure check completed!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkTableStructure()