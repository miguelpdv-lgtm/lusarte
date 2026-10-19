import "server-only";
import data from "@/data/colombia-effi.json";

// Departamentos y municipios de Colombia con sus ids de Effi (generado con scripts/effi-colombia.ts).

export const COLOMBIA = data.country;

type Department = (typeof data.departments)[number];

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const byId = new Map<number, Department>(data.departments.map((d) => [d.id, d]));

/** Departamentos para el checkout. */
export const departmentOptions = () => data.departments.map((d) => ({ id: d.id, name: d.name }));

export const findDepartment = (id: number) => byId.get(id) ?? null;

/** Municipios de un departamento (nombres, para autocompletar). */
export function cityNames(departmentId: number) {
  return byId.get(departmentId)?.cities.map((c) => c.name) ?? [];
}

/** Busca el municipio por nombre dentro del departamento (sin tildes ni mayúsculas). */
export function findCity(departmentId: number, name: string) {
  const target = norm(name);
  return byId.get(departmentId)?.cities.find((c) => norm(c.name) === target) ?? null;
}
