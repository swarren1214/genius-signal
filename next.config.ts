import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.logo.dev", pathname: "/**" },
    ],
  },
};

export default nextConfig;
