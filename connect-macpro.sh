#!/bin/bash

# 맥북에서 맥프로에 SSH 접속하는 스크립트

echo "🔗 맥프로 SSH 접속 스크립트"
echo ""

# 사용자 입력
read -p "맥프로 외부 IP 주소: " MACPRO_IP
read -p "맥프로 사용자명: " USERNAME

echo ""
echo "🔑 SSH 키 생성 (처음 한번만):"
echo "ssh-keygen -t rsa -b 4096 -f ~/.ssh/macpro_key"
echo ""

echo "🚀 SSH 접속 명령어:"
echo "ssh -i ~/.ssh/macpro_key $USERNAME@$MACPRO_IP"
echo ""

echo "📁 프로젝트 동기화:"
echo "scp -r -i ~/.ssh/macpro_key stay-oneday/ $USERNAME@$MACPRO_IP:~/Projects/"
echo ""

echo "🔧 원격 개발 서버 시작:"
echo "ssh -i ~/.ssh/macpro_key $USERNAME@$MACPRO_IP 'cd ~/Projects/stay-oneday && npm run dev'"