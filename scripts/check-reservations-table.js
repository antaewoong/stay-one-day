#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fcmauibvdqbocwhloqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjbWF1aWJ2ZHFib2N3aGxvcW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjgwODY3OCwiZXhwIjoyMDcyMzg0Njc4fQ.vwEr3cyiQSWBabAgoodWUzBSewrVTco3kFg_w-ae1D0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkReservationsTable() {
  try {
    console.log('📋 Checking reservations table structure...\n')
    
    // reservations 테이블 확인
    const { data: reservationsData, error: reservationsError } = await supabase
      .from('reservations')
      .select('*')
      .limit(1)
    
    if (reservationsError && reservationsError.code === 'PGRST116') {
      console.log('❌ reservations table does not exist')
      return
    }
    
    if (reservationsError) {
      console.log('⚠️ reservations table error:', reservationsError.message)
    } else {
      console.log('✅ reservations table exists')
      
      // 샘플 데이터 조회
      const { data: sampleReservations, error: sampleError } = await supabase
        .from('reservations')
        .select('*')
        .limit(3)
      
      if (sampleError) {
        console.log('❌ Failed to fetch sample reservations:', sampleError.message)
      } else {
        console.log(`📊 Sample reservations (${sampleReservations.length} records):`)
        sampleReservations.forEach((reservation, index) => {
          console.log(`   ${index + 1}. ID: ${reservation.id}`)
          Object.keys(reservation).forEach(key => {
            console.log(`      ${key}: ${reservation[key]}`)
          })
          console.log('      ---')
        })
      }
    }
    
    // accommodations 테이블도 확인
    console.log('\n📋 Checking accommodations table...')
    const { data: accommodationsData, error: accommodationsError } = await supabase
      .from('accommodations')
      .select('*')
      .limit(1)
    
    if (accommodationsError && accommodationsError.code === 'PGRST116') {
      console.log('❌ accommodations table does not exist')
    } else if (accommodationsError) {
      console.log('⚠️ accommodations table error:', accommodationsError.message)
    } else {
      console.log('✅ accommodations table exists')
      
      // accommodations 샘플 데이터
      const { data: sampleAccommodations } = await supabase
        .from('accommodations')
        .select('id, name, region, accommodation_type')
        .limit(3)
      
      if (sampleAccommodations) {
        console.log(`📊 Sample accommodations (${sampleAccommodations.length} records):`)
        sampleAccommodations.forEach((accommodation, index) => {
          console.log(`   ${index + 1}. ${accommodation.name} (${accommodation.region}, ${accommodation.accommodation_type})`)
        })
      }
    }
    
    console.log('\n✅ Table structure check completed!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkReservationsTable()