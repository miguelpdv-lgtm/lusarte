import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorePage } from "@/components/store/StorePage";
import { categoryHref, findCategory, subcategoryHref } from "@/data/catalog";
import { parseFilters } from "@/lib/catalog/params";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/tienda/[categoria]">): Promise<Metadata> {
  const category = findCategory((await params).categoria);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: categoryHref(category) },
  };
}

export default async function CategoriaPage({ params, searchParams }: PageProps<"/tienda/[categoria]">) {
  const [{ categoria }, sp] = await Promise.all([params, searchParams]);
  const category = findCategory(categoria);
  if (!category) notFound();

  return (
    <StorePage
      path={categoryHref(category)}
      title={category.name}
      intro={category.description}
      crumbs={[{ label: "Tienda", href: "/tienda" }, { label: category.short }]}
      scope={{ category: category.slug }}
      filters={parseFilters(sp)}
      tint={category.tint}
      chips={
        category.subcategories.length
          ? [
              { href: categoryHref(category), label: "Todo", active: true },
              ...category.subcategories.map((s) => ({ href: subcategoryHref(category, s), label: s.name })),
            ]
          : undefined
      }
    />
  );
}
