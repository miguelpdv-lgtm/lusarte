import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build autocontenido para cualquier hosting Node (GoDaddy, Hostinger, VPS)
  output: "standalone",
  experimental: {
    // Fotos del panel: se reducen en el navegador antes de subir, pero dejamos margen
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
