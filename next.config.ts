import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SSR mode — required for Clerk middleware
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "img.clerk.com" },
    ],
  },
};

export default nextConfig;
