import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { searchParams } = new URL(request.url)
    const hostId = searchParams.get('hostId')

    if (!hostId) {
      return NextResponse.json(
        { error: '호스트 ID가 필요합니다' },
        { status: 400 }
      )
    }

    // 호스트의 숙소에 대한 인플루언서 리뷰 조회
    // 실제 데이터베이스 구조에 맞게 쿼리를 작성해야 하지만,
    // 현재는 샘플 데이터로 응답
    const sampleReviews = [
      {
        id: '1',
        influencer_id: 'inf1',
        accommodation_id: 'acc1',
        influencer_name: '여행러버_지은',
        influencer_instagram: '@travel_lover_jieun',
        influencer_follower_count: 45000,
        accommodation_name: '제주 오션뷰 펜션',
        content: '제주도에서 경험한 최고의 숙소였어요! 바다뷰가 정말 환상적이고 시설도 깔끔했습니다. 특히 테라스에서 보는 일몰이 너무 아름다웠어요. 호스트님도 친절하시고 체크인 과정도 매우 원활했습니다. 다음에 제주도 여행할 때도 꼭 다시 방문하고 싶어요!',
        rating: 5,
        images: [
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'
        ],
        platform: 'instagram',
        post_url: 'https://instagram.com/p/example1',
        views: 12500,
        likes: 850,
        comments_count: 45,
        engagement_rate: 4.2,
        created_at: '2024-03-15T10:30:00Z',
        host_reply: null,
        host_reply_date: null,
        ai_evaluation: {
          grade: 'A',
          overall_score: 85,
          final_recommendation: '적극 추천'
        }
      },
      {
        id: '2',
        influencer_id: 'inf2',
        accommodation_id: 'acc2',
        influencer_name: '감성캠핑_민수',
        influencer_instagram: '@emotional_camping',
        influencer_follower_count: 28000,
        accommodation_name: '강원도 힐링 글램핑',
        content: '자연 속에서 힐링하기 좋은 글램핑장이었습니다. 텐트 내부도 생각보다 넓고 편안했어요. 밤에는 별이 정말 많이 보여서 감동이었습니다. 다만 와이파이가 조금 약한 것 같아요. 그래도 디지털 디톡스하기에는 완벽한 곳이었습니다!',
        rating: 4,
        images: [
          'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1537905569824-f89f14cceb68?w=400&h=300&fit=crop'
        ],
        platform: 'youtube',
        post_url: 'https://youtube.com/watch?v=example2',
        views: 8200,
        likes: 420,
        comments_count: 28,
        engagement_rate: 5.8,
        created_at: '2024-03-12T14:20:00Z',
        host_reply: '소중한 리뷰 감사합니다! 와이파이 문제는 개선하도록 하겠습니다. 다음에도 꼭 방문해주세요!',
        host_reply_date: '2024-03-13T09:15:00Z',
        ai_evaluation: {
          grade: 'B',
          overall_score: 78,
          final_recommendation: '추천'
        }
      },
      {
        id: '3',
        influencer_id: 'inf3',
        accommodation_id: 'acc3',
        influencer_name: '펜션리뷰_소영',
        influencer_instagram: '@pension_review_sy',
        influencer_follower_count: 35000,
        accommodation_name: '경기도 가족펜션',
        content: '가족 단위로 오기 정말 좋은 펜션이었어요. 아이들이 놀 수 있는 공간도 충분하고, 주방 시설도 잘 갖춰져 있어서 간단한 요리도 할 수 있었습니다. 근처에 마트도 있어서 편리했어요. 다만 주차공간이 좀 좁은 것 같아요.',
        rating: 4,
        images: [
          'https://images.unsplash.com/photo-1520637836862-4d197d17c18a?w=400&h=300&fit=crop'
        ],
        platform: 'blog',
        post_url: 'https://blog.naver.com/example3',
        views: 3200,
        likes: 180,
        comments_count: 15,
        engagement_rate: 3.9,
        created_at: '2024-03-10T16:45:00Z',
        host_reply: null,
        host_reply_date: null,
        ai_evaluation: {
          grade: 'B',
          overall_score: 75,
          final_recommendation: '조건부 추천'
        }
      }
    ]

    return NextResponse.json({
      success: true,
      data: sampleReviews
    })

  } catch (error) {
    console.error('인플루언서 리뷰 조회 오류:', error)
    return NextResponse.json(
      { error: '인플루언서 리뷰를 불러올 수 없습니다' },
      { status: 500 }
    )
  }
}