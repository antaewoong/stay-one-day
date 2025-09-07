'use client'

import { useState } from 'react'

export default function InsertDataPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const handleInsert = async () => {
    setLoading(true)
    setResult('데이터 입력 중...')
    
    try {
      const response = await fetch('/api/insert-real-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResult(`성공! ${data.message}`)
      } else {
        setResult(`오류: ${data.error}`)
      }
    } catch (error) {
      setResult(`오류: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">데이터베이스 데이터 입력</h1>
      
      <div className="space-y-4">
        <button
          onClick={handleInsert}
          disabled={loading}
          className={`px-6 py-3 text-white font-medium rounded-lg ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? '입력 중...' : '실제 숙소 데이터 입력'}
        </button>
        
        {result && (
          <div className={`p-4 rounded-lg ${
            result.includes('성공') 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <pre className="whitespace-pre-wrap text-sm font-medium">{result}</pre>
          </div>
        )}
      </div>
    </div>
  )
}