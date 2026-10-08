import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorePage } from "@/components/store/StorePage";
import { categoryHref, findCategory, subcategoryHref } from "@/data/catalog";
import { parseFilters } from "@/lib/catalog/params";

export const dynamic = "force-dynamic";

function resolve(categoria: string, sub: string) {
  const category = findCategory(categoria);
  const subcategory = category?.subcategories.find((s) => s.slug === sub);
  return category && subcategory ? { category, subcategory } : null;
}

export async function generateMetadata({ params }: PageProps<"/tienda/[categoria]/[sub]">): Promise<Metadata> {
  const { categoria, sub } = await params;
  const found = resolve(categoria, sub);
  if (!found) return {};
  return {
    title: `${found.subcategory.name} · ${found.category.short}`,
    description: `${found.subcategory.name}: ${found.category.description}`,
    alternates: { canonical: subcategoryHref(found.category, found.subcategory) },
  };
}

export default async function SubcategoriaPage({ params, searchParams }: PageProps<"/tienda/[categoria]/[sub]">) {
  const [{ categoria, sub }, sp] = await Promise.all([params, searchParams]);
  const found = resolve(categoria, sub);
  if (!found) notFound();
  const { category, subcategory } = found;

  return (
    <StorePage
      path={subcategoryHref(category, subcategory)}
      title={subcategory.name}
      intro={category.description}
      crumbs={[
        { label: "Tienda", href: "/tienda" },
        { label: category.short, href: categoryHref(category) },
        { label: subcategory.name },
      ]}
      scope={{ category: category.slug, subcategory: subcategory.slug }}
      filters={parseFilters(sp)}
      tint={category.tint}
      chips={[
        { href: categoryHref(category), label: "Todo" },
        ...category.subcategories.map((s) => ({ href: subcategoryHref(category, s), label: s.name, active: s.slug === subcategory.slug })),
      ]}
    />
  );
}
