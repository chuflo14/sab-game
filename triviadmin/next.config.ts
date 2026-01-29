import type { NextConfig } from "next";

// Force Rebuild 1
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
};

export default nextConfig;

