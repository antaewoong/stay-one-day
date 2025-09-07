#!/bin/bash

# 멀티 디바이스 개발 시작 스크립트
echo "🚀 멀티 디바이스 개발 환경 시작..."

# 1. 최신 코드 가져오기
echo "📥 최신 코드 가져오는 중..."
git fetch origin
git checkout main
git pull origin main

# 2. 개발 브랜치 생성 또는 전환
DEVICE_NAME=$(hostname)
BRANCH_NAME="dev-${DEVICE_NAME}-$(date +%Y%m%d)"

if git show-ref --verify --quiet refs/heads/$BRANCH_NAME; then
    echo "🔄 기존 브랜치 전환: $BRANCH_NAME"
    git checkout $BRANCH_NAME
else
    echo "🌿 새 브랜치 생성: $BRANCH_NAME"
    git checkout -b $BRANCH_NAME
fi

# 3. 포트 정리
echo "🧹 포트 정리 중..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# 4. 의존성 설치
echo "📦 의존성 확인 중..."
npm install

# 5. 개발 서버 시작
echo "🎯 개발 서버 시작..."
echo "브랜치: $BRANCH_NAME"
echo "로컬 주소: http://localhost:3000"
echo ""
echo "✅ 개발 환경 준비 완료!"

npm run dev