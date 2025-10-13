import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',

  // Optimize images
  images: {
    unoptimized: true, // Required for static export
  },

  // Add trailing slashes for better caching
  trailingSlash: true,

  // Optimize production build
  compress: true,

  // Enable React strict mode for better performance
  reactStrictMode: true,

  // Optimize bundling
  poweredByHeader: false,
};

export default nextConfig;
