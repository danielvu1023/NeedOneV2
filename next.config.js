const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  customWorkerDir: 'worker',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/supabase/:path*',
        destination: `${process.env.SUPABASE_INTERNAL_URL || 'http://localhost:54321'}/:path*`,
      },
    ]
  },
}

module.exports = withPWA(nextConfig)
