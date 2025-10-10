const LEGACY_APP_SECTIONS = [
  { prefix: '/messages', destination: '/dashboard/messages' },
  { prefix: '/analytics', destination: '/dashboard/analytics' },
  { prefix: '/fans', destination: '/dashboard/fans' },
  { prefix: '/settings', destination: '/dashboard/settings' },
  { prefix: '/profile', destination: '/dashboard/settings' },
  { prefix: '/configure', destination: '/dashboard/settings' },
  { prefix: '/billing', destination: '/dashboard/settings' },
  { prefix: '/huntaze-ai', destination: '/dashboard/messages' },
  { prefix: '/onlyfans', destination: '/dashboard/messages' },
  { prefix: '/manager-ai', destination: '/dashboard/messages' },
  { prefix: '/social', destination: '/dashboard/messages' },
  { prefix: '/campaigns', destination: '/dashboard/messages' },
  { prefix: '/automations', destination: '/dashboard/messages' },
  { prefix: '/platforms', destination: '/dashboard/messages' },
  { prefix: '/content', destination: '/dashboard/messages' },
  { prefix: '/cinai', destination: '/dashboard/messages' },
];

const LEGACY_APP_REDIRECTS = [
  ['/app', '/home'],
  ['/app/', '/home'],
  ...LEGACY_APP_SECTIONS.flatMap(({ prefix, destination }) => [
    [`/app${prefix}`, destination],
    [`/app${prefix}/:path*`, destination],
    [`/app/app${prefix}`, destination],
    [`/app/app${prefix}/:path*`, destination],
  ]),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Core
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  output: 'standalone',

  // Let Amplify set edge/static headers; avoid duplication here
  async headers() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const connectSources = ["'self'", 'https:', 'wss:', 'https://*.amazonaws.com'];
    if (apiUrl) connectSources.push(apiUrl);

    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.amazonaws.com",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "frame-src 'self' https://js.stripe.com",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://connect.facebook.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      `connect-src ${connectSources.join(' ')}`,
      'upgrade-insecure-requests',
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          { key: 'Server', value: '' },
          { key: 'X-Powered-By', value: '' },
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
      // Stable alias kept
      { source: '/app/huntaze-ai', destination: '/dashboard/messages' },
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
    // Disable CSS optimizer in dev to avoid rare 500s on static CSS routes
    // Re-enable for prod builds if needed
    optimizeCss: false,
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
      };

      config.optimization = config.optimization || {};
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...(config.optimization?.splitChunks?.cacheGroups || {}),
          onlyfans: {
            name: 'onlyfans-module',
            test: /[\\/]features[\\/]onlyfans[\\/]/,
            chunks: 'all',
            priority: 15,
          },
          social: {
            name: 'social-module',
            test: /[\\/]features[\\/]social-media[\\/]/,
            chunks: 'all',
            priority: 15,
          },
        },
      };
    }

    if (process.env.ANALYZE === 'true' && !isServer) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: 'bundle-analysis.html',
        }),
      );
    }

    return config;
  },
}

export default nextConfig
