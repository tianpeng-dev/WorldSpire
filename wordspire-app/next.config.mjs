/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@next/env"],
  webpack(config, { dev }) {
    if (!dev) config.cache = false;
    return config;
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "1mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  // 孩子端 PWA 相关 Service Worker 注册在 app/layout 中处理
  poweredByHeader: false,
};

export default nextConfig;
