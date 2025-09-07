#!/bin/bash

# 멀티 디바이스 개발 저장 스크립트
echo "💾 현재 작업 저장 중..."

# 1. 현재 브랜치 확인
CURRENT_BRANCH=$(git branch --show-current)
DEVICE_NAME=$(hostname)
TIMESTAMP=$(date +'%Y-%m-%d %H:%M')

echo "현재 브랜치: $CURRENT_BRANCH"
echo "디바이스: $DEVICE_NAME"

# 2. 변경사항 확인
if [[ -z $(git status --porcelain) ]]; then
    echo "⚠️  저장할 변경사항이 없습니다."
    exit 0
fi

# 3. 변경사항 추가
echo "📝 변경사항 추가 중..."
git add .

# 4. 커밋 메시지 생성
COMMIT_MSG="WIP: $TIMESTAMP on $DEVICE_NAME

- 작업 진행 중인 내용 자동 저장
- 디바이스: $DEVICE_NAME  
- 브랜치: $CURRENT_BRANCH"

# 5. 커밋
git commit -m "$COMMIT_MSG"

# 6. 원격에 푸시
echo "☁️  GitHub에 업로드 중..."
git push origin $CURRENT_BRANCH

echo "✅ 작업 저장 완료!"
echo "다른 디바이스에서 다음 명령어로 동기화:"
echo "git fetch && git checkout $CURRENT_BRANCH && git pull"