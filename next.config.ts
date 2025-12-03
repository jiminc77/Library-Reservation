import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiUrl = process.env.GIST_API_URL || 'https://library.gist.ac.kr:8443';
    return [
      {
        source: '/api/library/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
