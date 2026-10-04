import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
    // AVIF is roughly 20% smaller than WebP; browsers that can't show it get WebP.
    formats: ["image/avif", "image/webp"],
    // Photo URLs never change (each upload gets a unique name), so optimised copies can be cached for a month.
    minimumCacheTTL: 2678400,
    // Fewer, well-spaced sizes means fewer versions to generate and better cache hits.
    deviceSizes: [384, 640, 828, 1080, 1440, 1920],
    imageSizes: [64, 128, 256],
    qualities: [70, 75],
  },
};

export default nextConfig;
