# ADMIN API 가이드라인 (Guardrails)

> **목표**: 관리자(Admin) API에서 인증/권한/데이터 일관성을 보장하고
> “복제·중복·권한 오류·500 폭탄”을 원천 차단한다.

---

## 1) 인증·권한 원칙

- **단일 원칙**: 모든 Admin API는 **`withAdminAuth` 미들웨어**를 통과해야 한다.
- **Service Role**: 서버 사이드 데이터 조작은 **Service Role 키**로만 수행한다.
  - `createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)`
  - 절대 **ANON 키**나 **클라이언트 측 키**로 쓰기 금지.
- **런타임 고정**: Next Route Handlers 상단에 아래를 선언한다.
  ```ts
  export const runtime = 'nodejs'
  export const dynamic = 'force-dynamic'
  ```
- **토큰/세션 일관성**
  - 새로운 `assertAdmin` 과거 `withAdminAuth`가 **중복/충돌**하지 않도록, **하나만 사용**.
  - 세션은 **쿠키·Bearer 혼용 금지**. (미들웨어에서 단일 방식으로 해석)

---

## 2) 메서드 계약 (Method Contracts)

### 2.1 컬렉션 단위 업데이트
- **PUT = 전체 교체(Idempotent Replace)**:
  - 컬렉션(예: hero_slides) 저장은 **항상 배열 전량 교체**.
  - 동일 요청 2회 호출 시 **결과가 동일**(멱등성 보장).
  - 부분 업데이트 필요 시에도 서버에서 **전체 유효성 검증** 후 저장.

- **POST = 새 레코드 단건 생성**만 허용.
  - **배열 POST 금지**. 배열 POST는 **405(Method Not Allowed)** 반환.

- **DELETE/INSERT 분리 금지**:
  - 중간 실패 시 데이터 유실 가능 → **트랜잭션(원자성)** 확보.
  - Supabase(Postgres)에서는 **단일 RPC/업서트** 또는 **idempotent replace** 패턴으로 처리.

### 2.2 스키마 검증
- 모든 API는 최소 필수 필드 검증을 수행한다.
  - 예) `hero_slides`의 `image_url`은 **필수**. 없으면 **400** 반환.
- **프론트 임시 ID 금지**: DB의 실제 ID를 사용하지 않는다면 **ID 분기 로직을 제거**하고 **전량 교체**로 단순화.

---

## 3) DB 레벨 안전장치

> **DB 제약이 최후의 안전망**. API/프론트 실수로도 **물리적 복제 차단**.

### 3.1 즉시 적용(1단계) – 최소 유니크 제약
```sql
ALTER TABLE public.hero_slides
ADD CONSTRAINT hero_slides_slide_order_unique UNIQUE (slide_order);
```
- **장점**: 바로 적용 가능, 복제 폭주 차단.
- **영향**: 기존 코드 변경 없음.

### 3.2 안정화 후(2단계) – 정교한 위치 제약(옵션)
```sql
-- 페이지/언어별 위치 고유성
ALTER TABLE public.hero_slides 
ADD COLUMN IF NOT EXISTS page_key TEXT DEFAULT 'home',
ADD COLUMN IF NOT EXISTS locale   TEXT DEFAULT 'ko-KR',
ADD CONSTRAINT hero_slides_unique_position UNIQUE (page_key, locale, slide_order);
```
- 페이지(예: home, search), 언어별로 슬라이드 포지션을 고정.
- 다국어·다페이지 확장에 유리.

---

## 4) 에러 포맷 표준

```json
{
  "ok": false,
  "error": "이미지 URL은 필수입니다.",
  "code": "BAD_REQUEST",
  "hint": "image_url 필드를 채워서 보내세요."
}
```
- **HTTP 코드**: 400/401/403/404/409/422/500 명확하게 사용.
- **로그**: 서버 로그에는 **원인(stack/SQL state)** 를 상세히, 응답에는 **최소 정보**.

---

## 5) 스모크 테스트(수동/자동)

### 5.1 컬렉션 PUT 멱등성
- 동일 배열을 **2번 연속 PUT** → **레코드 수/내용 동일**해야 함.
- POST(배열) 호출 시 **405** 반환 확인.

### 5.2 예시 cURL

```bash
# 1) 잘못된 POST(배열) → 405
curl -i -X POST http://localhost:3000/api/admin/hero-slides \
  -H "Content-Type: application/json" \
  -d '[{"image_url":"a.jpg","title":"A","slide_order":1}]'

# 2) 올바른 PUT(전량 교체) → 200
curl -i -X PUT http://localhost:3000/api/admin/hero-slides \
  -H "Content-Type: application/json" \
  -d '[{"image_url":"a.jpg","title":"A","slide_order":1}]'

# 3) 다시 같은 PUT(멱등성) → 레코드 수 동일
curl -i -X PUT http://localhost:3000/api/admin/hero-slides \
  -H "Content-Type: application/json" \
  -d '[{"image_url":"a.jpg","title":"A","slide_order":1}]'
```

---

## 6) PR 체크리스트

- [ ] **withAdminAuth**만 사용(다른 가드/미들웨어 제거)
- [ ] 런타임 선언: `runtime='nodejs'`, `dynamic='force-dynamic'`
- [ ] **Service Role** 클라이언트만 쓰기 권한
- [ ] **PUT=전량 교체**, **배열 POST=405**
- [ ] **필수 필드 검증**(예: image_url)
- [ ] **DB 유니크 제약** 확인(hero_slides)
- [ ] 에러 포맷/HTTP 코드 일관성
- [ ] **스모크 테스트** 결과 스크린샷 첨부
- [ ] QA/QC 시트 링크 첨부(API_AUDIT_CHECKLIST)

---

## 7) 클로드 전달용 요약 (복붙)

> **반드시 지켜야 할 7줄**  
1) Admin API는 **withAdminAuth**만 사용.  
2) 데이터 쓰기는 **Service Role**로만.  
3) **PUT=배열 전량 교체(멱등)**, **배열 POST=405**.  
4) 프론트 임시 ID로 분기하지 말고 **전량 교체**로 단순화.  
5) **image_url 등 필수 검증** 없으면 **400**.  
6) DB에 **유니크 제약(슬라이드 순서)** 추가해 물리적 복제 차단.  
7) PR에 **스모크 테스트 결과/QA시트** 첨부.

---

## 8) 참고 구현 스니펫 (TypeScript)

```ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { withAdminAuth } from '@/middleware/withAdminAuth'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = new createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST 차단
export const POST = withAdminAuth(async () => {
  return NextResponse.json(
    { ok: false, error: '배열 POST는 허용되지 않습니다.' },
    { status: 405 }
  )
})

// PUT 전량 교체 (멱등)
export const PUT = withAdminAuth(async (req) => {
  const body = await req.json()
  if (!Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: '배열 형태여야 합니다.' }, { status: 400 })
  }

  // 필수 검증
  for (const s of body) {
    if (!s?.image_url) {
      return NextResponse.json({ ok: false, error: '이미지 URL은 필수입니다.' }, { status: 400 })
    }
    if (typeof s.slide_order !== 'number') {
      return NextResponse.json({ ok: false, error: 'slide_order는 숫자이어야 합니다.' }, { status: 400 })
    }
  }

  // 멱등: 전량 교체 전략
  // 1) 기존 행 삭제
  const { error: delErr } = await supabaseAdmin.from('hero_slides').delete().gt('id', 0)
  if (delErr) {
    console.error('DELETE failed', delErr)
    return NextResponse.json({ ok: false, error: '삭제 실패' }, { status: 500 })
  }

  // 2) 새 행 삽입
  const { error: insErr } = await supabaseAdmin.from('hero_slides').insert(body)
  if (insErr) {
    console.error('INSERT failed', insErr)
    // 유니크 제약이 있으면 409로 전달
    return NextResponse.json({ ok: false, error: '삽입 실패', code: 'CONFLICT' }, { status: 409 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
})
```

---

## 9) 운영 팁

- **배포 전**: 스모크 테스트 + DB 제약 적용 여부 확인.
- **배포 후**: 레코드 수 알림(예: hero_slides 0/초과 감시), 400/409 비율을 그래프로 모니터링.
- **장기적으로**: 2단계(페이지/언어별 위치 제약)로 확장.
