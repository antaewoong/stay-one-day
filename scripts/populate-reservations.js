#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fcmauibvdqbocwhloqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjbWF1aWJ2ZHFib2N3aGxvcW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjgwODY3OCwiZXhwIjoyMDcyMzg0Njc4fQ.vwEr3cyiQSWBabAgoodWUzBSewrVTco3kFg_w-ae1D0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function populateReservations() {
  try {
    console.log('📝 Populating reservations table with sample data...\n')
    
    // accommodations 데이터 가져오기
    const { data: accommodations, error: accommodationsError } = await supabase
      .from('accommodations')
      .select('id, name')
      .limit(3)
    
    if (accommodationsError) {
      console.error('❌ Failed to fetch accommodations:', accommodationsError.message)
      return
    }
    
    if (!accommodations || accommodations.length === 0) {
      console.error('❌ No accommodations found to create reservations')
      return
    }
    
    console.log(`Found ${accommodations.length} accommodations:`)
    accommodations.forEach((acc, index) => {
      console.log(`   ${index + 1}. ${acc.name} (ID: ${acc.id})`)
    })
    
    // 샘플 예약 데이터 생성
    const getRandomDate = (daysFromNow) => {
      const date = new Date()
      date.setDate(date.getDate() + daysFromNow)
      return date.toISOString().split('T')[0]
    }
    
    const reservations = [
      {
        accommodation_id: accommodations[0].id,
        reservation_number: 'RES' + Date.now().toString().slice(-6) + '01',
        checkin_date: getRandomDate(1),
        checkout_date: getRandomDate(2),
        guest_count: 4,
        guest_name: '김철수',
        guest_phone: '010-1234-5678',
        guest_email: 'kim@example.com',
        base_amount: 200000,
        total_amount: 250000,
        payment_status: 'paid',
        status: 'confirmed',
        special_requests: '조용한 곳으로 배정해 주세요.'
      },
      {
        accommodation_id: accommodations[1].id,
        reservation_number: 'RES' + Date.now().toString().slice(-6) + '02',
        checkin_date: getRandomDate(3),
        checkout_date: getRandomDate(4),
        guest_count: 2,
        guest_name: '박영희',
        guest_phone: '010-9876-5432',
        guest_email: 'park@example.com',
        base_amount: 150000,
        total_amount: 180000,
        payment_status: 'paid',
        status: 'confirmed',
        special_requests: null
      },
      {
        accommodation_id: accommodations[2].id,
        reservation_number: 'RES' + Date.now().toString().slice(-6) + '03',
        checkin_date: getRandomDate(5),
        checkout_date: getRandomDate(6),
        guest_count: 6,
        guest_name: '이민수',
        guest_phone: '010-5555-7777',
        guest_email: 'lee@example.com',
        base_amount: 280000,
        total_amount: 320000,
        payment_status: 'pending',
        status: 'confirmed',
        special_requests: '늦은 체크인 가능한지 문의드립니다.'
      },
      {
        accommodation_id: accommodations[0].id,
        reservation_number: 'RES' + Date.now().toString().slice(-6) + '04',
        checkin_date: getRandomDate(7),
        checkout_date: getRandomDate(9),
        guest_count: 3,
        guest_name: '정수진',
        guest_phone: '010-3333-4444',
        guest_email: 'jung@example.com',
        base_amount: 400000,
        total_amount: 450000,
        payment_status: 'paid',
        status: 'confirmed',
        special_requests: '주차 공간 확보 부탁드립니다.'
      },
      {
        accommodation_id: accommodations[1].id,
        reservation_number: 'RES' + Date.now().toString().slice(-6) + '05',
        checkin_date: getRandomDate(-2),
        checkout_date: getRandomDate(-1),
        guest_count: 2,
        guest_name: '최현진',
        guest_phone: '010-7777-8888',
        guest_email: 'choi@example.com',
        base_amount: 180000,
        total_amount: 200000,
        payment_status: 'paid',
        status: 'completed',
        special_requests: null
      }
    ]
    
    console.log(`\nInserting ${reservations.length} reservations...`)
    
    const { data, error } = await supabase
      .from('reservations')
      .insert(reservations)
      .select()
    
    if (error) {
      console.error('❌ Insert error:', error.message)
      return
    }
    
    console.log('✅ Successfully inserted reservations:')
    data.forEach((reservation, index) => {
      console.log(`   ${index + 1}. ${reservation.reservation_number} - ${reservation.guest_name} (${reservation.status})`)
    })
    
    console.log('\n📊 Checking total reservations count...')
    
    const { count } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
    
    console.log(`   Total reservations in database: ${count}`)
    
    // 예약과 숙소 조인 테스트
    console.log('\n📋 Testing reservation-accommodation join...')
    const { data: joinedData, error: joinError } = await supabase
      .from('reservations')
      .select(`
        reservation_number,
        guest_name,
        status,
        accommodations!inner(name, region)
      `)
      .limit(3)
    
    if (joinError) {
      console.error('❌ Join test failed:', joinError.message)
    } else {
      console.log('✅ Join test successful:')
      joinedData.forEach((res, index) => {
        console.log(`   ${index + 1}. ${res.reservation_number} - ${res.guest_name}`)
        console.log(`      숙소: ${res.accommodations.name} (${res.accommodations.region})`)
      })
    }
    
    console.log('\n✅ Reservations population completed successfully!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

populateReservations()