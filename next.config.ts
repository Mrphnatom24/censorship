import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Taurus Engine: Forzamos a que pii-filter sea manejado solo por Node.js
  //serverExternalPackages: ['pii-filter'],
};

export default nextConfig;
