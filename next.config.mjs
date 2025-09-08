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
      { source: '/terms', destination: '/terms-of-service' },
      { source: '/privacy', destination: '/privacy-policy' },
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
    // Optimize for Core Web Vitals
    optimizePackageImports: ['framer-motion', 'lucide-react', '@radix-ui/react-*'],
  },
  
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
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
