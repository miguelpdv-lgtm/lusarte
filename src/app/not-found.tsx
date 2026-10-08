import Image from "next/image";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ButtonLink } from "@/components/ui/ButtonLink";

// En la raíz: atiende las URL que no existen y los notFound() de la tienda y del panel.
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="contenido" className="flex-1">
    <div className="mx-auto grid max-w-xl justify-items-center px-4 py-20 text-center">
      <Image src="/brand/sticker-fosforo.webp" alt="" width={720} height={470} className="w-40 -rotate-12" />
      <h1 className="mt-6 font-hand text-5xl">Esta página se apagó</h1>
      <p className="mt-3 text-carbon-suave">No encontramos lo que buscabas. Puede que el producto ya no esté o que el enlace haya cambiado.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/tienda">Ver la tienda</ButtonLink>
        <ButtonLink href="/" variant="light">
          Ir al inicio
        </ButtonLink>
      </div>
    </div>
      </main>
      <Footer />
    </>
  );
}
