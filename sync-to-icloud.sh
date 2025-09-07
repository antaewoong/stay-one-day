#!/bin/bash

# iCloud 동기화 스크립트
ICLOUD_PATH="$HOME/Library/Mobile Documents/com~apple~CloudDocs/Development"
PROJECT_NAME="stay-oneday"
CURRENT_DIR=$(pwd)

echo "🍎 iCloud 동기화 시작..."

# 1. iCloud 폴더 생성
mkdir -p "$ICLOUD_PATH/$PROJECT_NAME"

# 2. 필수 파일들만 동기화 (용량 최적화)
rsync -av --exclude='.git' \
          --exclude='node_modules' \
          --exclude='.next' \
          --exclude='*.log' \
          --exclude='.DS_Store' \
          --exclude='public/images' \
          "$CURRENT_DIR/" "$ICLOUD_PATH/$PROJECT_NAME/"

# 3. 환경설정 파일 복사
cp .env.local "$ICLOUD_PATH/$PROJECT_NAME/.env.local" 2>/dev/null || true

# 4. 현재 브랜치 정보 저장
git branch --show-current > "$ICLOUD_PATH/$PROJECT_NAME/.current-branch"
git log -1 --pretty=format:"%H %s" > "$ICLOUD_PATH/$PROJECT_NAME/.latest-commit"

echo "✅ iCloud 동기화 완료!"
echo "📁 iCloud 경로: $ICLOUD_PATH/$PROJECT_NAME"
echo "🌿 현재 브랜치: $(cat $ICLOUD_PATH/$PROJECT_NAME/.current-branch)"