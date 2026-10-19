// Agrupa los artículos de Effi en productos de la tienda.
// En Effi cada presentación es un artículo ("FRAGANCIA CHINOLA 30 ML", "… 60 ML"): se separa el
// sufijo de presentación y los artículos con el mismo nombre base (y la misma categoría) forman un producto.

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();

/** "30 ML", "100 GR", "1 KG", "X KG", "X LB", "X MT" al final del nombre */
const SIZE = /\s+(?:X\s*)?(?:\d+(?:[.,/]\d+)?\s*)?(ML|GR|GRS|G|KG|KILO|KILOS|LB|LIBRA|LT|LITRO|CM|MM|MT|METRO|OZ|UND|UNID|UNIDADES)\.?$/;

const UNIT: Record<string, string> = { GRS: "gr", G: "gr", KILO: "kg", KILOS: "kg", LIBRA: "lb", LITRO: "lt", METRO: "metro", MT: "metro", UNID: "und", UNIDADES: "und" };

/**
 * base: clave sin tildes para agrupar · display: el mismo nombre base con sus tildes, para mostrar ·
 * label: la presentación ("30 ml") o null si el nombre no trae una.
 */
export function splitPresentation(name: string) {
  const original = name.replace(/\s+/g, " ").trim().toUpperCase();
  const n = normalize(original); // quitar tildes no cambia el largo: los índices sirven para ambos
  const m = n.match(SIZE);
  if (!m || m.index === 0) return { base: n, display: original, label: null as string | null };
  const raw = m[0].trim();
  const unit = m[1];
  const nice = UNIT[unit] ?? unit.toLowerCase();
  const amount = raw.replace(/^X\s*/, "").replace(unit, "").replace(/\.$/, "").trim();
  return { base: n.slice(0, m.index).trim(), display: original.slice(0, m.index).trim(), label: amount ? `${amount} ${nice}` : `Por ${nice}` };
}

export const groupKeyOf = (categoriaId: number | null, nombre: string) => `${categoriaId ?? 0}|${splitPresentation(nombre).base}`;

const ACRONYMS = new Set(["uv", "dtf", "mdf", "led", "xl"]);
const UNITS = new Set(["ml", "cm", "mm", "gr", "kg", "lb", "lt", "oz", "und"]);
const SMALL = new Set(["de", "del", "la", "las", "el", "los", "y", "con", "sin", "para", "en", "a", "x", "o"]);
/** "FRAGANCIA CALABAZA DULCE" → "Fragancia Calabaza Dulce"; siglas conocidas en mayúscula y unidades en minúscula */
export function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(" ")
    .map((w, i) => {
      if (i > 0 && SMALL.has(w)) return w;
      if (ACRONYMS.has(w)) return w.toUpperCase();
      if (UNITS.has(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

/** Tamaño numérico de una presentación para ordenarlas (30 ml antes que 125 ml). */
export function sizeOrder(label: string) {
  const n = parseFloat(label.replace(",", "."));
  return Number.isFinite(n) ? n : Infinity;
}
