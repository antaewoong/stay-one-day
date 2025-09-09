/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Fast Refresh 최적화
  experimental: {
    optimizeServerReact: false,
    esmExternals: 'loose'
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