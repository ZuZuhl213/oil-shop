import type { NextConfig } from "next";

const imageHost = process.env.NEXT_PUBLIC_SUPABASE_IMAGE_HOST;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: imageHost
      ? [{ protocol: "https", hostname: imageHost }]
      : [],
  },
};

export default nextConfig;
