import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  reactCompiler: true,
  allowedDevOrigins: ["192.168.100.227", "192.168.101.42", "192.168.103.6"],
};

export default nextConfig;
