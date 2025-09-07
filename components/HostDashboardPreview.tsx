'use client'

import { Calendar, TrendingUp, Users, Star, DollarSign, Clock, Eye, MessageCircle } from 'lucide-react'

export default function HostDashboardPreview() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">호스트 대시보드</h2>
          <p className="text-sm text-gray-500">청주 힐사이드 펜션</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-green-600 font-medium">운영중</span>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">이번 달 수익</p>
              <p className="text-lg font-bold text-blue-700">₩2,850,000</p>
            </div>
            <DollarSign className="w-6 h-6 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">예약 건수</p>
              <p className="text-lg font-bold text-green-700">15건</p>
            </div>
            <Calendar className="w-6 h-6 text-green-500" />
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">평점</p>
              <p className="text-lg font-bold text-purple-700">4.8</p>
            </div>
            <Star className="w-6 h-6 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">이용 고객</p>
              <p className="text-lg font-bold text-orange-700">127명</p>
            </div>
            <Users className="w-6 h-6 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="mb-6">
        <h3 className="text-md font-semibold text-gray-900 mb-3">최근 예약</h3>
        <div className="space-y-2">
          {[
            { date: '01/25', time: '15:00-23:00', guests: '8명', status: '확정', amount: '₩450,000' },
            { date: '01/23', time: '15:00-23:00', guests: '6명', status: '완료', amount: '₩380,000' },
            { date: '01/21', time: '15:00-23:00', guests: '12명', status: '완료', amount: '₩520,000' }
          ].map((booking, index) => (
            <div key={index} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium text-gray-900">{booking.date}</div>
                <div className="text-sm text-gray-600">{booking.time}</div>
                <div className="text-sm text-gray-600">{booking.guests}</div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  booking.status === '확정' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                }`}>
                  {booking.status}
                </span>
                <span className="text-sm font-semibold text-gray-900">{booking.amount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Chart Preview */}
      <div className="mb-6">
        <h3 className="text-md font-semibold text-gray-900 mb-3">월별 수익 현황</h3>
        <div className="bg-gray-50 rounded-lg p-4 h-32 flex items-end justify-between">
          {[2.1, 1.8, 2.5, 2.8, 2.2, 3.1, 2.9].map((height, index) => (
            <div key={index} className="flex flex-col items-center">
              <div 
                className="w-8 bg-blue-500 rounded-t-sm mb-1" 
                style={{ height: `${height * 15}px` }}
              ></div>
              <span className="text-xs text-gray-500">{index + 19}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-md font-semibold text-gray-900 mb-3">빠른 관리</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="flex items-center justify-center space-x-2 py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">예약 관리</span>
          </button>
          <button className="flex items-center justify-center space-x-2 py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <Eye className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">숙소 보기</span>
          </button>
          <button className="flex items-center justify-center space-x-2 py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <MessageCircle className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">고객 문의</span>
          </button>
          <button className="flex items-center justify-center space-x-2 py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <TrendingUp className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">통계 보기</span>
          </button>
        </div>
      </div>
    </div>
  )
}