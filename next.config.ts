import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable CSP in Next.js, let Amplify handle it
  async headers() {
    return []
  }
};

export default nextConfig;
