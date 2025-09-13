# StayOneDay FE 정리 점검용 체크리스트 (제출 템플릿)

> 아래 항목에 붙여넣기만 해도 제가 한 번에 전체 구조를 파악하고, **깨끗한 리팩터링 PR 스펙/디프**까지 만들어 드릴 수 있어요. 민감한 값은 꼭 마스킹 해주세요.

---

## 0) 공유 방법
- 이 문서에 그대로 **붙여넣기** 또는 **코드 블록**으로 제공
- 긴 파일은 중요한 부분만 먼저, 필요 시 전체
- **비밀 키/토큰은 삭제** 또는 `******` 처리

---

## 1) 프로젝트 스펙
- Node 버전: `v` 
- 패키지 매니저/버전: (npm/yarn/pnpm) 
- 주요 버전: Next.js, React, TypeScript, Tailwind, shadcn/ui
- `package.json` (dependencies/devDependencies) 일부 또는 전체

```
{
  "name": "stay-one-day",
  "scripts": { "dev": "next dev", "build": "next build", "start": "next start", "typecheck": "tsc --noEmit" },
  "dependencies": { /* ... */ },
  "devDependencies": { /* ... */ }
}
```

---

## 2) 실행/빌드 스크립트 & 현재 상태
- 로컬 실행 커맨드와 결과 로그 요약
- 빌드 커맨드(`next build`) 결과 요약 (에러/워닝 포함)

```
$ npm run dev
> 로그 일부...
```

```
$ npm run build
> 로그 일부...
```

---

## 3) 데이터 모델 (API ↔️ UI)
- **샘플 API 응답(현행)**: `/api/site/hero-slides` 또는 `/api/admin/hero-slides`
```json
{
  "ok": true,
  "data": [
    {
      "id": "...",
      "image_url": "...",
      "title": "...",
      "subtitle": "...",
      "cta_text": "...",
      "active": true,
      "slide_order": 0,
      "created_at": "..."
    }
  ]
}
```
- **다른 리스트(예: stays, amenities, tags) 샘플 응답**도 가능하면 첨부
- (선택) 기대하는 **UI 모델 스키마** (원하는 필드명/케이스)

---

## 4) 관련 소스 트리 (파일 리스트)
- 영항 범위만 대략
```
app/
  page.tsx
  api/
    site/hero-slides/route.ts (있으면)
    admin/hero-slides/route.ts
components/
  HeroSection.tsx
  StayCard.tsx
  ui/card.tsx
lib/
  supabaseClient.ts
  api.ts (있으면)
```

---

## 5) 핵심 파일 원문 (가능한 최신본)
- `components/HeroSection.tsx`
- `components/StayCard.tsx`
- `components/ui/card.tsx`
- `app/page.tsx`
- `app/api/site/hero-slides/route.ts` (있다면)
- 기타: 데이터 어댑터/훅/컨텍스트

> 길면 중요한 부분 위주로 먼저, 나머지는 필요 시 추가 공유

---

## 6) 비동기/상태 관리 패턴
- 데이터 패칭 방식 (fetch/SWR/React Query 등)
- 전역 상태 사용 여부 (Context/Zustand/Recoil 등)

---

## 7) 스타일/디자인 시스템
- Tailwind 설정(`tailwind.config`)
- shadcn/ui 컴포넌트 사용 유무 & 버전

---

## 8) 설정 파일
- `tsconfig.json` / `eslint` / `prettier` 주요 설정
- 린트/포맷 명령과 결과 (있으면 로그 일부)

---

## 9) 오류/콘솔 로그 묶음
- 최근 발생한 오류 스택 (이미 공유했던 것 외 추가분)
- 경고/워닝 (렌더 중 setState 등)

---

## 10) 스파게티/핵 처리 구간 (셀프 신고 😅)
- 임시 로직/카피페/중복/타입-any/무한조건 등 
- "여기 깔끔히 하고 싶다" 포인트

---

## 11) 기대 동작/UX 스펙
- Hero 슬라이더 동작(자동/도트/스와이프 등)
- StayCard 표시 규칙(태그/어메니티/가격 포맷)
- 공통 로딩/에러/빈 상태 UI 정책

---

## 12) 우선순위 & 마감
- P0/P1/P2 정리
- 선호하는 리팩터링 방향(예: 타입 우선, UI 우선 등)

---

## (선택) 진단 번들 명령 (결과 붙여넣기)
- 타입 체크: `npm run typecheck`
- 린트: `npm run lint`
- 사용 안 하는 파일/심볼: `npx ts-prune`
- 의존성 미사용/미기재: `npx depcheck`
- 순환 참조 확인: `npx madge --circular --extensions ts,tsx .`

```
$ npx ts-prune
> 결과 붙여넣기
```

```
$ npx madge --circular --extensions ts,tsx .
> 결과 붙여넣기
```

---

### 📌 다음 단계(제가 할 일)
1) 위 자료 확인 → **도메인 타입/어댑터/훅 구조 제안**
2) **불변식/Null-Safety/렌더-세트스테이트 금지** 패턴 반영
3) **일관된 네이밍 컨벤션(camelCase FE / snake_case DB)** 계약서 작성
4) 파일/폴더 구조 리오거나이즈 + 죽은 코드 제거 플랜
5) 최종: **리팩터링용 Diff/패치** 제공 (필요 시 단계별 PR 플랜 포함)
