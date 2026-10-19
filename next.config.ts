import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El comprobante en PDF lee las fuentes y el logo del disco: que viajen con las funciones del servidor
  outputFileTracingIncludes: {
    "/**": ["./src/assets/fonts/**", "./public/email/**", "./drizzle/**"],
  },
  experimental: {
    // Fotos del panel: se reducen en el navegador antes de subir, pero dejamos margen
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
