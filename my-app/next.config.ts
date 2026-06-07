import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'lh3.googleusercontent.com',
    },
    {
      protocol: 'https',
      hostname: 'atharva102050.s3.ap-south-1.amazonaws.com',
    },
  ],
},
};
export default nextConfig;