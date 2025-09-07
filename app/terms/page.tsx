'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import Link from 'next/link'

export default function TermsPage() {
  const [openSections, setOpenSections] = useState<string[]>(['section1'])

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
        <h1 className="text-2xl font-bold text-gray-900 mb-8">이용약관</h1>
        
        <div className="space-y-3">
          {/* 간단한 아코디언 형태로 주요 조항들을 그룹화 */}
          
          {[
            {
              id: 'basic',
              title: '기본 사항 (목적, 정의, 약관 변경)',
              content: (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">제 1 조 (목적)</h3>
                    <p className="leading-relaxed text-sm text-gray-700">
                      이 약관은 주식회사 누크랩스(이하 "회사"라 함)이 운영하는 "스테이원데이" 서비스(이하 "서비스"라 함)의 이용조건 및 절차에 관한 사항과 기타 필요한 사항을 규정함을 목적으로 합니다.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">제 2 조 (정의)</h3>
                    <p className="leading-relaxed mb-3 text-sm text-gray-700">이 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
                    <ol className="list-decimal list-inside space-y-2 pl-4 text-sm text-gray-700">
                      <li>"서비스"라 함은 회사가 제공하는 숙박시설 예약 및 관련 부가서비스를 의미합니다.</li>
                      <li>"이용자"라 함은 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 의미합니다.</li>
                      <li>"회원"이라 함은 회사와 서비스 이용계약을 체결하고 이용자 아이디(ID)를 부여받은 자를 의미합니다.</li>
                      <li>"숙박사업자"라 함은 회사와 파트너십을 체결하고 서비스를 통해 숙박시설을 제공하는 사업자를 의미합니다.</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">제 3 조 (약관의 효력 및 변경)</h3>
                    <ol className="list-decimal list-inside space-y-2 pl-4 text-sm text-gray-700">
                      <li>이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력을 발생합니다.</li>
                      <li>회사는 합리적인 사유가 발생할 경우 이 약관을 변경할 수 있으며, 변경된 약관은 제1항과 같은 방법으로 공지 또는 통지함으로써 효력을 발생합니다.</li>
                      <li>회사는 약관을 변경할 경우 변경사유 및 적용일자를 명시하여 최소 7일 이전부터 공지합니다.</li>
                    </ol>
                  </div>
                </div>
              )
            },
            {
              id: 'service',
              title: '서비스 이용 (서비스 제공, 회원가입)',
              content: (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">제 4 조 (서비스의 제공)</h3>
                    <p className="leading-relaxed mb-3 text-sm text-gray-700">회사는 이용자에게 다음과 같은 서비스를 제공합니다.</p>
                    <ol className="list-decimal list-inside space-y-2 pl-4 text-sm text-gray-700">
                      <li>숙박시설 정보 제공 및 예약 중개 서비스</li>
                      <li>숙박시설 이용 후기 및 평점 서비스</li>
                      <li>숙박시설 관련 부가정보 및 편의 서비스</li>
                      <li>기타 회사가 정하는 서비스</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">제 5 조 (회원가입)</h3>
                    <ol className="list-decimal list-inside space-y-2 pl-4 text-sm text-gray-700">
                      <li>회원으로 가입하고자 하는 자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.</li>
                      <li>회사는 다음 각 호에 해당하지 않는 한 회원으로 등록합니다:</li>
                      <li className="pl-4">• 가입신청자가 이전에 회원자격을 상실한 적이 있는 경우</li>
                      <li className="pl-4">• 등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                      <li className="pl-4">• 기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
                    </ol>
                  </div>
                </div>
              )
            },
            {
              id: 'booking',
              title: '예약 및 결제 (예약, 취소, 환불)',
              content: (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">제 6 조 (예약 및 결제)</h3>
                    <ol className="list-decimal list-inside space-y-2 pl-4 text-sm text-gray-700">
                      <li>이용자는 회사가 정한 절차에 따라 숙박시설 예약을 신청할 수 있습니다.</li>
                      <li>회사는 예약 신청에 대해 다음 각 호의 사유가 있을 때에는 승낙하지 않을 수 있습니다:</li>
                      <li className="pl-4">• 신청 내용에 허위사실이 있거나 신청자 본인의 신청이 아닌 경우</li>
                      <li className="pl-4">• 숙박시설의 예약 가능 여부에 따라 예약이 불가능한 경우</li>
                      <li className="pl-4">• 기타 회사가 필요하다고 인정하는 사유가 있는 경우</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">제 7 조 (취소 및 환불)</h3>
                    <ol className="list-decimal list-inside space-y-2 pl-4 text-sm text-gray-700">
                      <li>이용자는 예약 확정 후에도 이용 전까지는 예약을 취소할 수 있습니다.</li>
                      <li>취소 시점에 따른 환불 기준:</li>
                      <li className="pl-4">• 이용일 7일 전까지: 100% 환불</li>
                      <li className="pl-4">• 이용일 3일 전까지: 50% 환불</li>
                      <li className="pl-4">• 이용일 1일 전까지: 환불 불가</li>
                      <li>숙박사업자의 사정에 의한 예약 취소 시에는 전액 환불됩니다.</li>
                    </ol>
                  </div>
                </div>
              )
            },
            {
              id: 'obligations',
              title: '권리와 의무 (회사의 의무, 이용자의 의무)',
              content: (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">제 8 조 (회사의 의무)</h3>
                    <ol className="list-decimal list-inside space-y-2 pl-4 text-sm text-gray-700">
                      <li>회사는 법령과 이 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며, 지속적이고 안정적으로 서비스를 제공하기 위해 노력합니다.</li>
                      <li>회사는 이용자가 안전하게 인터넷 서비스를 이용할 수 있도록 이용자의 개인정보보호를 위한 보안 시스템을 구축합니다.</li>
                      <li>회사는 이용자의 개인정보를 본인의 승낙없이 타인에게 누설, 배포하지 않습니다.</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">제 9 조 (이용자의 의무)</h3>
                    <p className="leading-relaxed mb-3 text-sm text-gray-700">이용자는 다음 행위를 하여서는 안 됩니다:</p>
                    <ol className="list-decimal list-inside space-y-2 pl-4 text-sm text-gray-700">
                      <li>신청 또는 변경시 허위 내용의 등록</li>
                      <li>타인의 정보 도용</li>
                      <li>회사가 게시한 정보의 변경</li>
                      <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                      <li>회사 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                      <li>회사 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                    </ol>
                  </div>
                </div>
              )
            },
            {
              id: 'liability',
              title: '책임 및 분쟁 해결 (면책조항, 준거법)',
              content: (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">제 10 조 (면책조항)</h3>
                    <ol className="list-decimal list-inside space-y-2 pl-4 text-sm text-gray-700">
                      <li>회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</li>
                      <li>회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임지지 않습니다.</li>
                      <li>회사는 이용자가 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임지지 않으며, 그 밖의 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임지지 않습니다.</li>
                      <li>회사는 숙박사업자가 제공하는 숙박시설의 내용, 품질에 대해서는 책임지지 않습니다.</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">제 11 조 (준거법 및 관할법원)</h3>
                    <ol className="list-decimal list-inside space-y-2 pl-4 text-sm text-gray-700">
                      <li>이 약관에 명시되지 않은 사항은 대한민국의 관련 법령에 의합니다.</li>
                      <li>서비스 이용으로 발생한 분쟁에 대해 소송이 제기되는 경우 회사의 본사 소재지를 관할하는 법원을 관할 법원으로 합니다.</li>
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
              본 약관은 2025년 1월 1일부터 시행됩니다.<br />
              주식회사 누크랩스 | 대표: 안태웅 | 사업자등록번호: 561-88-02777<br />
              주소: 경기도 화성시 동탄영천로 150 현대 실리콘앨리동탄 제B동 503호 | 이메일: info@nuklabs.com
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}