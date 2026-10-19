"use client";

import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import type * as Leaflet from "leaflet";
import { useEffect, useRef } from "react";
import { zoneIndexFor, type LatLng } from "@/lib/shop/geo";

export type MapZone = { id: string; name: string; color: string; price: number; cod: boolean; polygon: LatLng[] };
export type MapBarrio = { id: number; name: string; city: string; lat: number; lng: number };

type Props = {
  zones: MapZone[];
  barrios: MapBarrio[];
  /** Geometría nueva de una zona (al dibujar o editar) */
  onGeometry: (id: string, polygon: LatLng[]) => void;
  /** Zona dibujada en el mapa */
  onCreate: (polygon: LatLng[]) => void;
  /** Zona borrada desde el mapa */
  onRemove: (id: string) => void;
};

const money = (n: number) => `$ ${n.toLocaleString("es-CO")}`;
const toLatLngs = (layer: Leaflet.Polygon): LatLng[] =>
  ((layer.getLatLngs()[0] as Leaflet.LatLng[]) ?? []).map((p) => [Math.round(p.lat * 1e6) / 1e6, Math.round(p.lng * 1e6) / 1e6]);

/**
 * Mapa de Barranquilla y Soledad: zonas de domicilio (polígonos editables con Geoman) y los barrios como puntos
 * pintados del color de su zona. El mapa es la fuente de la geometría; nombre, tarifa y color vienen del formulario.
 */
export function ZonesMap({ zones, barrios, onGeometry, onCreate, onRemove }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const L = useRef<typeof Leaflet | null>(null);
  const layers = useRef(new Map<string, Leaflet.Polygon>());
  const dots = useRef<Leaflet.CircleMarker[]>([]);
  const handlers = useRef({ onGeometry, onCreate, onRemove });
  handlers.current = { onGeometry, onCreate, onRemove };
  const zonesRef = useRef(zones);
  zonesRef.current = zones;

  // Crear el mapa una vez (Leaflet necesita el navegador)
  useEffect(() => {
    let cancelled = false;
    const layerMap = layers.current;
    (async () => {
      const leaflet = (await import("leaflet")).default;
      await import("@geoman-io/leaflet-geoman-free");
      if (cancelled || !box.current || map.current) return;
      L.current = leaflet;
      const m = leaflet.map(box.current, { zoomControl: true }).setView([10.965, -74.81], 12);
      leaflet
        .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        })
        .addTo(m);
      m.pm.setLang("es");
      m.pm.addControls({
        position: "topleft",
        drawMarker: false,
        drawCircleMarker: false,
        drawPolyline: false,
        drawRectangle: true,
        drawCircle: false,
        drawText: false,
        cutPolygon: false,
        rotateMode: false,
      });
      m.on("pm:create", (e) => {
        const poly = e.layer as Leaflet.Polygon;
        const coords = toLatLngs(poly);
        poly.remove(); // la capa definitiva la crea la sincronización con el estado
        if (coords.length >= 3) handlers.current.onCreate(coords);
      });
      map.current = m;
      sync();
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      layerMap.clear();
      dots.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Pinta los barrios del color de su zona (o gris si no tienen) */
  function paintBarrios() {
    const leaflet = L.current;
    const m = map.current;
    if (!leaflet || !m) return;
    const polys = zonesRef.current.map((z) => z.polygon);
    if (dots.current.length === 0) {
      dots.current = barrios.map((b) =>
        leaflet
          .circleMarker([b.lat, b.lng], { radius: 4, weight: 1, color: "#383939", fillOpacity: 0.9, pmIgnore: true } as Leaflet.CircleMarkerOptions)
          .bindTooltip(`${b.name} (${b.city})`)
          .addTo(m),
      );
    }
    barrios.forEach((b, i) => {
      const zi = zoneIndexFor([b.lat, b.lng], polys);
      dots.current[i].setStyle({ fillColor: zi >= 0 ? zonesRef.current[zi].color : "#ffffff" });
    });
  }

  /** Crea, actualiza o quita las capas según las zonas del formulario */
  function sync() {
    const leaflet = L.current;
    const m = map.current;
    if (!leaflet || !m) return;
    const ids = new Set(zonesRef.current.map((z) => z.id));
    for (const [id, layer] of layers.current) {
      if (!ids.has(id)) {
        layer.remove();
        layers.current.delete(id);
      }
    }
    zonesRef.current.forEach((z, i) => {
      let layer = layers.current.get(z.id);
      if (!layer) {
        layer = leaflet.polygon(z.polygon, { weight: 2 }).addTo(m);
        const id = z.id;
        const poly = layer;
        poly.on("pm:edit", () => handlers.current.onGeometry(id, toLatLngs(poly)));
        poly.on("pm:dragend", () => handlers.current.onGeometry(id, toLatLngs(poly)));
        poly.on("pm:remove", () => {
          layers.current.delete(id);
          handlers.current.onRemove(id);
        });
        layers.current.set(z.id, layer);
      }
      layer.setStyle({ color: z.color, fillColor: z.color, fillOpacity: 0.18 });
      layer.bindTooltip(`${i + 1}. ${z.name} · ${money(z.price)}${z.cod ? "" : " · sin contraentrega"}`, { sticky: true });
    });
    paintBarrios();
  }

  useEffect(sync);

  return <div ref={box} className="h-[30rem] w-full overflow-hidden rounded-xl border-2 border-carbon/80" role="application" aria-label="Mapa de zonas de domicilio" />;
}
