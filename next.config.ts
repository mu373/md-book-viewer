import type { NextConfig } from "next";

const allowedDevOrigins = process.env.NEXT_ALLOWED_DEV_ORIGINS
  ?.split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  output: 'export',

  allowedDevOrigins,

  typescript: {
    ignoreBuildErrors: true,
  },

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
