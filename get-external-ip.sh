#!/bin/bash

echo "🔍 맥프로 외부 IP 주소 확인 중..."

# 외부 IP 확인
EXTERNAL_IP=$(curl -s ifconfig.me)
echo "🌐 외부 IP: $EXTERNAL_IP"

# 내부 IP 확인  
INTERNAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo "🏠 내부 IP: $INTERNAL_IP"

# 라우터 게이트웨이 확인
GATEWAY=$(route -n get default | grep gateway | awk '{print $2}')
echo "🌉 라우터 게이트웨이: $GATEWAY"

echo ""
echo "📝 포트포워딩 설정이 필요합니다:"
echo "   라우터 관리자 페이지: http://$GATEWAY"
echo "   포트 22 → $INTERNAL_IP:22 포워딩 설정"