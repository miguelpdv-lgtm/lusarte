import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans, Patrick_Hand } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

// Manuscrita para títulos de sección (en línea con el lettering a mano del manual)
const patrickHand = Patrick_Hand({
  variable: "--font-patrick",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Lusarte · Velas artesanales e insumos para hacer velas",
    template: "%s · Lusarte",
  },
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: site.name,
  },
  // TODO(lanzamiento): quitar cuando el sitio salga en lusarte.net con datos reales.
  // Mientras tanto, los despliegues de prueba (Vercel) no se indexan en Google.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#efebe0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CO" data-scroll-behavior="smooth" className={`${bricolage.variable} ${dmSans.variable} ${patrickHand.variable}`}>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
