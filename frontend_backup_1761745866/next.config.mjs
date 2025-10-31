/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    return config;
  },
  // 關掉實驗性 turbopack
  experimental: {
    turbo: false,
  },
};

export default nextConfig;
