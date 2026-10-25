import type { Metadata } from "next";
import { HeroPhotoForm } from "@/components/admin/HeroPhotoForm";
import { requireAdmin } from "@/lib/auth/session";
import { getHeroPhotos } from "@/lib/home/hero";
import { HERO_MOBILE_ASPECT, HERO_MOBILE_CROP } from "@/components/home/hero-layout";

export const metadata: Metadata = { title: "Portada" };
export const dynamic = "force-dynamic";

export default async function PortadaAdmin() {
  await requireAdmin();
  const { desktop, mobile } = await getHeroPhotos();
  return (
    <div className="grid max-w-3xl grid-cols-1 gap-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Portada</h1>
        <p className="mt-1 text-sm text-carbon-suave">
          La foto grande del inicio. Los cambios se ven en la tienda apenas guardas. JPG, PNG o WebP de hasta 15 MB.
        </p>
      </div>
      <HeroPhotoForm
        slot="desktop"
        title="Foto en computador"
        hint="Panorámica (unos 2400 × 1000 px) con los productos a la derecha y espacio libre a la izquierda, donde va el texto."
        current={desktop}
        aspect="21/9"
        position="right center"
        resetLabel="Volver a la foto original"
      />
      <HeroPhotoForm
        slot="mobile"
        title="Foto en celular (opcional)"
        hint={
          mobile
            ? "Va debajo del texto, recortada casi cuadrada. Deja los productos en el centro."
            : "Sin foto propia, en celular se usa la de computador recortada sobre los productos (así se ve abajo). Si subes una, que sea casi cuadrada y con los productos en el centro."
        }
        current={mobile ?? desktop}
        aspect={HERO_MOBILE_ASPECT}
        position={mobile ? "center" : HERO_MOBILE_CROP}
        resetLabel="Quitar y usar la de computador"
      />
    </div>
  );
}
