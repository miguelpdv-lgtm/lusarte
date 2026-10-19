// Genera src/data/colombia-effi.json: departamentos y municipios de Colombia con sus ids de Effi,
// para el checkout (listas) y la dirección del cliente en la remisión. Solo lee de Effi.
// Uso: npx tsx --env-file=.env.local scripts/effi-colombia.ts
import { writeFileSync } from "node:fs";
import { effiGetAll } from "../src/lib/effi/client";

const COLOMBIA = 47;

type Row = { id: string; nombre: string };

async function main() {
  const provincias = (await effiGetAll<Row>("provincia", { pais: COLOMBIA })).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const out = [];
  for (const p of provincias) {
    const ciudades = await effiGetAll<Row>("ciudad", { provincia: p.id });
    out.push({
      id: Number(p.id),
      name: p.nombre,
      cities: ciudades.map((c) => ({ id: Number(c.id), name: c.nombre })).sort((a, b) => a.name.localeCompare(b.name, "es")),
    });
  }
  writeFileSync("src/data/colombia-effi.json", JSON.stringify({ country: COLOMBIA, departments: out }));
  console.log(`${out.length} departamentos, ${out.reduce((n, d) => n + d.cities.length, 0)} municipios`);
}

main();
