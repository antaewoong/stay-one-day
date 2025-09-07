'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPage() {
  const [openSections, setOpenSections] = useState<string[]>(['overview'])

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" />
              홈으로
            </Link>
            <div className="text-lg font-light tracking-tight">
              stay<span className="font-medium">oneday</span>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">개인정보처리방침</h1>
        
        <div className="space-y-3">
          {/* 아코디언 형태로 주요 조항들을 그룹화 */}
          
          {[
            {
              id: 'overview',
              title: '개요 및 개인정보 처리목적',
              content: (
                <div className="space-y-6">
                  <div>
                    <p className="leading-relaxed text-sm mb-6">
                      주식회사 누크랩스(이하 "회사"라 함)는 개인정보보호법 등 관련 법령상의 개인정보보호 규정을 준수하며, 관련 법령에 의거한 개인정보처리방침을 정하여 이용자의 권익 보호에 최선을 다하고 있습니다.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">제 1 조 (개인정보의 처리목적)</h3>
                    <p className="leading-relaxed mb-3 text-sm">회사는 다음의 목적을 위하여 개인정보를 처리합니다.</p>
                    <ol className="list-decimal list-inside space-y-2 pl-4 text-sm">
                      <li>회원 가입 및 관리: 회원 가입의사 확인, 회원제 서비스 제공, 본인확인, 불량회원의 부정 이용 방지</li>
                      <li>숙박 예약 서비스 제공: 예약 확인, 숙박시설 이용, 요금 결제 및 정산, 고객상담</li>
                      <li>마케팅 및 광고에 활용: 이벤트 및 광고성 정보 제공, 맞춤형 서비스 제공</li>
                      <li>민원사무 처리: 민원인의 신원 확인, 민원사항 확인, 사실조사를 위한 연락·통지</li>
                    </ol>
                  </div>
                </div>
              )
            },
            {
              id: 'retention',
              title: '개인정보 보유기간 및 처리항목',
              content: (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">제 2 조 (개인정보의 처리 및 보유기간)</h3>
                    <ol className="list-decimal list-inside space-y-3 pl-4 text-sm">
                      <li>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</li>
                      <li>각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.</li>
                      <li>회원 가입 및 관리: 회원 탈퇴 시까지</li>
                      <li>예약 서비스 제공: 서비스 제공 완료 후 5년</li>
                      <li>요금 결제 및 정산: 결제 완료 후 5년</li>
                      <li>불만처리에 관한 기록: 3년</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">제 3 조 (개인정보의 처리항목)</h3>
                    <p className="leading-relaxed mb-4 text-sm">회사는 다음의 개인정보 항목을 처리하고 있습니다.</p>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">1. 회원가입 및 관리</h4>
                        <p className="pl-4 text-sm">필수항목: 이름, 휴대전화번호, 이메일주소</p>
                        <p className="pl-4 text-sm">선택항목: 생년월일, 성별</p>
                        <div className="pl-4 mt-2 p-3 bg-yellow-50 rounded border">
                          <p className="text-sm font-medium text-gray-900 mb-1">카카오 소셜 로그인 이용 시</p>
                          <p className="text-xs text-gray-700">카카오로부터 수집되는 정보: 카카오 계정 정보(이메일, 닉네임, 프로필 이미지), 고유 식별값</p>
                          <p className="text-xs text-gray-600">※ 카카오의 개인정보 처리방침에 따라 처리되며, 당사는 최소한의 정보만 수집합니다</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">2. 예약 서비스 제공</h4>
                        <p className="pl-4 text-sm">필수항목: 예약자명, 휴대전화번호, 이메일주소</p>
                        <p className="pl-4 text-sm">선택항목: 특별요청사항</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">3. 결제 정보</h4>
                        <p className="pl-4 text-sm">신용카드 정보, 계좌정보 (결제대행업체에서 처리)</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            },
            {
              id: 'third-party',
              title: '제3자 제공 및 위탁처리',
              content: (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">제 4 조 (개인정보의 제3자 제공)</h3>
                    <ol className="list-decimal list-inside space-y-3 pl-4 text-sm">
                      <li>회사는 원칙적으로 정보주체의 개인정보를 수집·이용 목적으로 명시한 범위 내에서 처리하며, 다음의 경우를 제외하고는 정보주체의 사전 동의 없이는 본래의 목적 범위를 초과하여 처리하거나 제3자에게 제공하지 않습니다.</li>
                      <li>정보주체로부터 별도의 동의를 받는 경우</li>
                      <li>법률에 특별한 규정이 있거나 법령상 의무를 준수하기 위하여 불가피한 경우</li>
                      <li>정보주체 또는 그 법정대리인이 의사표시를 할 수 없는 상태에 있거나 주소불명 등으로 사전 동의를 받을 수 없는 경우로서 명백히 정보주체 또는 제3자의 급박한 생명, 신체, 재산의 이익을 위하여 필요하다고 인정되는 경우</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">제 5 조 (개인정보처리의 위탁)</h3>
                    <ol className="list-decimal list-inside space-y-3 pl-4 text-sm">
                      <li>회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</li>
                      <li>소셜 로그인 서비스: 카카오, 사용자 인증 및 로그인 처리</li>
                      <li>클라우드 인프라 서비스: Supabase, 데이터베이스 및 인증 서비스</li>
                      <li>웹 호스팅 서비스: Vercel, 웹사이트 호스팅 및 배포</li>
                      <li>결제처리 업무: 토스페이먼츠, 결제 및 정산 업무</li>
                      <li>SMS 발송 업무: 알리고, 예약 확인 및 안내 메시지 발송</li>
                      <li>이메일 발송 업무: 센드그리드, 예약 확인 및 마케팅 이메일 발송</li>
                      <li>회사는 위탁계약 체결시 개인정보 보호법 제25조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.</li>
                    </ol>
                  </div>
                </div>
              )
            },
            {
              id: 'rights',
              title: '정보주체의 권리 및 안전성 확보',
              content: (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">제 6 조 (정보주체의 권리·의무 및 행사방법)</h3>
                    <ol className="list-decimal list-inside space-y-3 pl-4 text-sm">
                      <li>정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.</li>
                      <li>개인정보 처리현황 통지요구</li>
                      <li>오류 등이 있을 경우 정정·삭제 요구</li>
                      <li>처리정지 요구</li>
                      <li>제1항에 따른 권리 행사는 회사에 대해 서면, 전화, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 회사는 이에 대해 지체없이 조치하겠습니다.</li>
                      <li>정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우에는 회사는 정정 또는 삭제를 완료할 때까지 당해 개인정보를 이용하거나 제공하지 않습니다.</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">제 7 조 (개인정보의 안전성 확보조치)</h3>
                    <p className="leading-relaxed mb-4 text-sm">회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
                    <ol className="list-decimal list-inside space-y-2 pl-4 text-sm">
                      <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육 등</li>
                      <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
                      <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
                    </ol>
                  </div>
                </div>
              )
            },
            {
              id: 'contact',
              title: '개인정보보호책임자 및 구제방법',
              content: (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">제 8 조 (개인정보보호책임자)</h3>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <p className="leading-relaxed mb-4 text-sm">회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보보호책임자를 지정하고 있습니다.</p>
                      <div className="space-y-2">
                        <p className="text-sm"><strong>개인정보보호책임자</strong></p>
                        <p className="text-sm">성명: 김개인</p>
                        <p className="text-sm">직책: CTO</p>
                        <p className="text-sm">연락처: privacy@stayoneday.com</p>
                        <p className="text-sm">전화: 1588-1234</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">제 9 조 (권익침해 구제방법)</h3>
                    <p className="leading-relaxed mb-4 text-sm">정보주체는 개인정보침해신고센터, 개인정보보호위원회, 대검찰청, 경찰청 등에 개인정보 침해에 대한 신고나 상담을 할 수 있습니다.</p>
                    <ol className="list-decimal list-inside space-y-2 pl-4 text-sm">
                      <li>개인정보침해신고센터 (privacy.go.kr / 국번없이 182)</li>
                      <li>개인정보보호위원회 (www.pipc.go.kr / 국번없이 182)</li>
                      <li>대검찰청 사이버범죄수사단 (spo.go.kr / 02-3480-3571)</li>
                      <li>경찰청 사이버안전국 (cyberbureau.police.go.kr / 국번없이 182)</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">제 10 조 (개인정보처리방침의 변경)</h3>
                    <ol className="list-decimal list-inside space-y-3 pl-4 text-sm">
                      <li>이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.</li>
                    </ol>
                  </div>
                </div>
              )
            }
          ].map((section) => (
            <div key={section.id} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-base font-semibold text-gray-900">{section.title}</h2>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${openSections.includes(section.id) ? 'rotate-180' : ''}`} />
              </button>
              {openSections.includes(section.id) && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="pt-4">
                    {section.content}
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              본 개인정보처리방침은 2025년 1월 1일부터 시행됩니다.<br />
              주식회사 누크랩스 | 대표: 안태웅 | 사업자등록번호: 561-88-02777<br />
              주소: 경기도 화성시 동탄영천로 150 현대 실리콘앨리동탄 제B동 503호 | 이메일: info@nuklabs.com<br />
              개인정보보호책임자: 이지응 (info@nuklabs.com)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}