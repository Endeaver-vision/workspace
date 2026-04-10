import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Asset prefix ensures static files load from TrainHub's domain
  // even when HTML is served through office-apps proxy
  assetPrefix: process.env.NODE_ENV === 'production'
    ? 'https://trainhub-insighteyecare.vercel.app'
    : undefined,
};

export default nextConfig;
