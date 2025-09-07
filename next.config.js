/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.2.2',
    NEXT_PUBLIC_BUILD_HASH: process.env.GITHUB_SHA ? 
      `main@${process.env.GITHUB_SHA.substring(0, 7)}` : 
      'main@dev',
    NEXT_PUBLIC_BUILD_TIMESTAMP: new Date().toISOString(),
  },
}

module.exports = nextConfig
