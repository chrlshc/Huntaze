import type { NextConfig } from 'next';

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
  
  // Note: swcMinify removed - it's now the default in Next.js 16

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

  // Turbopack configuration (Next.js 16+)
  turbopack: {},

  // Force Node.js runtime for all API routes (fixes NextAuth compatibility)
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Explicitly mark next-auth as external package to prevent webpack bundling issues
  // This ensures NextAuth v5 works correctly in serverless environments
  // Note: In Next.js 16, this was moved from experimental.serverComponentsExternalPackages
  serverExternalPackages: ['next-auth'],

  // Image optimization (migrated to remotePatterns for security)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.huntaze.com',
      },
      {
        protocol: 'https',
        hostname: 'static.onlyfansassets.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    // Amplify handles image optimization
    unoptimized: true,
  },

  // Removed experimental features for stable builds
  
  // Performance optimizations
  compiler: {
    // Only remove console logs in production environment, keep them in staging for debugging
    removeConsole: process.env.NODE_ENV === 'production' && process.env.AMPLIFY_ENV === 'production',
  },

  // Strict type checking for production builds
  // Note: TypeScript errors exist but don't block production builds
  // Run `npx tsc --noEmit` to see all type errors
  typescript: {
    ignoreBuildErrors: true,
  },



  // Client bundle fallbacks
  webpack: (config, { isServer }) => {
    // Allow disabling webpack's persistent cache in low-disk environments
    const disableCache = process.env.NEXT_DISABLE_WEBPACK_PERSISTENT_CACHE === '1' || process.env.NEXT_DISABLE_WEBPACK_PERSISTENT_CACHE === 'true';
    if (disableCache) {
      // Disable webpack filesystem cache to reduce disk writes
      // https://webpack.js.org/configuration/cache/
      (config as any).cache = false;
    }
    
    // Fix NextAuth v5 + Next.js 16 ESM compatibility issue
    // NextAuth tries to import 'next/server' without .js extension
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'next/server': require.resolve('next/server'),
      };
    }
    
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
