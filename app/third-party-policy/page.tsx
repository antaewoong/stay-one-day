'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Shield, Users, CreditCard, Bell, Info } from 'lucide-react'
import Header from '@/components/header'

export default function ThirdPartyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/auth/login" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            로그인으로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">제3자 정보제공 동의</h1>
          <p className="text-gray-600 mt-2">숙박 예약 및 서비스 제공을 위한 제3자 정보 제공에 관한 사항입니다.</p>
        </div>

        <div className="space-y-8">
          <section>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">제3자 정보제공 개요</h2>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    Stay One Day는 원활한 숙박 서비스 제공을 위해 아래와 같이 개인정보를 제3자에게 제공합니다.
                  </p>
                  <div className="bg-blue-100 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <Info className="w-5 h-5 text-blue-600" />
                      <p className="text-sm text-blue-800 font-medium">
                        이 항목은 선택사항이며, 동의하지 않아도 기본 서비스 이용이 가능합니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">정보를 제공받는 자 및 목적</h2>
            
            <div className="grid gap-6">
              {/* 숙박업체 카드 */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">숙박업체 (호스트)</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">제공목적</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• 예약 확인 및 체크인</li>
                          <li>• 고객 서비스 제공</li>
                          <li>• 비상 연락</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">제공항목</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• 이름</li>
                          <li>• 연락처</li>
                          <li>• 예약정보</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">보유기간</h4>
                        <p className="text-sm text-gray-600">체크아웃 후 1년</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 결제대행업체 카드 */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">결제대행업체</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">제공목적</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• 결제 처리</li>
                          <li>• 환불 처리</li>
                          <li>• 부정결제 방지</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">제공항목</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• 이름</li>
                          <li>• 결제정보</li>
                          <li>• 예약정보</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">보유기간</h4>
                        <p className="text-sm text-gray-600">결제완료 후 5년</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 알림 서비스 업체 카드 */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">알림 서비스 업체</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">제공목적</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• SMS/이메일 발송</li>
                          <li>• 예약 안내</li>
                          <li>• 마케팅 정보 제공</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">제공항목</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• 연락처</li>
                          <li>• 이메일</li>
                          <li>• 이름</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">보유기간</h4>
                        <p className="text-sm text-gray-600">서비스 탈퇴 시까지</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. 정보제공 거부권 및 불이익</h2>
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-3">
                <strong>동의 거부권:</strong> 귀하는 개인정보의 제3자 제공에 대해 동의를 거부할 권리가 있습니다.
              </p>
              <p className="text-gray-700">
                <strong>동의 거부 시 제한사항:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-2 ml-4">
                <li>숙박업체와의 직접 소통에 제한이 있을 수 있습니다</li>
                <li>예약 관련 SMS/이메일 알림을 받을 수 없습니다</li>
                <li>마케팅 정보 및 할인 혜택 안내를 받을 수 없습니다</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. 개인정보 처리 위탁</h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                Stay One Day는 서비스 품질 향상과 업무 효율성을 위해 아래와 같이 개인정보 처리를 위탁하고 있습니다:
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-3 text-left">위탁업체</th>
                      <th className="border border-gray-300 p-3 text-left">위탁업무</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-3">AWS, Supabase</td>
                      <td className="border border-gray-300 p-3">클라우드 인프라 및 데이터베이스 서비스</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 p-3">Vercel</td>
                      <td className="border border-gray-300 p-3">웹사이트 호스팅 서비스</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3">카카오</td>
                      <td className="border border-gray-300 p-3">소셜 로그인 인증 서비스</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. 연락처</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2">
                개인정보 제3자 제공에 관한 문의사항이 있으시면 아래로 연락주시기 바랍니다:
              </p>
              <div className="text-sm text-gray-600">
                <p>• 이메일: privacy@stayoneday.com</p>
                <p>• 전화: 1588-0000</p>
                <p>• 운영시간: 평일 09:00-18:00</p>
              </div>
            </div>
          </section>

          <div className="text-center pt-8">
            <Link href="/auth/login">
              <Button className="px-8">
                로그인으로 돌아가기
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}