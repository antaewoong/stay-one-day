# 멀티 디바이스 개발 워크플로 설정 가이드

## 1. Git 동기화 설정

### 자동 푸시/풀 설정
```bash
# 작업 시작 시 항상 실행
git pull origin main

# 작업 완료 시 항상 실행
git add .
git commit -m "Work in progress from [device-name]"
git push origin main
```

### Git 브랜치 전략
```bash
# 개인 작업 브랜치 생성
git checkout -b dev/macpro
git checkout -b dev/macbook

# 작업 완료 시 main으로 병합
git checkout main
git merge dev/[device-name]
git push origin main
```

## 2. 환경 동기화

### .env 파일 관리
- 각 디바이스에서 동일한 `.env.local` 파일 사용
- 민감한 정보는 1Password 등으로 동기화

### Node.js/npm 버전 통일
```bash
# Node.js 버전 확인 및 통일
node --version
npm --version

# nvm 사용 권장
nvm use 18
```

### 의존성 동기화
```bash
# 새 디바이스에서 프로젝트 시작 시
npm install
npm run build
```

## 3. VS Code 설정 동기화

### Settings Sync 사용
1. VS Code → Settings → Settings Sync 활성화
2. GitHub 계정으로 로그인
3. 확장 프로그램, 설정, 키바인딩 자동 동기화

### 필수 확장 프로그램
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- TypeScript Importer
- GitLens
- Prettier
- ESLint

## 4. 클라우드 백업

### GitHub
- 모든 코드 변경사항을 GitHub에 정기적으로 푸시
- Private repository 사용

### Vercel 자동 배포
- main 브랜치에 푸시 시 자동 배포
- 실시간 변경사항 확인 가능

## 5. 작업 전환 체크리스트

### Mac Pro → MacBook으로 전환
1. 현재 작업 커밋 및 푸시
2. MacBook에서 `git pull origin main`
3. `npm install` (필요시)
4. 환경변수 확인
5. 개발 서버 시작

### MacBook → Mac Pro로 전환
1. 현재 작업 커밋 및 푸시
2. Mac Pro에서 `git pull origin main`
3. 의존성 업데이트 확인
4. 개발 서버 재시작

## 6. 추천 도구

### 동기화 도구
- **iCloud Drive**: 환경설정 파일 동기화
- **Dropbox**: 큰 파일이나 빌드 결과물 공유
- **1Password**: API 키, 비밀번호 관리

### 개발 도구
- **GitHub Desktop**: GUI 기반 Git 관리
- **Sourcetree**: 고급 Git 작업용
- **Claude Code**: AI 기반 코드 작성 지원

## 7. 자동화 스크립트

### 작업 시작 스크립트 (start-work.sh)
```bash
#!/bin/bash
echo "Starting development work..."
git pull origin main
npm install
npm run dev
```

### 작업 완료 스크립트 (finish-work.sh)
```bash
#!/bin/bash
echo "Finishing development work..."
git add .
git commit -m "Work completed on $(hostname) - $(date)"
git push origin main
```

## 8. 트러블슈팅

### 충돌 해결
```bash
# 머지 충돌 시
git status
git add .
git commit
```

### 브랜치 동기화 문제
```bash
# 강제 리셋 (주의!)
git fetch origin
git reset --hard origin/main
```

이 워크플로를 따르면 두 디바이스 간 seamless한 개발이 가능합니다!