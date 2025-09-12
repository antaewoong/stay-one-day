/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Fast Refresh 최적화
  experimental: {
    optimizeServerReact: false,
    esmExternals: 'loose'
  },
  // CSP 설정 - 개발모드에서만 완화
  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';
    
    const csp = [
      "default-src 'self';",
      `script-src 'self' ${isDev ? "'unsafe-eval' 'unsafe-inline'" : "'unsafe-inline'"} https://cdn.jsdelivr.net https://www.googletagmanager.com;`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
      "font-src 'self' https://fonts.gstatic.com;",
      "img-src 'self' data: blob: https: http://localhost:*;",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com;",
      "object-src 'none';",
      "base-uri 'self';",
      "frame-ancestors 'none';"
    ].join(' ');

    // 개발 모드에서는 CSP 헤더를 아예 반환하지 않음
    if (isDev) {
      return []
    }
    
    return [
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: csp
          }
        ]
      }
    ]
  },
  // Next.js 개발모드의 eval 소스맵 회피
  webpack(config, { dev, isServer }) {
    if (dev && !isServer) {
      config.devtool = 'source-map';
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'stay-oneday.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'fcmauibvdqbocwhloqov.supabase.co',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      }
    ],
    // Supabase 이미지 처리를 위해 unoptimized 사용
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  swcMinify: true,
  compress: true,
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig