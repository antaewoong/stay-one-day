#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = 'https://fcmauibvdqbocwhloqov.supabase.co'
const supabaseKey = '[REMOVED_SUPABASE_SERVICE_KEY]'

const supabase = createClient(supabaseUrl, supabaseKey)

async function applySchema() {
  try {
    console.log('Applying database schema changes...')
    
    // Read the add-host-fields.sql file
    const schemaPath = path.join(__dirname, '..', 'lib', 'add-host-fields.sql')
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8')
    
    // Split the SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`Executing ${statements.length} SQL statements...`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.toLowerCase().includes('insert')) {
        // For INSERT statements, we'll use the Supabase client
        console.log(`Skipping INSERT statement ${i + 1} (use Supabase client instead)`)
        continue
      }
      
      console.log(`Executing statement ${i + 1}: ${statement.substring(0, 50)}...`)
      
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql: statement + ';'
      })
      
      if (error) {
        console.error(`Error in statement ${i + 1}:`, error.message)
        if (!error.message.includes('already exists')) {
          throw error
        } else {
          console.log('Column/constraint already exists, continuing...')
        }
      } else {
        console.log(`Statement ${i + 1} executed successfully`)
      }
    }
    
    // Now let's try to add the sample data using the client directly
    console.log('\nInserting sample accommodation data...')
    
    const accommodations = [
      {
        name: '구공스테이 청주 프라이빗 풀빌라',
        description: '청주에서 가장 인기 있는 프라이빗 풀빌라입니다. 독립적인 수영장과 바베큐 시설, 그리고 넓은 거실에서 편안한 시간을 보내실 수 있습니다. 애견 동반도 가능합니다.',
        location: '충북 청주시 청원구',
        type: '풀빌라',
        base_price: 180000,
        base_guests: 4,
        additional_guest_fee: 20000,
        max_guests: 10,
        check_in_time: '15:00',
        check_out_time: '11:00',
        amenities: ["수영장", "바베큐시설", "주차장", "에어컨", "와이파이", "애견동반가능", "세탁기", "건조기", "냉장고", "전자레인지"],
        options: [{"name": "숯불 바베큐 세트", "price": 30000}, {"name": "튜브 대여", "price": 10000}, {"name": "애견용품 세트", "price": 15000}],
        images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800", "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800", "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800"],
        rating: 4.9,
        review_count: 147,
        is_active: true,
        host_id: 'host-1',
        host_name: '김호스트',
        host_business_name: '구공스테이',
        approval_status: 'approved'
      },
      {
        name: '구공스테이 세종 힐링 독채 펜션',
        description: '자연 속에서 힐링할 수 있는 독채형 펜션입니다. 조용한 환경과 깨끗한 시설로 가족단위나 커플들에게 인기가 높습니다.',
        location: '세종특별자치시 연기면',
        type: '독채',
        base_price: 120000,
        base_guests: 2,
        additional_guest_fee: 15000,
        max_guests: 8,
        check_in_time: '15:00',
        check_out_time: '11:00',
        amenities: ["주차장", "에어컨", "와이파이", "취사시설", "냉장고", "전자레인지", "세탁기", "바베큐시설"],
        options: [{"name": "바베큐 세트", "price": 25000}, {"name": "캠프파이어", "price": 20000}],
        images: ["https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800", "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800", "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800"],
        rating: 4.7,
        review_count: 89,
        is_active: true,
        host_id: 'host-1',
        host_name: '김호스트',
        host_business_name: '구공스테이',
        approval_status: 'approved'
      }
    ]
    
    const { data: insertData, error: insertError } = await supabase
      .from('accommodations')
      .upsert(accommodations, { onConflict: 'name' })
    
    if (insertError) {
      console.error('Error inserting sample data:', insertError.message)
    } else {
      console.log('Sample data inserted successfully!')
    }
    
    console.log('\n✅ Database schema and sample data applied successfully!')
    
  } catch (error) {
    console.error('❌ Error applying schema:', error.message)
    process.exit(1)
  }
}

applySchema()