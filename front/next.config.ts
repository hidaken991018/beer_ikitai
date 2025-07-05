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
};

export default nextConfig;
