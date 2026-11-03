import type { NextConfig } from "next";
import { baselineHeaders } from './src/lib/securityHeaders';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  async headers() {
    return [{ source: '/:path*', headers: [...baselineHeaders, ...(process.env.NODE_ENV === 'production' ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }] : [])] }];
  },
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
