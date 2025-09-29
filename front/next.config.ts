import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Optimize package imports for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // CSR deployment with Lambda@Edge
  trailingSlash: false,

  // Allow images from any HTTPS source
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Proxy configuration for local development to resolve CORS issues
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/:path*', // Beego backend
      },
    ];
  },
};

export default nextConfig;
