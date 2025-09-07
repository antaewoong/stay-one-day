#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fcmauibvdqbocwhloqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjbWF1aWJ2ZHFib2N3aGxvcW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjgwODY3OCwiZXhwIjoyMDcyMzg0Njc4fQ.vwEr3cyiQSWBabAgoodWUzBSewrVTco3kFg_w-ae1D0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function populateExistingReviews() {
  try {
    console.log('📝 Populating existing reviews table with sample data...\n')
    
    // 먼저 accommodations 데이터 가져오기
    const { data: accommodations, error: accError } = await supabase
      .from('accommodations')
      .select('id, name')
      .limit(3)
    
    if (accError) {
      console.error('❌ Failed to fetch accommodations:', accError.message)
      return
    }
    
    console.log(`Found ${accommodations.length} accommodations`)
    
    // 기본 컬럼들만 사용하여 리뷰 데이터 생성
    const reviewsData = [
      {
        user_name: '김지영',
        accommodation_id: accommodations[0]?.id,
        rating: 5,
        content: '정말 완벽한 독채 숙소였어요! 가족들과 함께 2박 3일 머물렀는데 정말 만족스러웠습니다. 숙소가 깨끗하고 넓어서 편안하게 쉴 수 있었어요.'
      },
      {
        user_name: '박민수',
        accommodation_id: accommodations[0]?.id,
        rating: 4,
        content: '전체적으로 만족스러운 숙소였습니다. 시설이 깨끗하고 현대적이며, 침구류도 깔끔했어요. 다만 주차공간이 조금 협소해서 큰 차량은 주차하기 어려울 수 있을 것 같아요.'
      },
      {
        user_name: '이수진',
        accommodation_id: accommodations[1]?.id,
        rating: 5,
        content: '바다뷰가 정말 환상적이에요! 제주 여행에서 머문 숙소 중 최고였습니다. 방 안에서 바로 보이는 바다 전망이 정말 멋있고, 일출을 보면서 커피 마시는 여유로운 시간을 가질 수 있었어요.'
      },
      {
        user_name: '정현우',
        accommodation_id: accommodations[1]?.id,
        rating: 3,
        content: '위치는 정말 좋고 뷰도 예쁘지만, 체크인했을 때 청소가 완전하지 않았어요. 화장실에 머리카락이 있고 바닥에 먼지가 조금 있었습니다.'
      },
      {
        user_name: '최유리',
        accommodation_id: accommodations[2]?.id,
        rating: 4,
        content: '조용하고 힐링하기 좋은 곳이에요. 도심에서 벗어나 조용한 시간을 보내고 싶어서 선택했는데 정말 좋았어요. 주변이 조용하고 자연경관이 아름다워서 스트레스가 확 풀렸습니다.'
      },
      {
        user_name: '임태호',
        accommodation_id: accommodations[0]?.id,
        rating: 5,
        content: '친구들과 워케이션하기 최고! 친구들과 워케이션으로 3박 4일 머물렀는데 정말 완벽했어요. 와이파이 속도도 빠르고 작업할 수 있는 공간도 충분했습니다.'
      }
    ]
    
    console.log(`Inserting ${reviewsData.length} reviews...`)
    
    const { data: insertedReviews, error: reviewError } = await supabase
      .from('reviews')
      .insert(reviewsData)
      .select()
    
    if (reviewError) {
      console.error('❌ 리뷰 추가 실패:', reviewError.message)
      
      // 다른 컬럼명들을 시도해보자
      console.log('\n다른 컬럼 구조로 시도...')
      
      const simpleReview = {
        user_name: '테스트 사용자',
        rating: 5
      }
      
      const { data: testData, error: testError } = await supabase
        .from('reviews')
        .insert([simpleReview])
        .select()
        
      if (testError) {
        console.error('❌ 간단한 리뷰도 실패:', testError.message)
      } else {
        console.log('✅ 간단한 리뷰 성공:', testData)
        
        // 테스트 데이터 삭제
        await supabase
          .from('reviews')
          .delete()
          .eq('user_name', '테스트 사용자')
      }
      
      return
    }
    
    console.log(`✅ ${insertedReviews.length}개 리뷰 추가 완료`)
    
    // 최종 확인
    const { count: reviewCount } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
    
    console.log(`\n📊 총 리뷰 수: ${reviewCount}개`)
    
    // 숙소별 평균 평점 계산
    console.log('\n📊 숙소별 평균 평점:')
    for (const accommodation of accommodations) {
      const { data: reviewStats } = await supabase
        .from('reviews')
        .select('rating')
        .eq('accommodation_id', accommodation.id)
      
      if (reviewStats && reviewStats.length > 0) {
        const averageRating = reviewStats.reduce((sum, r) => sum + r.rating, 0) / reviewStats.length
        console.log(`  ${accommodation.name}: ${averageRating.toFixed(1)}/5 (${reviewStats.length}개 리뷰)`)
      }
    }
    
    console.log('\n✅ 기존 reviews 테이블 데이터 추가 완료!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

populateExistingReviews()