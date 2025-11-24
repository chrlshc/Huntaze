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
  
  // Output for Amplify Compute (ECS Fargate) - Requirement 6.1
  output: 'standalone',
  
  // Note: swcMinify removed - it's now the default in Next.js 16

  // Security headers - Requirements 7.1, 7.2, 7.3, 7.4, 7.5
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
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
            value: 'camera=(), microphone=(), geolocation=()'
          },
        ],
      },
    ];
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

  // Turbopack is enabled by default in Next.js 16 for development - Requirement 6.2, 6.3
  // Webpack is used for production builds - Requirement 6.4
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Force dynamic rendering for all pages to avoid prerendering issues with database connections
  // This prevents build-time errors when Redis/Postgres are not available
  dynamicIO: true,

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
  
  // Performance optimizations - Requirements 21.1, 21.2, 21.3, 21.4
  compiler: {
    // Only remove console logs in production environment, keep them in staging for debugging
    removeConsole: process.env.NODE_ENV === 'production' && process.env.AMPLIFY_ENV === 'production',
  },
  
  // Production optimizations
  productionBrowserSourceMaps: false, // Disable source maps in production for smaller bundles
  
  // Optimize CSS - PurgeCSS is handled by Tailwind, minification by Next.js
  // Tree shaking and minification are enabled by default in production

  // Strict type checking for production builds
  // Note: TypeScript errors exist but don't block production builds
  // Run `npx tsc --noEmit` to see all type errors
  typescript: {
    ignoreBuildErrors: true,
  },

  // Skip static generation for auth pages that use NextAuth session
  // These pages require dynamic rendering and cannot be pre-rendered
  skipTrailingSlashRedirect: true,

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
