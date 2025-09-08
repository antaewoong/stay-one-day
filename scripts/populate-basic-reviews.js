#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fcmauibvdqbocwhloqov.supabase.co'
const supabaseKey = '[REMOVED_SUPABASE_SERVICE_KEY]'

const supabase = createClient(supabaseUrl, supabaseKey)

async function populateBasicReviews() {
  try {
    console.log('📝 Populating reviews with basic existing columns...\n')
    
    // 먼저 accommodations 데이터 가져오기
    const { data: accommodations, error: accError } = await supabase
      .from('accommodations')
      .select('id, name')
      .limit(3)
    
    if (accError) {
      console.error('❌ Failed to fetch accommodations:', accError.message)
      return
    }
    
    console.log(`Found ${accommodations.length} accommodations:`)
    accommodations.forEach((acc, index) => {
      console.log(`   ${index + 1}. ${acc.name} (ID: ${acc.id})`)
    })
    
    // 기본 컬럼만 사용한 리뷰 데이터
    const reviewsData = [
      {
        accommodation_id: accommodations[0]?.id,
        rating: 5,
        content: '정말 완벽한 독채 숙소였어요! 가족들과 함께 2박 3일 머물렀는데 정말 만족스러웠습니다. 숙소가 깨끗하고 넓어서 편안하게 쉴 수 있었어요. 특히 바베큐 시설과 수영장이 정말 좋았고, 주변 경관도 아름다워서 힐링하기 최고였습니다.'
      },
      {
        accommodation_id: accommodations[0]?.id,
        rating: 4,
        content: '전체적으로 만족스러운 숙소였습니다. 시설이 깨끗하고 현대적이며, 침구류도 깔끔했어요. 바베큐 시설도 잘 갖춰져 있고 주변 환경도 조용해서 휴식하기 좋았습니다. 다만 주차공간이 조금 협소해서 큰 차량은 주차하기 어려울 수 있을 것 같아요.'
      },
      {
        accommodation_id: accommodations[1]?.id,
        rating: 5,
        content: '바다뷰가 정말 환상적이에요! 제주 여행에서 머문 숙소 중 최고였습니다. 방 안에서 바로 보이는 바다 전망이 정말 멋있고, 일출을 보면서 커피 마시는 여유로운 시간을 가질 수 있었어요. 숙소 내부도 인스타그램에서 본 것처럼 예쁘고 깨끗했습니다.'
      },
      {
        accommodation_id: accommodations[1]?.id,
        rating: 3,
        content: '위치는 정말 좋고 뷰도 예쁘지만, 체크인했을 때 청소가 완전하지 않았어요. 화장실에 머리카락이 있고 바닥에 먼지가 조금 있었습니다. 호스트에게 연락했더니 바로 재청소 해주셨지만, 처음부터 깨끗했으면 더 좋았을 것 같아요.'
      },
      {
        accommodation_id: accommodations[2]?.id,
        rating: 4,
        content: '조용하고 힐링하기 좋은 곳이에요! 도심에서 벗어나 조용한 시간을 보내고 싶어서 선택했는데 정말 좋았어요. 주변이 조용하고 자연경관이 아름다워서 스트레스가 확 풀렸습니다. 바베큐도 할 수 있고 산책로도 있어서 가족들과 좋은 시간 보냈어요.'
      },
      {
        accommodation_id: accommodations[0]?.id,
        rating: 5,
        content: '친구들과 워케이션하기 최고였어요! 친구들과 워케이션으로 3박 4일 머물렀는데 정말 완벽했어요. 와이파이 속도도 빠르고 작업할 수 있는 공간도 충분했습니다. 밤에는 바베큐하면서 맥주 마시고, 낮에는 집중해서 일할 수 있었어요.'
      },
      {
        accommodation_id: accommodations[2]?.id,
        rating: 4,
        content: '가성비 좋은 숙소였어요. 시설은 약간 오래된 느낌이지만 깨끗하게 관리되어 있고, 필요한 것들은 다 갖춰져 있었습니다. 특히 주방 시설이 잘 되어 있어서 간단한 요리도 할 수 있었어요. 주변이 조용해서 잠도 잘 잤고, 호스트분도 친절했습니다.'
      },
      {
        accommodation_id: accommodations[1]?.id,
        rating: 5,
        content: '허니문으로 이용했는데 너무 만족스러웠어요! 프라이빗한 공간에서 둘만의 시간을 보낼 수 있어서 좋았고, 바다 뷰가 정말 로맨틱했습니다. 숙소도 너무 예쁘게 꾸며져 있고, 개별 수영장에서 수영하며 힐링했어요. 평생 잊지 못할 추억이 될 것 같아요.'
      }
    ]
    
    console.log(`\nInserting ${reviewsData.length} reviews...`)
    
    const { data: insertedReviews, error: reviewError } = await supabase
      .from('reviews')
      .insert(reviewsData)
      .select('id, accommodation_id, rating')
    
    if (reviewError) {
      console.error('❌ 리뷰 추가 실패:', reviewError.message)
      return
    }
    
    console.log(`✅ ${insertedReviews.length}개 리뷰 추가 완료`)
    
    // 최종 통계 확인
    console.log('\n📊 최종 통계 확인...')
    
    const { count: totalReviews } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
    
    console.log(`총 리뷰 수: ${totalReviews}개`)
    
    // 숙소별 평균 평점 및 리뷰 수 계산
    console.log('\n📊 숙소별 통계:')
    for (const accommodation of accommodations) {
      const { data: reviewStats } = await supabase
        .from('reviews')
        .select('rating')
        .eq('accommodation_id', accommodation.id)
      
      if (reviewStats && reviewStats.length > 0) {
        const averageRating = reviewStats.reduce((sum, r) => sum + r.rating, 0) / reviewStats.length
        const ratingCounts = {
          5: reviewStats.filter(r => r.rating === 5).length,
          4: reviewStats.filter(r => r.rating === 4).length,
          3: reviewStats.filter(r => r.rating === 3).length,
          2: reviewStats.filter(r => r.rating === 2).length,
          1: reviewStats.filter(r => r.rating === 1).length
        }
        
        console.log(`  ${accommodation.name}:`)
        console.log(`    평균 평점: ${averageRating.toFixed(1)}/5 (${reviewStats.length}개 리뷰)`)
        console.log(`    평점 분포: 5★(${ratingCounts[5]}) 4★(${ratingCounts[4]}) 3★(${ratingCounts[3]}) 2★(${ratingCounts[2]}) 1★(${ratingCounts[1]})`)
      } else {
        console.log(`  ${accommodation.name}: 리뷰 없음`)
      }
    }
    
    console.log('\n✅ 기본 리뷰 데이터 생성 완료!')
    console.log('\n📋 다음 단계:')
    console.log('   1. 숙소 상세 페이지에 리뷰 섹션 추가')
    console.log('   2. 메인 페이지 카드에 별점 표시')
    console.log('   3. 추가 기능을 위해서는 Supabase에서 수동으로 컬럼 추가 필요')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

populateBasicReviews()