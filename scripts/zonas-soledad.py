# Genera src/data/zonas-soledad.json: las 5 zonas de domicilio de Soledad (lista de barrios que envió Lusarte) como
# polígonos para Panel → Envíos. También agrega a src/data/barrios.json los lugares de la lista que no traía
# (con ids nuevos al final, para no cambiar los de los barrios que ya existen).
#
# Cómo se arma cada zona:
# 1. Los barrios clave de la lista marcan la zona. Cualquier otro barrio de Soledad toma la zona del barrio clave más
#    cercano (la zona 5, aeropuerto e industrial, es solo la de sus puntos: no "absorbe" barrios residenciales).
# 2. Cada barrio se queda con el área más cercana a él que a cualquier otro barrio (de Soledad o de Barranquilla) y la
#    zona es la unión de esas áreas, recortada alrededor de Soledad. Así ningún barrio de Barranquilla cae en una zona
#    de Soledad y cada barrio de Soledad cae en la suya.
#
# Uso: python scripts/zonas-soledad.py   (requiere shapely y scipy: python -m pip install shapely scipy)
import json, re, unicodedata
from collections import Counter, defaultdict

import numpy as np
from scipy.spatial import Voronoi
from shapely.geometry import MultiPoint, Point, Polygon
from shapely.ops import unary_union

BARRIOS = "src/data/barrios.json"

def norm(s):
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"^(barrio|urbanizacion|urb\.?|urbano|conjunto|sector)\s+", "", s)
    return re.sub(r"[^a-z0-9]+", " ", s).strip()

# Lugares de la lista que OpenStreetMap no trae como barrio (coordenadas de Nominatim/OSM)
EXTRAS = [
    {"name": "Cachimbero", "lat": 10.9198, "lng": -74.76026},
    {"name": "Aeropuerto Ernesto Cortissoz", "lat": 10.88795, "lng": -74.77949},
    {"name": "Bodegas Calle 30 salida a Malambo", "lat": 10.8985, "lng": -74.7860},
    {"name": "Parque Industrial Malambo (PIMSA)", "lat": 10.83564, "lng": -74.76671},
]

# (nombre de la zona, color, tarifa provisional, patrones de barrios clave: el nombre normalizado empieza por el patrón)
ZONES = [
    ("Soledad 1 · Frontera / Norte", "#5b8f7a", 6000, [
        "los robles", "altos de los robles", "las moras", "villa las moras", "villa muvdi", "las trinitarias",
        "villa katanga", "villa estadio", "jardin de villa estadio", "el parque", "la arboleda", "ciudad transmetro",
    ]),
    ("Soledad 2 · Centro e Histórica", "#c9b458", 8000, [
        "hipodromo", "centro", "cachimbero", "salamanca", "el ferrocarril", "costa hermosa", "vista hermosa",
        "cruz de mayo", "la loma", "pumarejo",
    ]),
    ("Soledad 3 · Metropolitana", "#d39a5b", 10000, [
        "ciudadela metropolitana", "altos de la metropolitana", "soledad 2000", "el manantial", "los almendros",
        "altos de los almendros", "reserva de los almendros", "almendros campestre", "antonio narino", "villa adela",
        "las gaviotas", "los cusules", "ciudad camelot", "villa carmen",
    ]),
    ("Soledad 4 · Periférica / Sur", "#c46b7c", 12000, [
        "la central", "don bosco", "ciudad bolivar", "san antonio", "hacienda san antonio", "vinas del rey",
        "las nubes", "portal de las moras", "las colonias",
    ]),
    ("Soledad 5 · Aeropuerto e Industrial", "#7c6fc4", 15000, [
        "aeropuerto ernesto cortissoz", "bodegas calle 30", "parque industrial malambo", "cabica",
    ]),
]
# "Portal de Las Moras" es de la zona 4 aunque empiece como "Las Moras" de la zona 1: los patrones más largos ganan
PATTERNS = sorted(((p, i) for i, z in enumerate(ZONES) for p in z[3]), key=lambda t: -len(t[0]))

def key_zone(name):
    n = norm(name)
    for p, i in PATTERNS:
        if n == p or n.startswith(p + " "):
            return i
    return None

data = json.load(open(BARRIOS, encoding="utf-8"))
barrios = data["barrios"]
have = {(b["city"], norm(b["name"])) for b in barrios}
next_id = max(b["id"] for b in barrios) + 1
for e in EXTRAS:
    if ("Soledad", norm(e["name"])) not in have:
        barrios.append({"name": e["name"], "city": "Soledad", "lat": e["lat"], "lng": e["lng"], "area": None, "id": next_id})
        next_id += 1
json.dump(data, open(BARRIOS, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

sol = [b for b in barrios if b["city"] == "Soledad"]
xy = lambda b: (b["lng"], b["lat"])  # shapely usa (x=lng, y=lat)

# 1. Zona de cada barrio de Soledad
zone_of = {}
keys = defaultdict(list)
for b in sol:
    z = key_zone(b["name"])
    if z is not None:
        zone_of[b["id"]] = z
        keys[z].append(b)
missing = [p for p, i in PATTERNS if not any(key_zone(b["name"]) == i and (norm(b["name"]) == p or norm(b["name"]).startswith(p + " ")) for b in sol)]
for b in sol:
    if b["id"] in zone_of:
        continue
    # escala de longitud a la latitud de Soledad para medir distancias reales
    k = np.cos(np.radians(10.9))
    best = min(((((b["lat"] - c["lat"]) ** 2 + ((b["lng"] - c["lng"]) * k) ** 2), z) for z in range(4) for c in keys[z]))
    zone_of[b["id"]] = best[1]

# 2. Áreas (Voronoi) de todos los barrios, con puntos lejanos para cerrar las del borde
pts = [xy(b) for b in barrios]
far = [(-75.4, 10.4), (-75.4, 11.4), (-74.2, 10.4), (-74.2, 11.4)]
vor = Voronoi(np.array(pts + far))

# Suavizado: un barrio que no está en la lista toma la zona de la mayoría de sus vecinos (los de la lista no cambian).
# Evita islas de una zona dentro de otra por barrios sueltos.
is_key = {b["id"] for b in sol if key_zone(b["name"]) is not None}
sol_ix = {i for i, b in enumerate(barrios) if b["city"] == "Soledad"}
neighbors = defaultdict(set)
for i, j in vor.ridge_points:
    if i in sol_ix and j in sol_ix:
        neighbors[i].add(j); neighbors[j].add(i)
for _ in range(30):
    changed = 0
    for i in sol_ix:
        b = barrios[i]
        if b["id"] in is_key or not neighbors[i]:
            continue
        votes = Counter(zone_of[barrios[j]["id"]] for j in neighbors[i] if zone_of[barrios[j]["id"]] != 4)
        if votes:
            top, n = votes.most_common(1)[0]
            if top != zone_of[b["id"]] and n > votes.get(zone_of[b["id"]], 0):
                zone_of[b["id"]] = top; changed += 1
    if not changed:
        break
def cell(i):
    region = vor.regions[vor.point_region[i]]
    return Polygon([vor.vertices[v] for v in region]) if region and -1 not in region else None

# Recorte: alrededor de Soledad (unos 700 m más allá de sus barrios)
clip = MultiPoint([xy(b) for b in sol]).convex_hull.buffer(0.0065)
idx = {b["id"]: i for i, b in enumerate(barrios)}
cells = defaultdict(list)
for b in sol:
    c = cell(idx[b["id"]])
    cells[zone_of[b["id"]]].append(c.intersection(clip))

out = []
for z, (name, color, price, _) in enumerate(ZONES):
    shape = unary_union(cells[z]).buffer(0.0004).buffer(-0.0004)  # cierra rendijas entre áreas
    parts = list(shape.geoms) if shape.geom_type == "MultiPolygon" else [shape]
    for n, part in enumerate(sorted(parts, key=lambda p: -p.area), 1):
        ring = Polygon(part.exterior).simplify(0.00015, preserve_topology=True)
        coords = [[round(y, 6), round(x, 6)] for x, y in list(ring.exterior.coords)[:-1]]
        out.append({"name": name if len(parts) == 1 else f"{name} ({n})", "color": color, "price": price, "polygon": coords, "_zone": z, "_holes": len(part.interiors)})

# Si el contorno de una pieza encierra a otra (zona con hueco), la de adentro va primero: manda la primera que contiene
order = []
rest = out[:]
while rest:
    for o in rest:
        poly = Polygon([(p[1], p[0]) for p in o["polygon"]])
        inner = [q for q in rest if q is not o and poly.contains(Polygon([(p[1], p[0]) for p in q["polygon"]]).representative_point())]
        if not inner:
            order.append(o); rest.remove(o); break
    else:
        order += rest; break
out = order

# 3. Verificación: cada barrio de Soledad en su zona y ningún barrio de Barranquilla dentro de Soledad
def zone_at(lat, lng):
    for o in out:
        if Polygon([(p[1], p[0]) for p in o["polygon"]]).contains(Point(lng, lat)):
            return o["_zone"]
    return None
bad = [(b["name"], zone_of[b["id"]], zone_at(b["lat"], b["lng"])) for b in sol if zone_at(b["lat"], b["lng"]) != zone_of[b["id"]]]
baq = [b["name"] for b in barrios if b["city"] == "Barranquilla" and zone_at(b["lat"], b["lng"]) is not None]
print("piezas:", [(o["name"], len(o["polygon"]), "huecos", o["_holes"]) for o in out])
print("barrios por zona:", Counter(ZONES[zone_of[b["id"]]][0] for b in sol))
print("patrones sin barrio:", missing)
print("mal ubicados:", bad)
print("Barranquilla dentro de Soledad:", baq)
for o in out:
    o.pop("_zone"); o.pop("_holes")
json.dump({"source": "Zonas de domicilio de Soledad enviadas por Lusarte; barrios © colaboradores de OpenStreetMap (ODbL).", "zones": out},
          open("src/data/zonas-soledad.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
