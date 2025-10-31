import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: ".next",
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.infrastructureLogging = { level: "error" };
    return config;
  },
  experimental: {
    turbo: false,
  },
};

export default nextConfig;
