'use client'

export default function HostTestPage() {
  console.log('🧪 테스트 페이지 로드됨!')
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>호스트 테스트 페이지</h1>
      <p>이 페이지가 보인다면 React 컴포넌트가 정상 작동합니다.</p>
      <button onClick={() => console.log('버튼 클릭됨!')}>
        클릭 테스트
      </button>
    </div>
  )
}