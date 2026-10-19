import "server-only";
import { wompiConfig } from "@/lib/shop/config";

/**
 * ¿Se permite que Google indexe el sitio? Por defecto, solo cuando la tienda vende de verdad (llaves de producción
 * de Wompi): así las pruebas y los previews no aparecen en buscadores. SEO_INDEX=1 lo fuerza; SEO_INDEX=0 lo apaga.
 */
export function seoIndexing() {
  const flag = process.env.SEO_INDEX?.trim();
  if (flag === "1") return true;
  if (flag === "0") return false;
  return wompiConfig()?.sandbox === false;
}
