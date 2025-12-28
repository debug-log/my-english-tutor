import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/my-english-tutor',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
