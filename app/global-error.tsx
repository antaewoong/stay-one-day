'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('🔥 Global Application Error:', error);
  
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-100">
          <div className="max-w-lg w-full bg-white rounded-lg shadow-xl p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">
                🚨 시스템 오류
              </h1>
              <p className="text-gray-600 mb-6">
                예상치 못한 오류가 발생했습니다.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800 font-mono break-words">
                  {error.message}
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => reset()}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  다시 시도
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  메인으로
                </button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}