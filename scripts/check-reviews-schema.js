#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fcmauibvdqbocwhloqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjbWF1aWJ2ZHFib2N3aGxvcW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjgwODY3OCwiZXhwIjoyMDcyMzg0Njc4fQ.vwEr3cyiQSWBabAgoodWUzBSewrVTco3kFg_w-ae1D0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkReviewsSchema() {
  try {
    console.log('📋 Checking existing reviews table schema...\n')
    
    // reviews 테이블 확인
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .limit(1)
    
    if (reviewsError) {
      if (reviewsError.code === 'PGRST116') {
        console.log('❌ reviews table does not exist')
      } else {
        console.log('⚠️ reviews table error:', reviewsError.message)
      }
    } else {
      console.log('✅ reviews table exists')
      
      if (reviewsData && reviewsData.length > 0) {
        console.log('📊 Reviews table columns:')
        Object.keys(reviewsData[0]).forEach(column => {
          console.log(`   - ${column}`)
        })
      }
    }
    
    // accommodation_ratings 테이블 확인
    console.log('\n📋 Checking accommodation_ratings table...')
    const { data: ratingsData, error: ratingsError } = await supabase
      .from('accommodation_ratings')
      .select('*')
      .limit(1)
    
    if (ratingsError) {
      if (ratingsError.code === 'PGRST116') {
        console.log('❌ accommodation_ratings table does not exist')
      } else {
        console.log('⚠️ accommodation_ratings table error:', ratingsError.message)
      }
    } else {
      console.log('✅ accommodation_ratings table exists')
      
      if (ratingsData && ratingsData.length > 0) {
        console.log('📊 Accommodation_ratings table columns:')
        Object.keys(ratingsData[0]).forEach(column => {
          console.log(`   - ${column}`)
        })
      }
    }
    
    // review_ratings 테이블 확인
    console.log('\n📋 Checking review_ratings table...')
    const { data: categoryData, error: categoryError } = await supabase
      .from('review_ratings')
      .select('*')
      .limit(1)
    
    if (categoryError) {
      if (categoryError.code === 'PGRST116') {
        console.log('❌ review_ratings table does not exist')
      } else {
        console.log('⚠️ review_ratings table error:', categoryError.message)
      }
    } else {
      console.log('✅ review_ratings table exists')
      
      if (categoryData && categoryData.length > 0) {
        console.log('📊 Review_ratings table columns:')
        Object.keys(categoryData[0]).forEach(column => {
          console.log(`   - ${column}`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkReviewsSchema()