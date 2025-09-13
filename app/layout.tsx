import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import { generateMetadata, generateViewport, jsonLd } from '@/lib/seo'
import ClientLayout from '@/components/client-layout'
import { GoogleAnalytics } from '@/lib/analytics/ga4-setup'
import './globals.css'

const notoSansKR = Noto_Sans_KR({ 
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  weight: ['400', '500', '700']
})

export const metadata: Metadata = generateMetadata()
export const viewport = generateViewport()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="" />
        
        {/* JSON-LD 구조화 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd.organization) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd.website) }}
        />
        
        {/* 성능 최적화 리소스 힌트 */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//images.unsplash.com" />
        <link rel="preconnect" href="https://supabase.co" />
        <link rel="preconnect" href="https://fcmauibvdqbocwhloqov.supabase.co" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        
        {/* PWA 및 풀스크린 설정 */}
        <meta name="theme-color" content="#000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Stay One Day" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* 노치/홈 인디케이터 대응 - 풀스크린 사진 표시 */}
        <meta name="viewport-fit" content="cover" />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --safe-area-inset-top: env(safe-area-inset-top, 0);
            --safe-area-inset-bottom: env(safe-area-inset-bottom, 0);
            --safe-area-inset-left: env(safe-area-inset-left, 0);
            --safe-area-inset-right: env(safe-area-inset-right, 0);
          }
          
          /* 풀스크린 이미지 - 노치 영역까지 확장 */
          .fullscreen-image {
            margin-left: calc(-1 * env(safe-area-inset-left));
            margin-right: calc(-1 * env(safe-area-inset-right));
            margin-top: calc(-1 * env(safe-area-inset-top));
            width: calc(100vw + env(safe-area-inset-left) + env(safe-area-inset-right));
          }
          
          /* 컨텐츠는 safe area 내부에 */
          .safe-area-content {
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
            padding-left: env(safe-area-inset-left);
            padding-right: env(safe-area-inset-right);
          }
          
          /* iOS 16+ 지원 */
          @supports (padding: max(0px)) {
            .safe-area-content {
              padding-top: max(env(safe-area-inset-top), 0px);
              padding-bottom: max(env(safe-area-inset-bottom), 0px);
              padding-left: max(env(safe-area-inset-left), 0px);
              padding-right: max(env(safe-area-inset-right), 0px);
            }
          }
        ` }} />
        
        {/* 보안 헤더 */}
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        
        {/* 모바일 최적화 */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={notoSansKR.className}>
        {/* 🎯 Google Analytics 4 추적 */}
        <GoogleAnalytics />
        
        <ClientLayout>
          {children}
        </ClientLayout>
        
      </body>
    </html>
  )
}