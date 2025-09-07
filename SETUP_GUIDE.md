# Stay One Day - 상용 서비스 배포 가이드

이제 실제 상용 서비스가 가능하도록 외부에서 설정해야 하는 작업들을 안내해 드립니다.

## 1. Supabase 설정

### 1-1. Supabase 프로젝트 생성
1. https://supabase.com 접속
2. "New Project" 클릭
3. 프로젝트명: `stay-one-day`
4. 데이터베이스 비밀번호 설정 (복잡하게)
5. 리전: `Northeast Asia (Seoul)` 선택
6. 프로젝트 생성 완료

### 1-2. 데이터베이스 스키마 설정
1. Supabase 대시보드 → `SQL Editor` 이동
2. 프로젝트의 `/lib/supabase/schema.sql` 파일 내용 전체 복사
3. SQL Editor에 붙여넣기 후 `RUN` 실행
4. 모든 테이블과 관계가 성공적으로 생성되는지 확인

### 1-3. Supabase 환경 변수 확인
1. Supabase 대시보드 → `Settings` → `API` 이동
2. 다음 값들을 복사해두세요:
   - `Project URL`: `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public`: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role`: `SUPABASE_SERVICE_ROLE_KEY`

## 2. 카카오 개발자 설정

### 2-1. 카카오 개발자 계정 생성
1. https://developers.kakao.com 접속
2. 카카오 계정으로 로그인
3. `내 애플리케이션` → `애플리케이션 추가하기` 클릭

### 2-2. 애플리케이션 설정
1. **앱 이름**: `Stay One Day`
2. **사업자명**: 귀하의 사업자명 입력
3. **카테고리**: `여행/교통/숙박` 선택
4. 애플리케이션 생성 완료

### 2-3. 카카오 로그인 설정
1. 생성된 앱 선택 → `카카오 로그인` 메뉴
2. `카카오 로그인 활성화 설정` → `ON`으로 변경
3. `OpenID Connect 활성화 설정` → `ON`으로 변경
4. `Redirect URI` 설정:
   - 개발환경: `http://localhost:3000/api/auth/callback/kakao`
   - 운영환경: `https://your-domain.com/api/auth/callback/kakao`

### 2-4. 필요한 정보 동의항목 설정
1. `카카오 로그인` → `동의항목` 메뉴
2. 다음 항목들을 `필수 동의`로 설정:
   - 닉네임
   - 이메일
   - 전화번호 (선택 동의)

### 2-5. 카카오 API 키 확인
1. `내 애플리케이션` → 앱 선택 → `앱 키` 메뉴
2. 다음 값들을 복사해두세요:
   - `REST API 키`: `KAKAO_CLIENT_ID`
   - `JavaScript 키` (필요시)

## 3. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=여기에_supabase_project_url_입력
NEXT_PUBLIC_SUPABASE_ANON_KEY=여기에_supabase_anon_key_입력
SUPABASE_SERVICE_ROLE_KEY=여기에_supabase_service_role_key_입력

# NextAuth Configuration
NEXTAUTH_SECRET=여기에_랜덤한_32자_이상의_문자열_입력
NEXTAUTH_URL=http://localhost:3000

# Kakao Login
KAKAO_CLIENT_ID=여기에_kakao_rest_api_key_입력
KAKAO_CLIENT_SECRET=여기에_kakao_client_secret_입력

# TossPayments (나중에 설정)
TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=

# SMS Service (나중에 설정)
SMS_API_KEY=
SMS_API_SECRET=
```

## 4. Vercel 배포 설정

### 4-1. Vercel 계정 생성 및 프로젝트 연결
1. https://vercel.com 접속
2. GitHub 계정으로 로그인
3. `Import Git Repository` 클릭
4. 이 프로젝트 리포지토리 선택

### 4-2. 환경 변수 설정
1. Vercel 프로젝트 → `Settings` → `Environment Variables`
2. 위의 `.env.local` 파일의 모든 변수들을 하나씩 추가
3. `NEXTAUTH_URL`은 배포된 도메인으로 변경 (예: `https://your-app.vercel.app`)

### 4-3. 카카오 로그인 Redirect URI 추가
1. 배포 완료 후 Vercel에서 제공하는 도메인 확인
2. 카카오 개발자 콘솔 → `카카오 로그인` → `Redirect URI`에 추가:
   - `https://your-app.vercel.app/api/auth/callback/kakao`

## 5. 도메인 연결 (선택사항)

### 5-1. 커스텀 도메인 설정
1. 원하는 도메인 구매 (예: stayoneday.kr)
2. Vercel 프로젝트 → `Settings` → `Domains`
3. 구매한 도메인 추가
4. DNS 설정에 따라 A/CNAME 레코드 설정
5. SSL 인증서 자동 발급 확인

### 5-2. 카카오 로그인 도메인 업데이트
1. 커스텀 도메인으로 카카오 Redirect URI 업데이트
2. `NEXTAUTH_URL` 환경 변수도 새 도메인으로 업데이트

## 6. 테스트 체크리스트

배포 완료 후 다음 항목들을 확인해 주세요:

- [ ] 메인 페이지 정상 로드
- [ ] 카카오 로그인 동작
- [ ] 스테이 목록 페이지 표시
- [ ] 스테이 상세 페이지 이동
- [ ] 관리자 페이지 접근 (로그인 후)
- [ ] 예약 기능 테스트
- [ ] 모바일 반응형 확인

## 7. 다음 단계 개발 항목

기본 배포 완료 후 추가로 구현할 항목들:

1. **결제 시스템** - TossPayments 연동
2. **SMS 서비스** - 입실/퇴실 안내 문자 발송
3. **이메일 서비스** - 예약 확인 및 알림 메일
4. **이미지 업로드** - Supabase Storage 연동
5. **지도 서비스** - 네이버/구글 지도 API 연동
6. **검색 기능** - 지역/날짜/인원 기반 검색
7. **리뷰 시스템** - 별점 및 후기 작성
8. **푸시 알림** - 예약 상태 변경 알림

## 문의사항

설정 중 문제가 발생하면 언제든 말씀해 주세요. 각 단계별로 상세한 안내를 도와드리겠습니다.