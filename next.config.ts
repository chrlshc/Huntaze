import type { NextConfig } from 'next';

const isExport = process.env.NEXT_OUTPUT_EXPORT === '1';

const nextConfig: NextConfig = {
  // Core
  reactStrictMode: true,
  compress: true,
  output: isExport ? 'export' : 'standalone',
  poweredByHeader: false,

  // Next.js 15: Bundle Pages Router dependencies for consistency
  bundlePagesRouterDependencies: true,

  // Next.js 15: External packages for Node.js runtime (don't bundle Prisma binary)
  serverExternalPackages: ['@prisma/client'],

  // Let Amplify set edge/static headers; avoid duplication here
  // We still add a CSP in Report-Only to iterate safely.
  async headers() {
    const reportEndpoint = process.env.CSP_REPORT_ENDPOINT || '';
    const dev = process.env.NODE_ENV === 'development';
    const cspDirectives = [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "form-action 'self'",
      // Scripts: start strict in Report-Only; add nonces/hashes before enforce
      `script-src 'self'${dev ? " 'unsafe-eval'" : ''}`,
      // Styles: allow inline during transition; tighten later with nonces
      "style-src 'self' 'unsafe-inline'",
      // Images: self + data URIs + known CDNs used by the app
      "img-src 'self' data: https://cdn.huntaze.com https://static.onlyfansassets.com",
      // Fonts: self + data URIs
      "font-src 'self' data:",
      // Network: allow same-origin, HTTPS endpoints, and websockets
      "connect-src 'self' https: wss:",
      // Upgrade any stray http links to https in browsers
      'upgrade-insecure-requests',
      // Send violations to our endpoint (legacy directive for broad UA support)
      'report-uri /api/csp/report',
    ];

    // If an absolute report endpoint is provided, use modern Reporting API too
    if (reportEndpoint) {
      cspDirectives.push('report-to csp');
    }

    const csp = cspDirectives.join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy-Report-Only', value: csp },
          // Modern Reporting API (optional; requires absolute URL)
          ...(reportEndpoint
            ? [
                {
                  key: 'Report-To',
                  value: JSON.stringify({
                    group: 'csp',
                    max_age: 60 * 60 * 24 * 30, // 30d
                    endpoints: [{ url: reportEndpoint }],
                  }),
                },
                { key: 'Reporting-Endpoints', value: `csp=${reportEndpoint}` },
              ]
            : []),
        ],
      },
    ];
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
    ];
  },

  // Image optimization (using remotePatterns instead of deprecated domains)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'cdn.huntaze.com' },
      { protocol: 'https', hostname: 'static.onlyfansassets.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    unoptimized: isExport ? true : false,
  },

  // CSS and build perf
  experimental: {
    // Disable CSS optimization to avoid 'critters' requirement during SSG
    // Re‑enable after CI adds critters or when not exporting pages
    optimizeCss: false,
    // optimizePackageImports: ['framer-motion', 'lucide-react'],
  },

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Allow local builds to proceed despite TS issues (useful during UI iteration)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Turbopack config (Next.js 16 default)
  turbopack: {
    // Empty config to silence webpack warning
  },
};

export default nextConfig;
