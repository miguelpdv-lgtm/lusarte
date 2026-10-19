import "server-only";
import { db } from "@/lib/db";
import { salesSince } from "@/lib/effi/sync";

// Estadísticas del panel a partir de las remisiones de venta de Effi (copia local en effi_sales).
// Las fechas se agrupan en hora de Colombia (UTC−5, sin horario de verano).

const OFFSET = 5 * 3_600_000;
const DAY = 86_400_000;
/** Fecha local (Colombia) en YYYY-MM-DD */
const localDay = (d: Date) => new Date(d.getTime() - OFFSET).toISOString().slice(0, 10);
const localMonth = (d: Date) => localDay(d).slice(0, 7);

export type Period = { total: number; count: number; avg: number };

function summarize(rows: { total: number }[]): Period {
  const total = rows.reduce((s, r) => s + r.total, 0);
  return { total, count: rows.length, avg: rows.length ? Math.round(total / rows.length) : 0 };
}

export async function salesStats() {
  const now = new Date();
  const todayKey = localDay(now);
  const since = new Date(now.getTime() - 400 * DAY);
  const rows = (await salesSince(db, since)).map((r) => ({ ...r, day: localDay(r.fecha), month: localMonth(r.fecha) }));

  const last30 = rows.filter((r) => r.fecha.getTime() >= now.getTime() - 30 * DAY);
  const prev30 = rows.filter((r) => r.fecha.getTime() < now.getTime() - 30 * DAY && r.fecha.getTime() >= now.getTime() - 60 * DAY);
  const thisMonth = rows.filter((r) => r.month === todayKey.slice(0, 7));

  // Últimos 12 meses (incluido el actual), en orden
  const months: { key: string; total: number; count: number }[] = [];
  const cursor = new Date(`${todayKey.slice(0, 7)}-15T12:00:00Z`);
  for (let i = 11; i >= 0; i--) {
    const d = new Date(cursor);
    d.setUTCMonth(d.getUTCMonth() - i);
    const key = d.toISOString().slice(0, 7);
    const list = rows.filter((r) => r.month === key);
    months.push({ key, total: list.reduce((s, r) => s + r.total, 0), count: list.length });
  }

  // Últimos 30 días
  const days: { key: string; total: number; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const key = localDay(new Date(now.getTime() - i * DAY));
    const list = rows.filter((r) => r.day === key);
    days.push({ key, total: list.reduce((s, r) => s + r.total, 0), count: list.length });
  }

  const top = (field: "cliente" | "ciudad") =>
    [...Map.groupBy(last30.filter((r) => r[field]), (r) => r[field]!.trim().toUpperCase())]
      .map(([name, list]) => ({ name, total: list.reduce((s, r) => s + r.total, 0), count: list.length }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

  return {
    today: summarize(rows.filter((r) => r.day === todayKey)),
    last30: summarize(last30),
    prev30: summarize(prev30),
    thisMonth: summarize(thisMonth),
    months,
    days,
    topClients: top("cliente"),
    topCities: top("ciudad"),
    web30: summarize(last30.filter((r) => r.ecommerce)),
  };
}

export type SalesStats = Awaited<ReturnType<typeof salesStats>>;
