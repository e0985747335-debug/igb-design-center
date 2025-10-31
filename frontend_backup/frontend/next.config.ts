import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    turbo: false, // 關掉 Turbopack
  },
  turbopack: {}, // 防止警告
  webpack: (config) => {
    return config; // 強制回到 Webpack 編譯
  },
};

export default nextConfig;
