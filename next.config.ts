import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // No asset prefix needed - serving directly from trainhub.oculogicgroup.com
};

export default nextConfig;
