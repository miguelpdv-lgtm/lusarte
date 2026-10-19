# Genera src/data/barrios.json: barrios de Barranquilla y Soledad con un punto (lat, lng) cada uno, para que el
# comprador elija su barrio y la tienda calcule el domicilio según la zona (polígono) de Panel → Envíos.
#
# Fuentes:
# - Barranquilla: "Barrios de Barranquilla según POT" (datos.gov.co, qui6-qeux), Alcaldía de Barranquilla: 189 barrios oficiales
#   con su polígono (se usa el centro) y su localidad.
# - Barranquilla y Soledad: OpenStreetMap (Overpass API, © colaboradores de OpenStreetMap, ODbL): barrios, urbanizaciones y
#   sectores (place=neighbourhood|suburb|quarter). Para Barranquilla solo se agregan los que no están ya en la lista oficial.
#
# Uso: python scripts/barrios.py
import json, re, time, unicodedata, urllib.error, urllib.request, urllib.parse

# Área metropolitana (sur, oeste, norte, este): evita otros municipios llamados "Soledad" en el mundo
BBOX = "10.80,-74.95,11.10,-74.70"

UA = {"User-Agent": "LusarteWeb/1.0 (tienda lusarte.net)", "Accept": "application/json"}

def get(url, data=None, tries=5):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, data=data, headers=UA)
            with urllib.request.urlopen(req, timeout=180) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            # Overpass responde 429/502/504 cuando está saturado: esperar y reintentar
            if e.code not in (429, 502, 503, 504) or i == tries - 1:
                raise
            time.sleep(15 * (i + 1))

def norm(s):
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"^(barrio|urbanizacion|urb\.?|conjunto|sector)\s+", "", s)
    return re.sub(r"[^a-z0-9]+", " ", s).strip()

def title(s):
    small = {"de", "del", "la", "las", "los", "el", "y", "e"}
    words = s.strip().lower().split()
    out = []
    for i, w in enumerate(words):
        if re.fullmatch(r"[ivx]+", w):
            out.append(w.upper())
        elif i > 0 and w in small:
            out.append(w)
        else:
            out.append(w[:1].upper() + w[1:])
    return " ".join(out)

def centroid(geom):
    # Centro del anillo exterior más grande (fórmula del área de Gauss)
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    best, best_a = None, 0
    for poly in polys:
        ring = poly[0]
        a = cx = cy = 0.0
        for (x1, y1), (x2, y2) in zip(ring, ring[1:]):
            c = x1 * y2 - x2 * y1
            a += c; cx += (x1 + x2) * c; cy += (y1 + y2) * c
        if abs(a) > best_a:
            best_a = abs(a); best = (cy / (3 * a), cx / (3 * a))
    return best

def display(name):
    name = name.strip()
    # "Barrio Abajo" es el nombre real del barrio: no se recorta
    return name if re.fullmatch(r"(?i)barrio abajo", name) else re.sub(r"^(Barrio|BARRIO)\s+", "", name)

barrios = []
seen = set()

# OpenStreetMap (con tildes) por municipio
def overpass(area_filter):
    q = """[out:json][timeout:120];
area{area_filter}->.a;
nwr["place"~"neighbourhood|suburb|quarter"]["name"](area.a)({BBOX});
out center tags;""".replace("{area_filter}", area_filter).replace("{BBOX}", BBOX)
    return get("https://overpass-api.de/api/interpreter", urllib.parse.urlencode({"data": q}).encode())["elements"]

CITIES = [
    ("Barranquilla", '["name"="Barranquilla"]["boundary"="administrative"]'),
    ("Soledad", '["name"="Soledad"]["boundary"="administrative"]'),
]
osm = {city: overpass(filt) for city, filt in CITIES}
accented = {norm(e["tags"]["name"]): display(e["tags"]["name"]) for e in osm["Barranquilla"]}

# 1. Barranquilla oficial
oficial = get("https://www.datos.gov.co/resource/qui6-qeux.json?$limit=1000")
for r in oficial:
    geom = r["the_geom"]
    if isinstance(geom, str):
        geom = json.loads(geom.replace("'", '"'))
    lat, lng = centroid(geom)
    if not r.get("nombre"):
        continue
    name = accented.get(norm(r["nombre"])) or title(r["nombre"])
    key = ("Barranquilla", norm(name))
    if key in seen:
        continue
    seen.add(key)
    barrios.append({"name": name, "city": "Barranquilla", "lat": round(lat, 6), "lng": round(lng, 6), "area": r.get("localidad") or None})

# 2. OpenStreetMap: los que no están en la lista oficial
for city, _ in CITIES:
    for e in osm[city]:
        lat = e.get("lat") or e.get("center", {}).get("lat")
        lng = e.get("lon") or e.get("center", {}).get("lon")
        if not lat or not lng:
            continue
        # "Primero de Mayo | El Ferry": dos nombres para el mismo lugar
        for part in e["tags"]["name"].split("|"):
            name = display(part)
            if not name or norm(name) == norm(city):
                continue
            key = (city, norm(name))
            if key in seen:
                continue
            seen.add(key)
            barrios.append({"name": name[:1].upper() + name[1:], "city": city, "lat": round(lat, 6), "lng": round(lng, 6), "area": None})

barrios.sort(key=lambda b: (b["city"], norm(b["name"])))
for i, b in enumerate(barrios, 1):
    b["id"] = i

out = {
    "source": "Barranquilla: datos.gov.co qui6-qeux (Alcaldía de Barranquilla, POT). Barranquilla y Soledad: © colaboradores de OpenStreetMap (ODbL).",
    "barrios": barrios,
}
with open("src/data/barrios.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
from collections import Counter
print(Counter(b["city"] for b in barrios), "total", len(barrios))
