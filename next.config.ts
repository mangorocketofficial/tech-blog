import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
      },
      {
        protocol: 'https',
        hostname: 'thumbnail*.coupangcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'image*.coupangcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'img.danawa.com',
      },
      {
        protocol: 'https',
        hostname: 'images.samsung.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
