#!/bin/bash

# iCloud에서 동기화 받기 스크립트
ICLOUD_PATH="$HOME/Library/Mobile Documents/com~apple~CloudDocs/Development"
PROJECT_NAME="stay-oneday"
CURRENT_DIR=$(pwd)

echo "📥 iCloud에서 동기화 받는 중..."

# 1. iCloud 프로젝트 존재 확인
if [ ! -d "$ICLOUD_PATH/$PROJECT_NAME" ]; then
    echo "❌ iCloud에 프로젝트가 없습니다."
    echo "먼저 다른 기기에서 sync-to-icloud.sh를 실행하세요."
    exit 1
fi

# 2. 기존 프로젝트 백업
if [ -d "$CURRENT_DIR" ]; then
    mv "$CURRENT_DIR" "${CURRENT_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
    echo "🔄 기존 프로젝트를 백업했습니다."
fi

# 3. iCloud에서 복사
cp -R "$ICLOUD_PATH/$PROJECT_NAME" "$CURRENT_DIR"
cd "$CURRENT_DIR"

# 4. Git 저장소 다시 연결
git init
git remote add origin https://github.com/antaewoong/stay-one-day.git

# 5. 최신 코드 가져오기
git fetch origin
if [ -f ".current-branch" ]; then
    BRANCH=$(cat .current-branch)
    git checkout -b "$BRANCH" "origin/$BRANCH" 2>/dev/null || git checkout main
    echo "🌿 브랜치 복원: $BRANCH"
fi

# 6. 패키지 설치
npm install

echo "✅ iCloud 동기화 완료!"
echo "🚀 개발 서버 시작: npm run dev"