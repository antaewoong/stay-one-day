'use client';
import { useEffect } from 'react';

export default function Error({ 
  error, 
  reset 
}: { 
  error: Error & { digest?: string }; 
  reset: () => void;
}) {
  useEffect(() => {
    console.error('🚨 Admin Page Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-red-600 mb-4">
          페이지 오류 발생
        </h2>
        <div className="bg-gray-50 p-3 rounded mb-4">
          <p className="text-sm text-gray-700 font-mono">
            {error.message}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            다시 시도
          </button>
          <button
            onClick={() => window.location.href = '/admin/login'}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            로그인으로 이동
          </button>
        </div>
      </div>
    </div>
  );
}