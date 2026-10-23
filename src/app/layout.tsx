import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans, Patrick_Hand, Sedgwick_Ave } from "next/font/google";
import { seoIndexing } from "@/lib/seo";
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
// Lettering "Iluminando tu vida": trazo de marcador, la más cercana al logo dibujado a mano
const sedgwick = Sedgwick_Ave({
  variable: "--font-sedgwick",
  weight: "400",
  subsets: ["latin"],
});

const patrickHand = Patrick_Hand({
  variable: "--font-patrick",
  weight: "400",
  subsets: ["latin"],
});

// Cada página define su canonical; aquí solo lo común. La indexación se abre al lanzar (src/lib/seo.ts).
export function generateMetadata(): Metadata {
  const index = seoIndexing();
  const verification = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  return {
    metadataBase: new URL(site.url),
    title: {
      default: "Lusarte · Insumos para hacer velas y velas artesanales",
      template: "%s · Lusarte",
    },
    description: site.description,
    applicationName: site.name,
    keywords: ["insumos para velas", "cera de soya", "parafina", "fragancias para velas", "moldes para velas", "velas artesanales", "Barranquilla", "Colombia"],
    openGraph: { type: "website", locale: "es_CO", siteName: site.name },
    twitter: { card: "summary_large_image" },
    robots: index ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } } : { index: false, follow: false },
    ...(verification ? { verification: { google: verification } } : {}),
  };
}

export const viewport: Viewport = {
  themeColor: "#efebe0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CO" data-scroll-behavior="smooth" className={`${bricolage.variable} ${dmSans.variable} ${patrickHand.variable} ${sedgwick.variable}`}>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
