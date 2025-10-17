/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n: { locales: ['en'], defaultLocale: 'en' },
  experimental: {
    instrumentationHook: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Language', value: 'en' },
        ],
      },
    ]
  },
};
export default nextConfig;
