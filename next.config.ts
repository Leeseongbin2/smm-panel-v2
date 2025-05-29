import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    esmExternals: false, // ✅ MUI ES Module 호환을 위한 설정
  },
};

export default nextConfig;