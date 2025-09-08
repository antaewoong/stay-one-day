#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fcmauibvdqbocwhloqov.supabase.co'
const supabaseKey = '[REMOVED_SUPABASE_SERVICE_KEY]'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConstraints() {
  try {
    console.log('🔍 Testing notices table constraints...\n')
    
    // target_audience 값들 테스트
    const targetAudienceValues = ['all', 'admin', 'host', 'user', 'hosts', 'admins', 'users', 'guest', 'everyone']
    
    for (const targetValue of targetAudienceValues) {
      try {
        const testNotice = {
          title: `Test ${targetValue}`,
          content: 'Test content',
          target_audience: targetValue,
          status: 'draft'
        }
        
        const { data, error } = await supabase
          .from('notices')
          .insert([testNotice])
          .select()
        
        if (error) {
          console.log(`   ❌ target_audience: '${targetValue}' - ${error.message}`)
        } else {
          console.log(`   ✅ target_audience: '${targetValue}' - SUCCESS`)
          // 테스트 데이터 삭제
          await supabase.from('notices').delete().eq('id', data[0].id)
        }
      } catch (e) {
        console.log(`   ❌ target_audience: '${targetValue}' - ${e.message}`)
      }
    }
    
    console.log('\n🔍 Testing notice_type values...\n')
    
    const noticeTypeValues = ['general', 'announcement', 'maintenance', 'update', 'guideline', 'notice', 'system', 'urgent', 'info']
    
    for (const typeValue of noticeTypeValues) {
      try {
        const testNotice = {
          title: `Test ${typeValue}`,
          content: 'Test content',
          notice_type: typeValue,
          target_audience: 'all', // 일단 기본값 사용
          status: 'draft'
        }
        
        const { data, error } = await supabase
          .from('notices')
          .insert([testNotice])
          .select()
        
        if (error) {
          console.log(`   ❌ notice_type: '${typeValue}' - ${error.message}`)
        } else {
          console.log(`   ✅ notice_type: '${typeValue}' - SUCCESS`)
          // 테스트 데이터 삭제
          await supabase.from('notices').delete().eq('id', data[0].id)
        }
      } catch (e) {
        console.log(`   ❌ notice_type: '${typeValue}' - ${e.message}`)
      }
    }
    
    console.log('\n✅ Constraint testing completed!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testConstraints()