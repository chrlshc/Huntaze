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

  // Redirects and rewrites
  async redirects() {
    return [
      // No opinionated redirect for /app root (kept below as rewrite)
      // Fix common typos
      { source: '/marckeying', destination: '/marketing', permanent: false },
      { source: '/marcketing', destination: '/marketing', permanent: false },
    ]
  },
  async rewrites() {
    return [
      // App entry under /app (serves app/app/page.tsx → redirects to /app/app/dashboard)
      { source: '/app', destination: '/app/app' },
      { source: '/app/', destination: '/app/app' },

      // Map real product sections under /app → /app/app
      { source: '/app/analytics', destination: '/app/app/analytics' },
      { source: '/app/analytics/:path*', destination: '/app/app/analytics/:path*' },
      { source: '/app/automations', destination: '/app/app/automations' },
      { source: '/app/automations/:path*', destination: '/app/app/automations/:path*' },
      { source: '/app/campaigns', destination: '/app/app/campaigns' },
      { source: '/app/campaigns/:path*', destination: '/app/app/campaigns/:path*' },
      { source: '/app/cinai', destination: '/app/app/cinai' },
      { source: '/app/cinai/:path*', destination: '/app/app/cinai/:path*' },
      { source: '/app/configure', destination: '/app/app/configure' },
      { source: '/app/configure/:path*', destination: '/app/app/configure/:path*' },
      { source: '/app/content', destination: '/app/app/content' },
      { source: '/app/content/:path*', destination: '/app/app/content/:path*' },
      { source: '/app/dashboard', destination: '/app/app/dashboard' },
      { source: '/app/dashboard/:path*', destination: '/app/app/dashboard/:path*' },
      { source: '/app/fans', destination: '/app/app/fans' },
      { source: '/app/fans/:path*', destination: '/app/app/fans/:path*' },
      { source: '/app/manager-ai', destination: '/app/app/manager-ai' },
      { source: '/app/manager-ai/:path*', destination: '/app/app/manager-ai/:path*' },
      { source: '/app/messages', destination: '/app/app/messages' },
      { source: '/app/messages/:path*', destination: '/app/app/messages/:path*' },
      { source: '/app/onlyfans', destination: '/app/app/onlyfans' },
      { source: '/app/onlyfans/:path*', destination: '/app/app/onlyfans/:path*' },
      { source: '/app/platforms', destination: '/app/app/platforms' },
      { source: '/app/platforms/:path*', destination: '/app/app/platforms/:path*' },
      { source: '/app/profile', destination: '/app/app/profile' },
      { source: '/app/profile/:path*', destination: '/app/app/profile/:path*' },
      // billing lives at root app/billing/*
      { source: '/app/billing', destination: '/billing' },
      { source: '/app/billing/:path*', destination: '/billing/:path*' },
      { source: '/app/settings', destination: '/app/app/settings' },
      { source: '/app/settings/:path*', destination: '/app/app/settings/:path*' },
      { source: '/app/social', destination: '/app/app/social' },
      { source: '/app/social/:path*', destination: '/app/app/social/:path*' },

      // Map top-level app routes to the AppShell versions for consistent UI (black header, white sidebar)
      { source: '/dashboard', destination: '/app/app/dashboard' },
      { source: '/dashboard/:path*', destination: '/app/app/dashboard/:path*' },
      { source: '/messages', destination: '/app/app/messages' },
      { source: '/messages/:path*', destination: '/app/app/messages/:path*' },
      { source: '/fans', destination: '/app/app/fans' },
      { source: '/fans/:path*', destination: '/app/app/fans/:path*' },
      { source: '/analytics', destination: '/app/app/analytics' },
      { source: '/analytics/:path*', destination: '/app/app/analytics/:path*' },
      { source: '/settings', destination: '/app/app/settings' },
      { source: '/settings/:path*', destination: '/app/app/settings/:path*' },
      { source: '/platforms', destination: '/app/app/platforms' },
      { source: '/platforms/:path*', destination: '/app/app/platforms/:path*' },
      { source: '/onlyfans', destination: '/app/app/onlyfans' },
      { source: '/onlyfans/:path*', destination: '/app/app/onlyfans/:path*' },

      // Stable alias kept
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
