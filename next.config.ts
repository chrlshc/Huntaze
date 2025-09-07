import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Disable CSP in Next.js, let Amplify handle it
  async headers() {
    return []
  },
  
  // Image optimization for production
  images: {
    domains: ['api.dicebear.com'],
    unoptimized: false,
  },
  
  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
  },
  
  // Production optimizations
  swcMinify: true,
  compress: true,
};

export default nextConfig;
