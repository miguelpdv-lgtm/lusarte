// Geometría simple para las zonas de domicilio (sin dependencias: la usan el servidor y el mapa del panel).

export type LatLng = [number, number];

/** ¿El punto está dentro del polígono? (ray casting; polígono como [lat, lng][]) */
export function inPolygon([lat, lng]: LatLng, polygon: LatLng[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Primera zona (en orden de prioridad) que contiene el punto. */
export function zoneIndexFor(point: LatLng, polygons: LatLng[][]) {
  return polygons.findIndex((p) => inPolygon(point, p));
}
