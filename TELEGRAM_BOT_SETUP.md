# 텔레그램 봇 설정 가이드

## 🚀 초기 설정

### 1. 텔레그램 봇 생성
1. 텔레그램에서 [@BotFather](https://t.me/botfather) 검색
2. `/newbot` 명령어 실행
3. 봇 이름 설정: `Stay OneDay Admin Bot`
4. 봇 사용자명 설정: `stay_oneday_admin_bot` (또는 원하는 이름)
5. 봇 토큰 복사

### 2. 환경 변수 설정 (.env.local에 추가)

```bash
# 텔레그램 봇 설정
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret_here
TELEGRAM_ALLOWED_IPS=149.154.160.0/20,91.108.4.0/22  # 선택사항

# 웹훅 URL (배포 후 설정)
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/api/telegram/webhook
```

### 3. 데이터베이스 테이블 업데이트

관리자 테이블에 텔레그램 필드 추가:

```sql
-- admin_users 테이블에 텔레그램 필드 추가
ALTER TABLE admin_users 
ADD COLUMN telegram_chat_id BIGINT,
ADD COLUMN telegram_username TEXT,
ADD COLUMN telegram_first_name TEXT;

-- 보안 로그 테이블 생성
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 접근 가능하도록 RLS 정책 생성
CREATE POLICY "admin_only_security_logs" ON security_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );
```

## 🔧 사용법

### 관리자 등록 프로세스

#### 1단계: 웹 관리자 페이지에서 토큰 생성
```javascript
// 관리자 페이지에서
POST /api/admin/telegram/register
{
  "targetAdminEmail": "admin@example.com"
}
```

#### 2단계: 텔레그램에서 봇 등록
1. 텔레그램에서 봇 검색 후 시작
2. `/start` - 봇 시작
3. `/register_token [토큰]` - 등록 토큰으로 인증

### 사용 가능한 명령어

#### 🔰 기본 명령어
- `/start` - 봇 시작 및 환영 메시지
- `/help` - 명령어 도움말

#### 📊 조회 명령어 (관리자 전용)
- `/stats` - 전체 시스템 통계
- `/bookings [개수]` - 최근 예약 현황
- `/hosts` - 호스트 목록 및 상태
- `/influencers` - 인플루언서 현황
- `/revenue` - 매출 요약

#### ⚙️ 관리 명령어 (관리자 전용)
- `/approve [host_id]` - 호스트 승인
- `/block [user_id]` - 사용자 차단
- `/backup` - DB 백업 실행

## 🔒 보안 기능

### RLS 정책 준수
- 모든 데이터베이스 작업은 Admin Service를 통해 RLS 우회
- 관리자만 텔레그램 봇에 접근 가능
- 세션 기반 인증으로 보안 강화

### 보안 로그
- 모든 접근 시도 기록
- 명령어 사용 로그
- 실패한 인증 시도 추적
- 비상시 모든 세션 무효화 가능

### 웹훅 보안
- 시크릿 토큰 검증
- IP 화이트리스트 (선택사항)
- 요청 서명 검증

## 🚨 비상 조치

### 모든 세션 무효화
```bash
DELETE /api/admin/telegram/register?emergency=true
```

### 특정 세션 종료
```bash
DELETE /api/admin/telegram/register?chatId=123456789
```

## 📈 모니터링

### 활성 세션 조회
```bash
GET /api/admin/telegram/register
```

### 로그 확인
- `security_logs` 테이블에서 모든 보안 이벤트 추적
- `admin_activity_logs` 테이블에서 관리자 활동 추적

## 🎯 실시간 알림 설정

봇이 자동으로 다음 상황에서 관리자들에게 알림을 전송합니다:

- 새로운 예약/취소
- 호스트 가입 요청
- 시스템 오류
- 중요한 업데이트

## 🔧 개발 모드 테스트

```bash
# 개발 서버 실행
npm run dev

# ngrok으로 로컬 서버 외부 노출 (테스트용)
ngrok http 3000

# 웹훅 URL 설정
curl -X POST "https://api.telegram.org/bot[BOT_TOKEN]/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://your-ngrok-url.ngrok.io/api/telegram/webhook"}'
```

## ⚠️ 주의사항

1. **프로덕션 환경에서는 HTTPS 필수**
2. **봇 토큰은 절대 노출 금지**
3. **정기적인 보안 로그 검토**
4. **관리자 계정 정기 감사**
5. **비상시 즉시 모든 세션 무효화**