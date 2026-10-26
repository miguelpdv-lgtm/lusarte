// Calendario de despachos locales: festivos de Colombia y fecha de entrega según la hora de corte.
// Sin dependencias del servidor: lo usan el checkout, los correos y el panel.

/** Fecha "YYYY-MM-DD" (calendario, sin hora). */
export type Ymd = string;

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date): Ymd => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);

/** Domingo de Pascua (algoritmo anónimo gregoriano). */
function easter(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utc(year, month, day);
}

/** Ley Emiliani: el festivo se corre al lunes siguiente si no cae en lunes. */
const nextMonday = (d: Date) => addDays(d, (8 - d.getUTCDay()) % 7);

const cache = new Map<number, Set<Ymd>>();

/** Festivos de Colombia de un año. */
export function colombianHolidays(year: number): Set<Ymd> {
  const hit = cache.get(year);
  if (hit) return hit;
  const e = easter(year);
  const days = [
    // Fijos
    utc(year, 1, 1),
    utc(year, 5, 1),
    utc(year, 7, 20),
    utc(year, 8, 7),
    utc(year, 12, 8),
    utc(year, 12, 25),
    // Trasladables al lunes
    nextMonday(utc(year, 1, 6)),
    nextMonday(utc(year, 3, 19)),
    nextMonday(utc(year, 6, 29)),
    nextMonday(utc(year, 8, 15)),
    nextMonday(utc(year, 10, 12)),
    nextMonday(utc(year, 11, 1)),
    nextMonday(utc(year, 11, 11)),
    // Según la Pascua: jueves y viernes santo; Ascensión, Corpus Christi y Sagrado Corazón (lunes)
    addDays(e, -3),
    addDays(e, -2),
    addDays(e, 43),
    addDays(e, 64),
    addDays(e, 71),
  ];
  const set = new Set(days.map(ymd));
  cache.set(year, set);
  return set;
}

export type LocalSchedule = {
  /** Hora de corte "HH:MM" (Colombia): antes de esta hora sale el mismo día */
  cutoff: string;
  /** Días de la semana en que se despacha (0 domingo … 6 sábado) */
  days: number[];
  /** Saltar los festivos de Colombia */
  holidays: boolean;
  /** Fechas extra sin despacho (vacaciones, cierres) */
  closedDates: Ymd[];
};

/** Hora actual en Colombia (UTC−5, sin horario de verano) como fecha UTC "desplazada". */
const bogotaNow = (now = new Date()) => new Date(now.getTime() - 5 * 3_600_000);

export function isDispatchDay(day: Date, s: LocalSchedule) {
  const key = ymd(day);
  if (!s.days.includes(day.getUTCDay())) return false;
  if (s.holidays && colombianHolidays(day.getUTCFullYear()).has(key)) return false;
  return !s.closedDates.includes(key);
}

/**
 * Fecha de entrega local para un pedido confirmado ahora: hoy si es día de despacho y antes de la hora de corte;
 * si no, el siguiente día de despacho.
 */
export function localDeliveryDate(s: LocalSchedule, now = new Date()): Ymd {
  const local = bogotaNow(now);
  const [h, m] = s.cutoff.split(":").map(Number);
  const minutes = local.getUTCHours() * 60 + local.getUTCMinutes();
  let day = utc(local.getUTCFullYear(), local.getUTCMonth() + 1, local.getUTCDate());
  if (isDispatchDay(day, s) && minutes < h * 60 + (m || 0)) return ymd(day);
  for (let i = 0; i < 60; i++) {
    day = addDays(day, 1);
    if (isDispatchDay(day, s)) return ymd(day);
  }
  return ymd(day);
}

const dayParts = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const dayFmt = {
  format: (d: Date) => {
    const p = Object.fromEntries(dayParts.formatToParts(d).map((x) => [x.type, x.value]));
    return `${p.weekday} ${p.day} de ${p.month}`;
  },
};

/** "hoy", "mañana" o "el lunes 20 de octubre". */
export function describeDay(date: Ymd, now = new Date()) {
  const today = ymd(bogotaNow(now));
  const tomorrow = ymd(addDays(new Date(`${today}T00:00:00Z`), 1));
  if (date === today) return "hoy";
  if (date === tomorrow) return "mañana";
  return `el ${dayFmt.format(new Date(`${date}T00:00:00Z`))}`;
}

/** "lunes 20 de octubre" (para el panel y los correos). */
export const formatDay = (date: Ymd) => dayFmt.format(new Date(`${date}T00:00:00Z`));

/**
 * Cuándo llega (o se recoge) un pedido local ya despachado, en lenguaje claro: el día del despacho + la franja.
 * Las franjas se llaman "Mañana (9 a. m. – 12 m.)", "Tarde (…)", "Noche (…)": solas, "Llega: Mañana" se lee como
 * "llega mañana" (el día siguiente). Por eso se escribe "hoy en la mañana (9 a. m. – 12 m.)".
 */
export function describeDelivery(window: string | null, shippedAt: Date | null, now = new Date()) {
  const day = shippedAt ? describeDay(ymd(bogotaNow(shippedAt)), now) : "hoy";
  const label = window?.trim();
  if (!label) return day;
  if (/^(hoy|el)\s/i.test(label)) return label; // ya trae el día
  const part = label.match(/^(mañana|tarde|noche)\b\s*(.*)$/i);
  if (part) return `${day} en la ${part[1].toLowerCase()}${part[2] ? ` ${part[2]}` : ""}`;
  return `${day}, ${label.charAt(0).toLowerCase()}${label.slice(1)}`;
}
