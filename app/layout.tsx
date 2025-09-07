import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import { generateMetadata, jsonLd } from '@/lib/seo'
import ClientLayout from '@/components/client-layout'
import './globals.css'

const notoSansKR = Noto_Sans_KR({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  weight: ['300', '400', '500', '700']
})

export const metadata: Metadata = generateMetadata()

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
        
        {/* PWA 설정 */}
        <meta name="theme-color" content="#3B82F6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Stay One Day" />
        
        {/* 보안 헤더 */}
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        
        {/* 모바일 최적화 */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={notoSansKR.className}>
        <ClientLayout>
          {children}
        </ClientLayout>
        
        {/* 성능 모니터링을 위한 스크립트 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Core Web Vitals 측정
              if ('web-vital' in window) {
                import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
                  getCLS(console.log);
                  getFID(console.log);
                  getFCP(console.log);
                  getLCP(console.log);
                  getTTFB(console.log);
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}