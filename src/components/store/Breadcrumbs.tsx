import Link from "next/link";
import { site } from "@/lib/site";

export type Crumb = { label: string; href?: string };

/** Migas de pan visibles + su JSON-LD (BreadcrumbList) para Google. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: "Inicio", href: "/" }, ...items];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: new URL(c.href, site.url).toString() } : {}),
    })),
  };
  return (
    <nav aria-label="Estás en">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-carbon/70">
        {all.map((c, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">/</span>}
            {c.href && i < all.length - 1 ? (
              <Link href={c.href} className="underline-offset-4 hover:underline">
                {c.label}
              </Link>
            ) : (
              <span aria-current={i === all.length - 1 ? "page" : undefined}>{c.label}</span>
            )}
          </li>
        ))}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </nav>
  );
}
