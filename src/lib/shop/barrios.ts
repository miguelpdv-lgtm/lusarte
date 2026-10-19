import "server-only";
import data from "@/data/barrios.json";

// Barrios de Barranquilla y Soledad con un punto cada uno (generado con scripts/barrios.py: Alcaldía de Barranquilla
// y OpenStreetMap). El domicilio se cobra según la zona (polígono de Panel → Envíos) en la que cae el barrio.

import type { LatLng } from "./geo";

export type Barrio = { id: number; name: string; city: string; lat: number; lng: number; area: string | null };
export type { LatLng };
export { inPolygon } from "./geo";

export const BARRIOS_SOURCE = data.source;
const all = data.barrios as Barrio[];
const byId = new Map(all.map((b) => [b.id, b]));

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/** Municipios que tienen barrios (el domicilio ahí se cobra por zonas). */
export const BARRIO_CITIES = [...new Set(all.map((b) => b.city))];
export const hasBarrios = (cityName: string) => BARRIO_CITIES.some((c) => norm(c) === norm(cityName));

export const barriosOf = (cityName: string) => all.filter((b) => norm(b.city) === norm(cityName));
export const findBarrio = (id: number) => byId.get(id) ?? null;
export const allBarrios = () => all;

/** Distancia aproximada en metros (equirectangular: suficiente dentro de una ciudad). */
function meters(a: LatLng, b: LatLng) {
  const rad = Math.PI / 180;
  const x = (b[1] - a[1]) * rad * Math.cos(((a[0] + b[0]) / 2) * rad);
  const y = (b[0] - a[0]) * rad;
  return Math.sqrt(x * x + y * y) * 6_371_000;
}

/** Barrios más cercanos a un punto (para "Usar mi ubicación"). */
export function nearestBarrios(cityName: string, point: LatLng, n = 5) {
  return barriosOf(cityName)
    .map((b) => ({ b, d: meters(point, [b.lat, b.lng]) }))
    .sort((x, y) => x.d - y.d)
    .slice(0, n)
    .map(({ b, d }) => ({ ...b, meters: Math.round(d) }));
}

/** Envolvente convexa (para las zonas iniciales por localidad). */
export function convexHull(points: LatLng[]): LatLng[] {
  const pts = [...points].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  if (pts.length < 3) return pts;
  const cross = (o: LatLng, a: LatLng, b: LatLng) => (a[1] - o[1]) * (b[0] - o[0]) - (a[0] - o[0]) * (b[1] - o[1]);
  const lower: LatLng[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: LatLng[] = [];
  for (const p of pts.toReversed()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** Agranda un polígono ~margen alrededor de su centro (para que los barrios del borde queden dentro). */
export function inflate(polygon: LatLng[], factor = 1.06): LatLng[] {
  const c: LatLng = [polygon.reduce((s, p) => s + p[0], 0) / polygon.length, polygon.reduce((s, p) => s + p[1], 0) / polygon.length];
  return polygon.map(([la, ln]) => [c[0] + (la - c[0]) * factor, c[1] + (ln - c[1]) * factor]);
}
