// Supabase 데이터베이스 초기 설정 및 샘플 데이터 삽입
import { createClient } from './client'

// 관리자 계정 생성 (마스터 관리자용)
export async function createMasterAdmin() {
  const supabase = createClient()

  const adminData = {
    email: 'admin@stayoneday.co.kr',
    password_hash: '$2b$10$rQhZKmQFMxYwc7RrLKO6ZOHjZHjKvJjKvJjKvJjKvJjKvJjKvJjK', // admin123!
    full_name: '시스템 관리자',
    role: 'master',
    permissions: ['all'],
    is_active: true,
    created_by: null
  }

  const { data, error } = await supabase
    .from('admin_accounts')
    .insert([adminData])
    .select()

  if (error) {
    console.error('관리자 계정 생성 실패:', error)
    throw error
  }

  return data[0]
}

// 샘플 사업자 계정 생성
export async function createSampleBusinesses() {
  const supabase = createClient()

  const businesses = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      business_name: '구공스테이',
      business_number: '123-45-67890',
      representative_name: '김구공',
      contact_email: 'gukong@stayoneday.co.kr',
      contact_phone: '010-1234-5678',
      business_address: '충청북도 청주시 상당구 용암북로 123',
      is_verified: true,
      status: 'approved'
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      business_name: '세종빌라리조트',
      business_number: '098-76-54321',
      representative_name: '이세종',
      contact_email: 'sejong@stayoneday.co.kr',
      contact_phone: '010-2345-6789',
      business_address: '세종특별자치시 조치원읍 세종대로 456',
      is_verified: true,
      status: 'approved'
    }
  ]

  const { data, error } = await supabase
    .from('business_accounts')
    .insert(businesses)
    .select()

  if (error) {
    console.error('사업자 계정 생성 실패:', error)
    throw error
  }

  return data
}

// 샘플 숙소 데이터 생성
export async function createSampleAccommodations() {
  const supabase = createClient()

  const accommodations = [
    {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      business_id: '11111111-1111-1111-1111-111111111111',
      name: '구공스테이 청주점',
      description: '청주 시내 중심가에 위치한 프리미엄 독채 풀빌라입니다. 넓은 수영장과 바베큐 시설을 완비하여 가족 및 단체 모임에 최적화되어 있습니다.',
      accommodation_type: '풀빌라',
      address: '충청북도 청주시 상당구 용암북로 123',
      detailed_address: '101동 201호',
      latitude: 36.6424341,
      longitude: 127.4890319,
      region: '청주',
      max_capacity: 12,
      bedrooms: 4,
      bathrooms: 3,
      base_price: 180000,
      weekend_price: 220000,
      status: 'active',
      is_featured: true
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      business_id: '22222222-2222-2222-2222-222222222222',
      name: '세종빌라리조트',
      description: '자연 속 힐링 공간으로 완벽한 프라이빗한 휴식을 제공합니다. 넓은 정원과 개별 바베큐존까지 완비되어 있어 가족 여행에 최적입니다.',
      accommodation_type: '독채',
      address: '세종특별자치시 조치원읍 세종대로 456',
      detailed_address: '가동 1층',
      latitude: 36.4800984,
      longitude: 127.2889851,
      region: '세종',
      max_capacity: 8,
      bedrooms: 3,
      bathrooms: 2,
      base_price: 150000,
      weekend_price: 190000,
      status: 'active',
      is_featured: true
    }
  ]

  const { data, error } = await supabase
    .from('accommodations')
    .insert(accommodations)
    .select()

  if (error) {
    console.error('숙소 생성 실패:', error)
    throw error
  }

  return data
}

// 숙소 이미지 생성
export async function createSampleImages() {
  const supabase = createClient()

  const images = [
    {
      accommodation_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      image_url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
      image_type: 'main',
      display_order: 1,
      alt_text: '구공스테이 청주점 메인'
    },
    {
      accommodation_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      image_type: 'outdoor',
      display_order: 2,
      alt_text: '야외 수영장'
    },
    {
      accommodation_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      image_url: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800',
      image_type: 'main',
      display_order: 1,
      alt_text: '세종빌라리조트 메인'
    }
  ]

  const { data, error } = await supabase
    .from('accommodation_images')
    .insert(images)
    .select()

  if (error) {
    console.error('이미지 생성 실패:', error)
    throw error
  }

  return data
}

// 숙소 카테고리 생성
export async function createSampleCategories() {
  const supabase = createClient()

  const categories = [
    { accommodation_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', category: '물놀이 가능 풀빌라' },
    { accommodation_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', category: '프라이빗 독채형' },
    { accommodation_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', category: '배달음식 이용 편리' },
    { accommodation_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', category: '프라이빗 독채형' },
    { accommodation_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', category: '자연 속 완벽한 휴식' }
  ]

  const { data, error } = await supabase
    .from('accommodation_categories')
    .insert(categories)
    .select()

  if (error) {
    console.error('카테고리 생성 실패:', error)
    throw error
  }

  return data
}

// 전체 샘플 데이터 생성
export async function setupSampleData() {
  try {
    console.log('샘플 데이터 생성 시작...')
    
    // 1. 사업자 계정 생성
    console.log('사업자 계정 생성 중...')
    await createSampleBusinesses()
    
    // 2. 숙소 생성
    console.log('숙소 생성 중...')
    await createSampleAccommodations()
    
    // 3. 이미지 생성
    console.log('이미지 생성 중...')
    await createSampleImages()
    
    // 4. 카테고리 생성
    console.log('카테고리 생성 중...')
    await createSampleCategories()
    
    console.log('샘플 데이터 생성 완료!')
    return { success: true }
    
  } catch (error) {
    console.error('샘플 데이터 생성 실패:', error)
    return { success: false, error }
  }
}

// 데이터베이스 초기화 (개발용)
export async function resetDatabase() {
  const supabase = createClient()
  
  try {
    // 데이터 순서에 주의 (외래키 제약조건 때문)
    await supabase.from('accommodation_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('accommodation_images').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('accommodations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('business_accounts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('admin_accounts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    console.log('데이터베이스 초기화 완료')
    return { success: true }
    
  } catch (error) {
    console.error('데이터베이스 초기화 실패:', error)
    return { success: false, error }
  }
}