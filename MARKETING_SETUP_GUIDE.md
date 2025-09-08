# 🎯 실전 마케팅 분석 시스템 구축 가이드

## 1️⃣ 필수 계정 및 서비스 준비

### Google Analytics 4 (GA4)
```bash
# 1. Google Analytics 계정 생성 (https://analytics.google.com)
# 2. 새 속성 만들기 → 웹사이트 선택
# 3. 측정 ID 복사 (G-XXXXXXXXXX 형태)
```

### Google Tag Manager (GTM)
```bash
# 1. Google Tag Manager 계정 생성 (https://tagmanager.google.com)
# 2. 컨테이너 만들기 → 웹 선택
# 3. 컨테이너 ID 복사 (GTM-XXXXXXX 형태)
```

### Google Search Console
```bash
# 1. Google Search Console 등록 (https://search.google.com)
# 2. 도메인/URL 속성 추가
# 3. 소유권 확인 (DNS 또는 HTML 파일)
```

### Slack 웹훅 (자동화 리포트용)
```bash
# 1. Slack 워크스페이스에서 Apps → Incoming Webhooks 검색
# 2. 채널 선택 후 웹훅 URL 생성
# 3. 웹훅 URL 저장 (https://hooks.slack.com/services/...)
```

---

## 2️⃣ 환경변수 설정

`.env.local` 파일에 추가:
```bash
# Google Analytics & GTM
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_CONTAINER_ID=GTM-XXXXXXX

# 🎯 Google Ads API (디멘드젠 필수)
GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token
GOOGLE_ADS_CLIENT_ID=your-client-id.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=your-client-secret
GOOGLE_ADS_REFRESH_TOKEN=your-refresh-token
GOOGLE_ADS_CUSTOMER_ID=123-456-7890

# Google Search Console API
GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SEARCH_CONSOLE_PROPERTY_URL=https://yourdomain.com

# 🤖 OpenAI API (AI 디멘드젠용)
OPENAI_API_KEY=sk-...

# Slack 웹훅
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SLACK_CHANNEL=#marketing

# IP 지오로케이션 (선택사항)
IP_GEOLOCATION_API_KEY=your-ipapi-key

# Metabase 연동 (선택사항)
METABASE_URL=http://localhost:3000
METABASE_API_KEY=your-metabase-api-key

# Looker Studio 연동용 서비스 계정
LOOKER_STUDIO_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
LOOKER_STUDIO_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## 3️⃣ Supabase 테이블 생성

Supabase 대시보드에서 SQL Editor로 실행:

```sql
-- 웹 세션 추적 테이블
CREATE TABLE IF NOT EXISTS web_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 유입 정보
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    referrer TEXT,
    landing_page TEXT,
    
    -- 세션 정보
    ip_address INET,
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    country TEXT,
    city TEXT,
    
    -- 행동 데이터
    page_views INTEGER DEFAULT 1,
    duration_seconds INTEGER DEFAULT 0,
    bounced BOOLEAN DEFAULT false,
    converted BOOLEAN DEFAULT false,
    conversion_value DECIMAL(10,2),
    
    -- GA4 연동
    ga_client_id TEXT,
    ga_session_id TEXT,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 이벤트 추적 테이블
CREATE TABLE IF NOT EXISTS marketing_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 이벤트 정보
    event_name TEXT NOT NULL,
    event_category TEXT,
    event_action TEXT,
    event_label TEXT,
    event_value DECIMAL(10,2),
    
    -- 페이지 정보
    page_url TEXT,
    page_title TEXT,
    
    -- 추가 데이터
    custom_parameters JSONB,
    
    FOREIGN KEY (session_id) REFERENCES web_sessions(session_id)
);

-- 예약 전환 추적 테이블
CREATE TABLE IF NOT EXISTS booking_conversions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reservation_id UUID NOT NULL,
    session_id TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 유입 정보
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    referrer TEXT,
    
    -- 예약 정보
    accommodation_id UUID REFERENCES accommodations(id),
    booking_amount DECIMAL(10,2),
    guest_email TEXT,
    guest_phone TEXT,
    guest_name TEXT,
    
    -- 여정 추적
    first_visit_at TIMESTAMP WITH TIME ZONE,
    booking_at TIMESTAMP WITH TIME ZONE,
    journey_duration_minutes INTEGER,
    touchpoints_count INTEGER,
    
    -- GA4 연동
    ga_transaction_id TEXT,
    ga_client_id TEXT
);

-- 캠페인 성과 추적 테이블
CREATE TABLE IF NOT EXISTS campaign_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    
    -- 캠페인 정보
    utm_source TEXT NOT NULL,
    utm_medium TEXT NOT NULL,
    utm_campaign TEXT,
    
    -- 성과 지표
    sessions INTEGER DEFAULT 0,
    users INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2),
    avg_session_duration INTEGER,
    
    -- 전환 지표
    conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2),
    revenue DECIMAL(10,2) DEFAULT 0,
    cost_per_acquisition DECIMAL(10,2),
    return_on_ad_spend DECIMAL(5,2),
    
    -- 광고비
    ad_spend DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(date, utm_source, utm_medium, utm_campaign)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_web_sessions_created_at ON web_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_web_sessions_utm_source ON web_sessions(utm_source);
CREATE INDEX IF NOT EXISTS idx_web_sessions_session_id ON web_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_marketing_events_session_id ON marketing_events(session_id);
CREATE INDEX IF NOT EXISTS idx_marketing_events_event_name ON marketing_events(event_name);
CREATE INDEX IF NOT EXISTS idx_booking_conversions_created_at ON booking_conversions(created_at);
CREATE INDEX IF NOT EXISTS idx_campaign_performance_date ON campaign_performance(date);
```

---

## 4️⃣ NPM 패키지 설치

```bash
# 🎯 구글 디멘드젠 핵심 패키지
npm install google-ads-api openai

# 추적 및 분석 라이브러리
npm install @google-analytics/data googleapis google-auth-library

# 차트 및 시각화
npm install recharts date-fns chart.js react-chartjs-2

# 유틸리티
npm install ua-parser-js axios

# 타입스크립트 타입 정의
npm install -D @types/ua-parser-js @types/google-analytics
```

---

## 5️⃣ Google Search Console API 설정

### 서비스 계정 생성:
1. Google Cloud Console → IAM 및 관리자 → 서비스 계정
2. 서비스 계정 만들기 → JSON 키 다운로드
3. Search Console에서 해당 서비스 계정 이메일을 사용자로 추가

### 키 파일을 환경변수로 변환:
```bash
# JSON 키 파일 내용을 .env.local에 추가
GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL="service-account@project.iam.gserviceaccount.com"
GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
YOUR_PRIVATE_KEY_HERE
-----END PRIVATE KEY-----"
```

---

## 6️⃣ MCP (Claude Code) 설정

### Google Analytics MCP 추가 (선택사항):
```json
{
  "name": "google-analytics",
  "command": "npx",
  "args": ["@modelcontextprotocol/server-google-analytics"],
  "env": {
    "GOOGLE_ANALYTICS_PROPERTY_ID": "properties/XXXXXXXXX",
    "GOOGLE_ANALYTICS_CREDENTIALS": "{\"client_email\":\"...\",\"private_key\":\"...\"}"
  }
}
```

---

## 7️⃣ 시각화 도구 설치

### Metabase (로컬 설치):
```bash
# Docker로 Metabase 실행
docker run -d -p 3000:3000 --name metabase metabase/metabase

# 또는 JAR 파일로 실행
java -jar metabase.jar
```

### Looker Studio 연동:
1. 서비스 계정 키로 Supabase 데이터베이스 연결
2. PostgreSQL 커넥터 사용하여 데이터 소스 추가
3. 대시보드 템플릿 제작

---

## 8️⃣ 자동화 스크립트 설정

### 일일 리포트 cron 작업:
```bash
# crontab -e로 편집
# 매일 오전 9시에 리포트 실행
0 9 * * * node /path/to/your/project/scripts/daily-report.js
```

### Vercel/Netlify cron 작업:
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/reports/daily",
      "schedule": "0 9 * * *"
    }
  ]
}
```

---

## 9️⃣ 사용자가 직접 해야 할 작업

### ✅ 즉시 설정 필요:
1. **Google Analytics 4 계정 생성**
   - 속성 ID 복사하여 `.env.local`에 추가
   
2. **Slack 웹훅 URL 생성**
   - 웹훅 URL을 `.env.local`에 추가

3. **Supabase에서 SQL 실행**
   - 위의 테이블 생성 SQL을 Supabase 대시보드에서 실행

### 📋 단계별 설정:
1. **1단계 (기본 추적)**: GA4 + 웹 추적 테이블
2. **2단계 (고급 분석)**: Search Console API + 시각화 도구
3. **3단계 (자동화)**: Slack 알림 + 일일 리포트

### 🔧 선택사항:
- Metabase 설치 (고급 데이터 분석용)
- IP 지오로케이션 API (위치 기반 분석)
- Google Ads API (광고 성과 연동)

---

## 🚀 실행 순서

1. `.env.local` 환경변수 설정
2. NPM 패키지 설치
3. Supabase 테이블 생성
4. GA4 측정 코드 추가
5. 추적 코드 배포 및 테스트
6. 시각화 대시보드 구축
7. 자동화 리포트 설정

---

## 📊 기대 효과

- **실시간 마케팅 성과 추적**
- **ROI 기반 광고비 최적화**
- **고객 여정 분석을 통한 전환율 개선**
- **자동화된 성과 리포팅**
- **데이터 기반 마케팅 의사결정**

이 설정을 완료하면 실제 마케팅 에이전시 수준의 분석 시스템을 구축할 수 있습니다!