import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    'toth-server.local',
    '192.168.86.123',
  ],
};

export default nextConfig;
