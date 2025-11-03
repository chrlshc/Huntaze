import type { NextConfig } from 'next';

const isExport = process.env.NEXT_OUTPUT_EXPORT === '1';

// Legacy app redirects for backward compatibility
const LEGACY_APP_REDIRECTS: [string, string][] = [
  ['/app', '/dashboard'],
  ['/app/:path*', '/dashboard/:path*'],
  ['/old-dashboard', '/dashboard'],
  ['/legacy/:path*', '/dashboard/:path*'],
];

const nextConfig: NextConfig = {
  // Core
  reactStrictMode: true,
  compress: true,
  output: isExport ? 'export' : 'standalone',
  
  // Note: swcMinify removed - it's now the default in Next.js 15

  // Let Amplify set edge/static headers; avoid duplication here
  async headers() {
    return [];
  },

  // Redirects and rewrites
  async redirects() {
    const legacyRedirects = LEGACY_APP_REDIRECTS.map(([source, destination]) => ({
      source,
      destination,
      permanent: false,
    }));

    return [
      ...legacyRedirects,
      // Rename: Social Planner -> Social Marketing
      { source: '/social-planner', destination: '/social-marketing', permanent: false },
      { source: '/social-planner/:path*', destination: '/social-marketing/:path*', permanent: false },
      // Fix common typos
      { source: '/marckeying', destination: '/marketing', permanent: false },
      { source: '/marcketing', destination: '/marketing', permanent: false },
    ]
  },
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
    ];
  },

  // Image optimization
  images: {
    domains: ['api.dicebear.com', 'ui-avatars.com', 'cdn.huntaze.com', 'static.onlyfansassets.com'],
    formats: ['image/avif', 'image/webp'],
    unoptimized: isExport ? true : false,
  },

  // CSS and build perf
  experimental: {
    optimizeCss: true,
    // Disable optimizePackageImports to avoid dev chunk errors with RSC boundaries
    // optimizePackageImports: ['framer-motion', 'lucide-react'],
    
    // Turbopack for faster development builds (Next.js 15)
    // Note: Enable with `next dev --turbo` command
    // turbo: {}, // Uncomment to enable Turbopack features
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
      };
    }
    return config;
  },
};

export default nextConfig;
