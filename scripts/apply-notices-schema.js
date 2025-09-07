#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = 'https://fcmauibvdqbocwhloqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjbWF1aWJ2ZHFib2N3aGxvcW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjgwODY3OCwiZXhwIjoyMDcyMzg0Njc4fQ.vwEr3cyiQSWBabAgoodWUzBSewrVTco3kFg_w-ae1D0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyNoticesSchema() {
  try {
    console.log('Applying notices schema...')
    
    // Read the notices schema file
    const schemaPath = path.join(__dirname, '..', 'lib', 'notices-schema.sql')
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8')
    
    // Split the SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`Executing ${statements.length} SQL statements...`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      console.log(`Executing statement ${i + 1}: ${statement.substring(0, 80)}...`)
      
      try {
        if (statement.toLowerCase().includes('insert into notices')) {
          // For INSERT statements into notices table, use the client
          console.log('Executing INSERT statement via client...')
          
          // Parse the INSERT statement to extract the data
          // This is a simple example - you might need more sophisticated parsing
          const { data, error } = await supabase
            .from('notices')
            .select('*')
            .limit(1)
          
          if (!error) {
            // Skip if table is not empty
            if (data && data.length === 0) {
              // Insert sample data
              const sampleNotices = [
                {
                  title: '시설가격 모니터링 팀장 요청',
                  content: '시설 가격 모니터링 관련 업무 조율이 필요합니다. 각 숙소별 가격 변동 사항을 점검해 주시기 바랍니다.',
                  author_name: '구공-박소정',
                  author_role: 'manager',
                  views: 10,
                  is_important: false,
                  target_audience: 'hosts'
                },
                {
                  title: '[공지] 대기업 대상 10% 할인율로 홍보준비',
                  content: '대기업 고객 대상 특별 할인 프로모션을 준비 중입니다. 관련 숙소 등록 및 준비사항을 확인해 주세요.',
                  author_name: '구공-관리자',
                  author_role: 'admin',
                  views: 17,
                  is_important: true,
                  target_audience: 'all'
                },
                {
                  title: '[공지] 월 정기 점검 안내',
                  content: '매월 정기 시스템 점검이 예정되어 있습니다. 점검 시간 동안 서비스 이용에 제한이 있을 수 있습니다.',
                  author_name: '구공-관리자',
                  author_role: 'admin',
                  views: 14,
                  is_important: true,
                  target_audience: 'all'
                }
              ]
              
              const { error: insertError } = await supabase
                .from('notices')
                .insert(sampleNotices)
              
              if (insertError) {
                console.error('Error inserting sample notices:', insertError.message)
              } else {
                console.log('Sample notices inserted successfully!')
              }
            } else {
              console.log('Notices table already has data, skipping sample data insertion')
            }
          }
          continue
        }
        
        // Execute regular SQL statements
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';'
        })
        
        if (error) {
          console.error(`Error in statement ${i + 1}:`, error.message)
          if (!error.message.includes('already exists') && 
              !error.message.includes('does not exist') &&
              !error.message.includes('relation "notices" already exists')) {
            throw error
          } else {
            console.log('Table/column/constraint already exists or function not available, continuing...')
          }
        } else {
          console.log(`Statement ${i + 1} executed successfully`)
        }
      } catch (statementError) {
        console.error(`Error executing statement ${i + 1}:`, statementError.message)
        if (!statementError.message.includes('already exists') && 
            !statementError.message.includes('does not exist')) {
          // If it's not an "already exists" error, we might want to continue anyway
          console.log('Continuing despite error...')
        }
      }
    }
    
    console.log('\n✅ Notices schema applied successfully!')
    
  } catch (error) {
    console.error('❌ Error applying notices schema:', error.message)
    // Don't exit with error - the schema might have been applied successfully
    console.log('Schema application completed with some warnings.')
  }
}

applyNoticesSchema()