/** @type {import('next').NextConfig} */
const nextConfig = {
  // Core
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  output: 'standalone',

  // Let Amplify set edge/static headers; avoid duplication here
  async headers() {
    return []
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
