# Stay One Day 전체 사이트맵

## 📋 프로젝트 개요
**Stay One Day**는 충청권(청주, 세종, 대전, 천안, 공주 등) 중심의 당일치기 숙소 대여 플랫폼입니다.

### 🎯 주요 기능
- 프리미엄 숙소 큐레이션
- 당일 예약 시스템
- 호스트 직접 등록 시스템
- AI 기반 맞춤 추천
- 관리자 시스템

---

## 🏠 메인 공용 페이지

### 메인 서비스
- **`/`** - 메인 홈페이지
  - 히어로 슬라이드 (드래그 가능)
  - 추천 스테이 섹션
  - 카테고리별 숙소 (풀빌라, 독채형)
  - 검색 기능 (위치, 날짜, 인원)

- **`/spaces`** - 전체 숙소 목록
  - 필터링 (지역, 가격, 타입)
  - 검색 기능
  - 그리드/리스트 뷰
  - 정렬 옵션

- **`/spaces/[id]`** - 개별 숙소 상세 페이지
  - 숙소 상세 정보
  - 이미지 갤러리
  - 예약 시스템
  - 리뷰 및 평점

### 부가 서비스
- **`/contact`** - 문의 페이지
- **`/profile`** - 사용자 프로필
- **`/wishlist`** - 위시리스트
- **`/reservations`** - 예약 내역
- **`/reservation`** - 예약 페이지
- **`/payment`** - 결제 페이지  
- **`/payment/success`** - 결제 완료 페이지

---

## 🔐 인증 시스템

### 인증 페이지
- **`/auth/login`** - 메인 로그인 페이지
- **`/auth/signup`** - 회원가입 페이지
- **`/auth/callback`** - OAuth 콜백 페이지
- **`/login`** - 추가 로그인 페이지

### 인증 방식
- 이메일/비밀번호 로그인
- 소셜 로그인 (구글, 카카오)
- Supabase Auth 사용

---

## 🏨 호스트 (Host) 시스템

### 호스트 메인
- **`/host`** - 호스트 메인 페이지
  - 호스트 소개
  - 등록 안내
  - 수수료 안내 (기존 OTA 대비 저렴)

- **`/host/register`** - 호스트 등록 페이지
  - 기본 정보 입력
  - 사업자 정보
  - 연락처 (info@nuklags.com)

### 호스트 대시보드
- **`/host/dashboard`** - 호스트 대시보드
  - 숙소 관리
  - 예약 현황
  - 수익 통계

### 숙소 관리
- **`/host/accommodations/new`** - 새 숙소 등록
  - 기본 정보 (이름, 설명, 타입)
  - 사진 업로드 (최대 10개)
  - 위치 정보
  - 숙소 정보 (인원, 침실, 욕실)
  - 가격 설정 (평일/주말)
  - 편의시설 선택
  - 체크인/아웃 시간

- **`/host/accommodations/[id]/edit`** - 숙소 정보 수정
  - 기존 정보 수정
  - 이미지 업데이트

---

## 💼 비즈니스 파트너 시스템

### 비즈니스 관리
- **`/business/register`** - 비즈니스 파트너 등록
- **`/business/dashboard`** - 비즈니스 대시보드
- **`/business/login`** - 비즈니스 전용 로그인
- **`/business/spaces/add`** - 비즈니스 숙소 추가
- **`/partner`** - 파트너 소개 페이지

---

## 🔧 관리자 (Admin) 시스템

### 메인 관리
- **`/admin`** - 관리자 메인 대시보드
  - 전체 통계
  - 최근 활동
  - 빠른 액션

- **`/admin/dashboard`** - 상세 대시보드
  - 매출 통계
  - 예약 현황
  - 사용자 통계

### 숙소 관리
- **`/admin/accommodations`** - 숙소 전체 관리
  - 전체 숙소 목록
  - 승인/거부
  - 상태 관리

- **`/admin/accommodations/add`** - 관리자 숙소 직접 추가
- **`/admin/stays`** - 스테이 관리
- **`/admin/stays/add`** - 스테이 추가
- **`/admin/stays/rules`** - 숙소 이용 규칙 관리
- **`/admin/stays/cancellation`** - 취소 정책 관리
- **`/admin/stays/reviews`** - 리뷰 관리

### 예약 관리
- **`/admin/reservations`** - 예약 전체 관리
  - 예약 목록
  - 상태 변경
  - 취소 처리

- **`/admin/reservations/info`** - 예약 정보 관리
- **`/admin/reservations/status`** - 예약 상태 관리
- **`/admin/reservations/calendar`** - 예약 캘린더 뷰

### 객실 관리
- **`/admin/rooms/info`** - 객실 정보 관리
- **`/admin/rooms/options`** - 객실 옵션 관리
- **`/admin/rooms/checkin-sms`** - 체크인 SMS 설정
- **`/admin/rooms/checkout-sms`** - 체크아웃 SMS 설정

### 정산 및 결제
- **`/admin/settlements/payments`** - 결제 정산 관리
- **`/admin/settlements/reports`** - 정산 리포트

### 시스템 관리
- **`/admin/notices`** - 공지사항 관리
- **`/admin/insert-data`** - 실제 숙소 데이터 삽입
  - 청주 힐스테이 프리미엄 풀빌라
  - 세종 모던하우스 독채형 펜션
  - 대전 스카이라운지 루프탑 펜션
  - 천안 펫프렌들리 풀빌라
  - 청주 자연속 힐링하우스
  - 공주 전통한옥 스테이

- **`/admin/update-images`** - 이미지 업데이트
- **`/admin/seed`** - 시드 데이터 관리

---

## 🎯 마케팅 & 프로모션

### 프로모션
- **`/promotion`** - 프로모션 페이지
  - 할인 이벤트
  - 특가 상품

- **`/pre-order`** - 사전 예약 페이지
  - 얼리버드 할인
  - 신규 숙소 사전 예약

---

## 🛠 개발 & 테스트 (개발용)

### 테스트 페이지
- **`/dev-setup`** - 개발 환경 설정
- **`/map-test`** - 지도 기능 테스트
- **`/simple-map`** - 간단 지도 테스트

---

## 🔗 API 엔드포인트

### 숙소 관련
- **`/api/accommodations`** - 숙소 CRUD
- **`/api/accommodations/[id]`** - 개별 숙소 관리
- **`/api/accommodations/update-images`** - 이미지 업데이트
- **`/api/insert-real-data`** - 실제 데이터 삽입

### 예약 관련
- **`/api/reservations`** - 예약 관리
- **`/api/reservations/[id]`** - 개별 예약 관리

---

## 📁 주요 컴포넌트 구조

### UI 컴포넌트
- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/input.tsx`
- `components/ui/calendar.tsx`
- `components/ui/image-upload.tsx`

### 레이아웃
- `components/header.tsx` - 메인 헤더
- `app/layout.tsx` - 루트 레이아웃
- `app/admin/layout.tsx` - 관리자 레이아웃

---

## 🗄 데이터베이스 스키마

### 주요 테이블
- `accommodations` - 숙소 정보
- `accommodation_images` - 숙소 이미지
- `reservations` - 예약 정보
- `reviews` - 리뷰 데이터
- `users` - 사용자 정보

### 데이터베이스 설정
- Supabase PostgreSQL 사용
- 실시간 구독 기능
- Row Level Security (RLS) 적용

---

## 🎨 디자인 시스템

### 스타일 가이드
- **색상**: 그레이 계열 (모던한 느낌)
- **타이포그래피**: Inter 폰트
- **아이콘**: Lucide React (모던 아이콘)
- **레이아웃**: Tailwind CSS

### 반응형 디자인
- 모바일 우선 디자인
- 태블릿/데스크톱 최적화
- 터치 친화적 인터페이스

---

## 🚀 배포 정보

### 기술 스택
- **Frontend**: Next.js 14.0.4, React, TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Version Control**: GitHub

### 환경 변수
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 📞 연락처 및 지원

- **문의 이메일**: info@nuklags.com
- **GitHub**: antaewoong/stay-one-day
- **배포 URL**: TBD (Vercel)

---

## 🔄 업데이트 로그

### 최신 업데이트 (2024)
- ✅ 모던 아이콘 시스템 적용 (Award, Waves, Home)
- ✅ 호스트 숙소 등록 시스템 완성
- ✅ 관리자 데이터 관리 시스템 구축
- ✅ 화이트 텍스트 가독성 문제 전면 수정
- ✅ 데이터베이스 제약조건 오류 해결
- ✅ 무한 로딩 오류 수정

### 다음 업데이트 예정
- 🔄 Vercel 배포 완료
- 🔄 실제 결제 시스템 연동
- 🔄 SMS 알림 기능
- 🔄 리뷰 시스템 고도화