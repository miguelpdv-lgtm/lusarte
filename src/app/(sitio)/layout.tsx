import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

/** Páginas públicas: header, contenido y footer. El panel (/admin) tiene su propio layout. */
export default function SitioLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only z-50 rounded-full bg-carbon px-4 py-2 text-crema focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Saltar al contenido
      </a>
      <Header />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
