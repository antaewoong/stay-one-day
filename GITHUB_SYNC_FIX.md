# GitHub 동기화 문제 해결 가이드

## 현재 상황 분석
- Git 리모트가 정상적으로 설정됨: `https://github.com/antaewoong/stay-one-day.git`
- 최근 커밋들이 로컬에 존재
- GitHub 업로드 시 HTTP 500 에러 발생

## 해결 방법

### 1. GitHub 인증 문제 해결

#### Personal Access Token 생성
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)" 클릭
3. 권한 선택:
   - `repo` (전체 저장소 접근)
   - `workflow` (GitHub Actions)
   - `write:packages` (패키지 게시용)

#### 토큰으로 인증 설정
```bash
# 기존 credential 삭제
git config --global --unset credential.helper

# 새 credential helper 설정 (macOS)
git config --global credential.helper osxkeychain

# 또는 토큰 직접 사용
git remote set-url origin https://[USERNAME]:[TOKEN]@github.com/antaewoong/stay-one-day.git
```

### 2. 대체 업로드 방법

#### 방법 1: SSH 키 사용
```bash
# SSH 키 생성
ssh-keygen -t ed25519 -C "your-email@example.com"

# GitHub에 SSH 키 등록 후
git remote set-url origin git@github.com:antaewoong/stay-one-day.git
git push origin main
```

#### 방법 2: GitHub CLI 사용
```bash
# GitHub CLI 설치
brew install gh

# 인증
gh auth login

# 푸시
gh repo sync
```

#### 방법 3: 강제 푸시
```bash
# 현재 상태 백업
git bundle create backup.bundle HEAD

# 강제 푸시 (주의!)
git push --force origin main
```

### 3. 정기적 동기화 자동화

#### Git Hook 설정
```bash
# .git/hooks/post-commit 파일 생성
#!/bin/sh
echo "Auto-pushing to GitHub..."
git push origin main || echo "Push failed, will retry later"
```

#### 자동 백업 스크립트
```bash
#!/bin/bash
# backup-to-github.sh

echo "Starting backup process..."
git add -A
git commit -m "Auto backup - $(date +'%Y-%m-%d %H:%M:%S')"

# 여러 방법으로 푸시 시도
git push origin main || \
gh repo sync || \
echo "All push methods failed. Manual intervention needed."
```

### 4. 문제 진단 명령어

```bash
# 네트워크 연결 확인
curl -I https://api.github.com

# Git 구성 확인
git config --list --show-origin

# 원격 저장소 상태 확인
git ls-remote origin

# 자세한 에러 로그
GIT_CURL_VERBOSE=1 git push origin main
```

### 5. 대용량 파일 문제 해결

```bash
# 대용량 파일 확인
find . -size +100M -not -path "./.git/*"

# Git LFS 설정
git lfs install
git lfs track "*.zip" "*.tar.gz" "*.mp4"
git add .gitattributes
```

### 6. 응급 상황 대응

#### 로컬 백업
```bash
# 현재 상태 완전 백업
cp -r . ../stay-oneday-backup-$(date +%Y%m%d)
```

#### 수동 업로드
1. GitHub 웹사이트에서 "Upload files" 사용
2. ZIP 파일로 압축해서 업로드
3. 새 저장소 생성 후 이전

### 7. 향후 예방책

#### 정기 점검
```bash
# 주간 점검 스크립트
git fsck
git gc --prune=now
git remote update
```

#### 브랜치 전략
```bash
# 작업 브랜치 사용
git checkout -b backup-$(date +%Y%m%d)
git push origin backup-$(date +%Y%m%d)
```

이 방법들을 순서대로 시도하면 GitHub 동기화 문제를 해결할 수 있습니다.