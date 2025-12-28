import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 开发服务器配置
  async rewrites() {
    // 服务端 rewrite 使用 Docker 内部网络地址
    const serverBackendUrl = process.env.INTERNAL_API_URL || 'http://backend:3000';
    return [
      {
        source: '/api/:path*',
        destination: `${serverBackendUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${serverBackendUrl}/uploads/:path*`,
      },
    ];
  },
  // 图片域名白名单
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
      {
        protocol: 'http',
        hostname: 'backend',
        port: '3000',
      },
    ],
  },
};

export default nextConfig;
