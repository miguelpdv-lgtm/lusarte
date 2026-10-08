import type { Metadata } from "next";
import { StorePage } from "@/components/store/StorePage";
import { categories, categoryHref } from "@/data/catalog";
import { parseFilters } from "@/lib/catalog/params";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tienda: insumos para hacer velas y velas artesanales",
  description:
    "Ceras, parafinas, fragancias, moldes de silicona, recipientes y complementos para hacer velas, y velas artesanales personalizadas. Envíos a toda Colombia.",
  alternates: { canonical: "/tienda" },
};

export default async function TiendaPage({ searchParams }: PageProps<"/tienda">) {
  const filters = parseFilters(await searchParams);
  return (
    <StorePage
      path="/tienda"
      title={filters.q ? "Resultados de búsqueda" : "Tienda"}
      intro="Todo lo que necesitas para hacer tus velas y nuestras velas hechas a mano, listas para regalar."
      crumbs={[{ label: "Tienda" }]}
      scope={{}}
      filters={filters}
      chips={categories.map((c) => ({ href: categoryHref(c), label: c.short }))}
    />
  );
}
