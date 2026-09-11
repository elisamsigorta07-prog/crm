import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/xml',
        destination: '/sitemap.xml',
      },
      {
        source: '/sitemap',
        destination: '/sitemap.xml',
      },
    ];
  },
};

export default nextConfig;
