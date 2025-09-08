#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fcmauibvdqbocwhloqov.supabase.co'
const supabaseKey = '[REMOVED_SUPABASE_SERVICE_KEY]'

const supabase = createClient(supabaseUrl, supabaseKey)

async function populateReviewsData() {
  try {
    console.log('📝 Populating reviews and ratings data...\n')
    
    // 먼저 accommodations와 reservations 데이터 가져오기
    const { data: accommodations, error: accError } = await supabase
      .from('accommodations')
      .select('id, name')
      .limit(3)
    
    if (accError) {
      console.error('❌ Failed to fetch accommodations:', accError.message)
      return
    }
    
    const { data: reservations, error: resError } = await supabase
      .from('reservations')
      .select('id, accommodation_id')
      .limit(5)
    
    if (resError) {
      console.error('❌ Failed to fetch reservations:', resError.message)
      return
    }
    
    console.log(`Found ${accommodations.length} accommodations and ${reservations.length} reservations`)
    
    // 리뷰 샘플 데이터
    const reviewsData = [
      {
        user_name: '김지영',
        user_email: 'jiyoung@example.com',
        accommodation_id: accommodations[0]?.id,
        reservation_id: reservations[0]?.id,
        rating: 5,
        title: '정말 완벽한 독채 숙소였어요!',
        content: '가족들과 함께 2박 3일 머물렀는데 정말 만족스러웠습니다. 숙소가 깨끗하고 넓어서 편안하게 쉴 수 있었어요. 특히 바베큐 시설과 수영장이 정말 좋았고, 주변 경관도 아름다워서 힐링하기 최고였습니다. 호스트분도 친절하게 안내해주셔서 감사했어요. 다음에 또 이용하고 싶어요!',
        is_verified: true,
        helpful_count: 12
      },
      {
        user_name: '박민수',
        user_email: 'minsu@example.com',
        accommodation_id: accommodations[0]?.id,
        reservation_id: reservations[1]?.id,
        rating: 4,
        title: '깨끗하고 좋아요, 다만 주차가...',
        content: '전체적으로 만족스러운 숙소였습니다. 시설이 깨끗하고 현대적이며, 침구류도 깔끔했어요. 다만 주차공간이 조금 협소해서 큰 차량은 주차하기 어려울 수 있을 것 같아요. 그 외에는 모든 면에서 만족스러웠고 재방문 의사 있습니다.',
        is_verified: true,
        helpful_count: 8
      },
      {
        user_name: '이수진',
        user_email: 'sujin@example.com',
        accommodation_id: accommodations[1]?.id,
        reservation_id: reservations[2]?.id,
        rating: 5,
        title: '바다뷰가 정말 환상적이에요!',
        content: '제주 여행에서 머문 숙소 중 최고였습니다. 방 안에서 바로 보이는 바다 전망이 정말 멋있고, 일출을 보면서 커피 마시는 여유로운 시간을 가질 수 있었어요. 숙소 내부도 인스타그램에서 본 것처럼 예쁘고 깨끗했습니다. 개별 수영장도 너무 좋았어요!',
        is_verified: true,
        helpful_count: 15,
        response: '좋은 리뷰 감사합니다! 바다뷰를 보며 편안한 시간 보내셨다니 저희도 기쁩니다. 다음에도 제주 오시면 꼭 찾아주세요!',
        response_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        user_name: '정현우',
        user_email: 'hyeonwoo@example.com',
        accommodation_id: accommodations[1]?.id,
        reservation_id: reservations[3]?.id,
        rating: 3,
        title: '위치는 좋지만 청소 상태가...',
        content: '위치는 정말 좋고 뷰도 예쁘지만, 체크인했을 때 청소가 완전하지 않았어요. 화장실에 머리카락이 있고 바닥에 먼지가 조금 있었습니다. 호스트에게 연락했더니 바로 재청소 해주셨지만, 처음부터 깨끗했으면 더 좋았을 것 같아요.',
        is_verified: true,
        helpful_count: 3,
        response: '불편을 드려 죄송합니다. 청소팀에 더 철저한 점검을 요청하겠습니다. 다음 방문 시에는 더 만족스러운 경험을 드리도록 하겠습니다.',
        response_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        user_name: '최유리',
        user_email: 'yuri@example.com',
        accommodation_id: accommodations[2]?.id,
        reservation_id: reservations[4]?.id,
        rating: 4,
        title: '조용하고 힐링하기 좋은 곳',
        content: '도심에서 벗어나 조용한 시간을 보내고 싶어서 선택했는데 정말 좋았어요. 주변이 조용하고 자연경관이 아름다워서 스트레스가 확 풀렸습니다. 바베큐도 할 수 있고 산책로도 있어서 가족들과 좋은 시간 보냈어요. 다만 근처에 편의시설이 조금 부족해서 미리 장보고 가시는 걸 추천해요.',
        is_verified: true,
        helpful_count: 6
      },
      {
        user_name: '임태호',
        user_email: 'taeho@example.com',
        accommodation_id: accommodations[0]?.id,
        rating: 5,
        title: '친구들과 워케이션하기 최고!',
        content: '친구들과 워케이션으로 3박 4일 머물렀는데 정말 완벽했어요. 와이파이 속도도 빠르고 작업할 수 있는 공간도 충분했습니다. 밤에는 바베큐하면서 맥주 마시고, 낮에는 집중해서 일할 수 있었어요. 호스트분도 체크인부터 체크아웃까지 정말 친절하게 도와주셨습니다.',
        is_verified: false,
        helpful_count: 9
      }
    ]
    
    console.log('\n1. 리뷰 데이터 추가 중...')
    
    const { data: insertedReviews, error: reviewError } = await supabase
      .from('reviews')
      .insert(reviewsData)
      .select('id, accommodation_id, rating')
    
    if (reviewError) {
      console.error('❌ 리뷰 추가 실패:', reviewError.message)
      return
    }
    
    console.log(`✅ ${insertedReviews.length}개 리뷰 추가 완료`)
    
    // 카테고리별 평점 데이터 추가
    console.log('\n2. 카테고리별 평점 데이터 추가 중...')
    
    const categoryRatings = []
    const categories = ['cleanliness', 'location', 'value', 'amenities', 'communication', 'checkin']
    
    insertedReviews.forEach(review => {
      categories.forEach(category => {
        // 전체 평점 기준으로 카테고리별 평점을 약간씩 변형
        let categoryRating = review.rating
        if (Math.random() > 0.7) {
          categoryRating += Math.random() > 0.5 ? 1 : -1
          categoryRating = Math.max(1, Math.min(5, categoryRating))
        }
        
        categoryRatings.push({
          review_id: review.id,
          category,
          rating: categoryRating
        })
      })
    })
    
    const { error: categoryError } = await supabase
      .from('review_ratings')
      .insert(categoryRatings)
    
    if (categoryError) {
      console.error('❌ 카테고리별 평점 추가 실패:', categoryError.message)
    } else {
      console.log(`✅ ${categoryRatings.length}개 카테고리별 평점 추가 완료`)
    }
    
    // 평점 통계 업데이트
    console.log('\n3. 숙소별 평점 통계 업데이트 중...')
    
    for (const accommodation of accommodations) {
      try {
        await supabase.rpc('update_accommodation_ratings', { 
          acc_id: accommodation.id 
        })
        console.log(`✅ ${accommodation.name} 평점 통계 업데이트 완료`)
      } catch (error) {
        console.error(`❌ ${accommodation.name} 평점 통계 업데이트 실패:`, error.message)
      }
    }
    
    // 최종 결과 확인
    console.log('\n📊 최종 결과 확인...')
    
    try {
      const { count: reviewCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
      
      const { count: ratingCount } = await supabase
        .from('review_ratings')
        .select('*', { count: 'exact', head: true })
      
      const { data: statsData } = await supabase
        .from('accommodation_ratings')
        .select('accommodation_id, total_reviews, average_rating')
      
      console.log(`총 리뷰: ${reviewCount}개`)
      console.log(`총 카테고리별 평점: ${ratingCount}개`)
      console.log(`평점 통계 생성된 숙소: ${statsData?.length || 0}개`)
      
      if (statsData && statsData.length > 0) {
        console.log('\n숙소별 평점 통계:')
        for (const stat of statsData) {
          const accommodation = accommodations.find(acc => acc.id === stat.accommodation_id)
          console.log(`  ${accommodation?.name}: ${stat.average_rating}/5 (${stat.total_reviews}개 리뷰)`)
        }
      }
      
    } catch (error) {
      console.error('최종 확인 중 오류:', error.message)
    }
    
    console.log('\n✅ 별점/리뷰 시스템 데이터 생성 완료!')
    console.log('\n⚠️  테이블 관련 오류가 발생하면:')
    console.log('   1. Supabase 대시보드 > SQL Editor로 이동')
    console.log('   2. scripts/create-reviews-tables.sql 파일 내용을 복사하여 실행')
    console.log('   3. 다시 이 스크립트를 실행하세요')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

populateReviewsData()