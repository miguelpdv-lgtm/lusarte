// Taxonomía real de la tienda (a partir de las categorías de la clienta).
// Las categorías se quedan en el código (el panel no las edita); los productos guardan su slug.
//
// Consolidación de la lista original:
//   CERAS, PARAFINAS Y ADITIVOS        → Ceras y aditivos
//   FRAGANCIAS                          → Fragancias
//     FRAGANCIAS PREMIUM GATA GOLOSA    →   subcategoría
//     Fragancias difusores varitas      →   subcategoría
//   MOLDES                              → Moldes
//     moldes navidad 2026               →   subcategoría (y parte de la colección Navidad)
//   RECIPIENTES y empaques              → Recipientes y empaques
//   COMPLEMENTOS                        → Complementos
//     flores preservadas                →   subcategoría
//   velas y ambientadores               → Velas y ambientadores
//   Sale navidad                        → colección de temporada "Navidad" (no es categoría)

export type Subcategory = { slug: string; name: string };

export type Category = {
  slug: string;
  /** Nombre completo (títulos, SEO) */
  name: string;
  /** Nombre corto (menú, tarjetas) */
  short: string;
  description: string;
  /** Ícono de línea de /public/brand */
  icon: string;
  /** Color de marca de la tarjeta */
  tint: string;
  group: "insumos" | "velas";
  subcategories: Subcategory[];
};

export const categories: Category[] = [
  {
    slug: "ceras-y-aditivos",
    name: "Ceras, parafinas y aditivos",
    short: "Ceras y aditivos",
    description: "Cera de soya, parafina y aditivos para dar forma, dureza y acabado a tus velas.",
    icon: "/brand/icon-vela-cuadrada.svg",
    tint: "bg-miel",
    group: "insumos",
    subcategories: [],
  },
  {
    slug: "fragancias",
    name: "Fragancias",
    short: "Fragancias",
    description: "Esencias para velas y difusores, con la línea premium Gata Golosa.",
    icon: "/brand/icon-fosforo.svg",
    tint: "bg-lavanda",
    group: "insumos",
    subcategories: [
      { slug: "premium-gata-golosa", name: "Premium Gata Golosa" },
      { slug: "difusores-de-varitas", name: "Para difusores de varitas" },
      { slug: "hidrosolubles", name: "Hidrosolubles" },
    ],
  },
  {
    slug: "moldes",
    name: "Moldes",
    short: "Moldes",
    description: "Moldes para velas de todas las formas, con la colección Navidad 2026.",
    icon: "/brand/icon-vela-ondulada.svg",
    tint: "bg-cielo",
    group: "insumos",
    subcategories: [{ slug: "navidad-2026", name: "Navidad 2026" }],
  },
  {
    slug: "recipientes-y-empaques",
    name: "Recipientes y empaques",
    short: "Recipientes y empaques",
    description: "Frascos, vasos y empaques para presentar y vender tus velas.",
    icon: "/brand/icon-vela-frasco.svg",
    tint: "bg-oliva",
    group: "insumos",
    subcategories: [],
  },
  {
    slug: "complementos",
    name: "Complementos",
    short: "Complementos",
    description: "Herramientas, flores preservadas y detalles para completar tus creaciones.",
    icon: "/brand/icon-tijeras.svg",
    tint: "bg-arena",
    group: "insumos",
    subcategories: [
      { slug: "flores-preservadas", name: "Flores preservadas" },
      { slug: "papeleria", name: "Papelería" },
    ],
  },
  {
    slug: "velas-y-ambientadores",
    name: "Velas y ambientadores",
    short: "Velas y ambientadores",
    description: "Velas artesanales y ambientadores listos para regalar o disfrutar en casa.",
    icon: "/brand/icon-vela-plato.svg",
    tint: "bg-estrella",
    group: "velas",
    subcategories: [],
  },
];

export const insumos = categories.filter((c) => c.group === "insumos");
export const velas = categories.find((c) => c.group === "velas")!;

/** Colección de temporada: agrupa "Sale navidad" y "Moldes navidad 2026". */
export const navidad = {
  slug: "navidad",
  name: "Navidad",
  description: "Sale de Navidad y los nuevos moldes Navidad 2026.",
  href: "/coleccion/navidad",
};

export const categoryHref = (c: Category) => `/tienda/${c.slug}`;
export const subcategoryHref = (c: Category, s: Subcategory) => `/tienda/${c.slug}/${s.slug}`;

export const findCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const findSubcategory = (category: string, sub: string | null) =>
  sub ? findCategory(category)?.subcategories.find((s) => s.slug === sub) : undefined;

/**
 * Categorías de Effi (id de categoria_articulo) → categoría de la tienda.
 * Effi manda: el producto web toma la categoría del artículo. Si Effi crea una categoría nueva,
 * se agrega aquí; mientras tanto sus productos quedan ocultos y marcados en el panel.
 */
export const effiCategoryMap: Record<number, { category: string; subcategory?: string; navidad?: boolean }> = {
  1: { category: "moldes" },
  2: { category: "fragancias" },
  3: { category: "ceras-y-aditivos" },
  4: { category: "complementos", subcategory: "flores-preservadas" },
  5: { category: "complementos" },
  6: { category: "fragancias", subcategory: "premium-gata-golosa" },
  7: { category: "velas-y-ambientadores" },
  8: { category: "recipientes-y-empaques" },
  9: { category: "moldes", subcategory: "navidad-2026", navidad: true },
  10: { category: "fragancias", subcategory: "difusores-de-varitas" },
  11: { category: "complementos", subcategory: "papeleria" },
  12: { category: "fragancias", subcategory: "hidrosolubles" },
};
