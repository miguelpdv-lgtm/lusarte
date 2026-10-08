import type { Metadata } from "next";
import { StorePage } from "@/components/store/StorePage";
import { navidad } from "@/data/catalog";
import { parseFilters } from "@/lib/catalog/params";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Colección Navidad",
  description: "Moldes de Navidad 2026, fragancias navideñas y ofertas de temporada para hacer tus velas.",
  alternates: { canonical: navidad.href },
};

export default async function NavidadPage({ searchParams }: PageProps<"/coleccion/navidad">) {
  return (
    <StorePage
      path={navidad.href}
      title="Colección Navidad"
      intro="Moldes de Navidad 2026, fragancias de temporada y ofertas para que tus velas lleguen a tiempo a la Navidad."
      crumbs={[{ label: "Tienda", href: "/tienda" }, { label: "Navidad" }]}
      scope={{ navidad: true }}
      filters={parseFilters(await searchParams)}
      tint="bg-estrella"
    />
  );
}
