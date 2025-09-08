#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fcmauibvdqbocwhloqov.supabase.co'
const supabaseKey = '[REMOVED_SUPABASE_SERVICE_KEY]'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkInquiriesTable() {
  try {
    console.log('📋 Checking inquiries/customer_inquiries table structure...\n')
    
    // inquiries 테이블 먼저 확인
    const { data: inquiriesData, error: inquiriesError } = await supabase
      .from('inquiries')
      .select('*')
      .limit(1)
    
    if (inquiriesError && inquiriesError.code === 'PGRST116') {
      console.log('❌ inquiries table does not exist')
      
      // customer_inquiries 테이블 확인
      console.log('\n📋 Checking customer_inquiries table...')
      const { data: customerInquiriesData, error: customerInquiriesError } = await supabase
        .from('customer_inquiries')
        .select('*')
        .limit(1)
      
      if (customerInquiriesError && customerInquiriesError.code === 'PGRST116') {
        console.log('❌ customer_inquiries table does not exist either')
        
        // support_tickets 테이블 확인
        console.log('\n📋 Checking support_tickets table...')
        const { data: supportTicketsData, error: supportTicketsError } = await supabase
          .from('support_tickets')
          .select('*')
          .limit(1)
        
        if (supportTicketsError && supportTicketsError.code === 'PGRST116') {
          console.log('❌ support_tickets table does not exist either')
          console.log('\n⚠️ No inquiry-related tables found. Need to create inquiry system.')
        } else if (supportTicketsError) {
          console.log('⚠️ support_tickets table error:', supportTicketsError.message)
        } else {
          console.log('✅ support_tickets table exists')
          
          // support_tickets 샘플 데이터
          const { data: sampleTickets } = await supabase
            .from('support_tickets')
            .select('*')
            .limit(3)
          
          if (sampleTickets) {
            console.log(`📊 Sample support tickets (${sampleTickets.length} records):`)
            sampleTickets.forEach((ticket, index) => {
              console.log(`   ${index + 1}. ${ticket.title || ticket.subject || 'No title'}`)
              Object.keys(ticket).slice(0, 5).forEach(key => {
                console.log(`      ${key}: ${ticket[key]}`)
              })
              console.log('      ---')
            })
          }
        }
      } else if (customerInquiriesError) {
        console.log('⚠️ customer_inquiries table error:', customerInquiriesError.message)
      } else {
        console.log('✅ customer_inquiries table exists')
        
        // customer_inquiries 샘플 데이터
        const { data: sampleInquiries } = await supabase
          .from('customer_inquiries')
          .select('*')
          .limit(3)
        
        if (sampleInquiries) {
          console.log(`📊 Sample customer inquiries (${sampleInquiries.length} records):`)
          sampleInquiries.forEach((inquiry, index) => {
            console.log(`   ${index + 1}. ${inquiry.title || inquiry.subject || 'No title'}`)
            Object.keys(inquiry).slice(0, 5).forEach(key => {
              console.log(`      ${key}: ${inquiry[key]}`)
            })
            console.log('      ---')
          })
        }
      }
    } else if (inquiriesError) {
      console.log('⚠️ inquiries table error:', inquiriesError.message)
    } else {
      console.log('✅ inquiries table exists')
      
      // inquiries 샘플 데이터
      const { data: sampleInquiries } = await supabase
        .from('inquiries')
        .select('*')
        .limit(3)
      
      if (sampleInquiries) {
        console.log(`📊 Sample inquiries (${sampleInquiries.length} records):`)
        sampleInquiries.forEach((inquiry, index) => {
          console.log(`   ${index + 1}. ${inquiry.title || inquiry.subject || 'No title'}`)
          Object.keys(inquiry).slice(0, 5).forEach(key => {
            console.log(`      ${key}: ${inquiry[key]}`)
          })
          console.log('      ---')
        })
      }
    }
    
    console.log('\n✅ Inquiry table structure check completed!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkInquiriesTable()