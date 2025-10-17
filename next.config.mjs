/** @type {import('next').NextConfig} */
const nextConfig = {
  // Core
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  output: 'standalone',

  // Security headers configuration
  async headers() {
    const ContentSecurityPolicy = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https: blob:;
      font-src 'self' data:;
      connect-src 'self' https://cognito-idp.*.amazonaws.com https://*.amazoncognito.com https://*.huntaze.com wss://*.huntaze.com;
      frame-src 'self' https://*.amazoncognito.com;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
      object-src 'none';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim()

    return [
      {
        source: '/:path*',
        headers: [
          // Security headers
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()'
          },
          // Start with CSP in report-only mode
          {
            key: process.env.NODE_ENV === 'production' 
              ? 'Content-Security-Policy' 
              : 'Content-Security-Policy-Report-Only',
            value: ContentSecurityPolicy
          }
        ]
      }
    ]
  },

  // Minimal rewrites
  async rewrites() {
    return [
      // Stable alias: keep /app/huntaze-ai URL, serve dashboard chat
      { source: '/app/huntaze-ai', destination: '/dashboard/huntaze-ai' },
      { source: '/terms', destination: '/terms-of-service' },
      { source: '/privacy', destination: '/privacy-policy' },
      // Align header links to existing pages
      { source: '/solutions', destination: '/features' },
      { source: '/resources', destination: '/learn' },
      { source: '/enterprise', destination: '/for-agencies' },
      { source: '/help', destination: '/support' },
    ]
  },

  // Image optimization
  images: {
    domains: ['api.dicebear.com', 'ui-avatars.com', 'cdn.huntaze.com', 'static.onlyfansassets.com'],
    formats: ['image/avif', 'image/webp'],
    unoptimized: false,
  },

  // CSS and build perf
  experimental: {
    optimizeCss: true,
    // Disable optimizePackageImports to avoid dev chunk errors with RSC boundaries
    // optimizePackageImports: ['framer-motion', 'lucide-react'],
  },
  
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Allow local builds to proceed despite TS/ESLint issues (useful during UI iteration)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Client bundle fallbacks
  webpack: (config, { isServer }) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...config.resolve.alias,
      'node:https': 'https',
      'node:http': 'http',
      'node:url': 'url',
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

export default nextConfig
