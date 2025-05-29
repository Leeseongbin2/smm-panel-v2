/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // ✅ 추가
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    esmExternals: false, // ← 이것이 핵심
  },
};

module.exports = nextConfig;