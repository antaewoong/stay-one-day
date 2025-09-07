'use client'

import { Suspense } from 'react'
import ReservationPageContent from './reservation-content'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">숙소 정보를 불러오는 중...</p>
      </div>
    </div>
  )
}

export default function ReservationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ReservationPageContent />
    </Suspense>
  )
}