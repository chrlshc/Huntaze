/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Core security
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          // HSTS (enable only on HTTPS and apex handled)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          // Permissions-Policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()'
          },
          // Content Security Policy (adjust if you add third-party scripts)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "frame-ancestors 'self'",
              "object-src 'none'",
              // Allow Next.js inline styles; prefer to remove 'unsafe-inline' if you adopt nonces
              "style-src 'self' 'unsafe-inline'",
              // Allow GA/Tag Manager if used
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
              // API and analytics endpoints
              `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL || ''} https://www.google-analytics.com`,
              // Images and fonts
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
            ].join('; ')
          }
        ]
      }
    ]
  },

  // Rewrites for cleaner URLs and API proxy
  async rewrites() {
    return [
      // API proxy to backend
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? `${process.env.NEXT_PUBLIC_API_URL || 'https://huntaze.com/backend'}/api/:path*`
          : 'http://localhost:4000/api/:path*'
      },
      // Clean URLs
      {
        source: '/terms',
        destination: '/terms-of-service',
      },
      {
        source: '/privacy',
        destination: '/privacy-policy',
      },
    ];
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || ''
  },

  // Image optimization
  images: {
    domains: ['localhost', 'yourdomain.com'],
    formats: ['image/avif', 'image/webp'],
    unoptimized: false
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false
      }
    }
    return config
  }
}

module.exports = nextConfig
