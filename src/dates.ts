import type { Task } from './types';

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** Iniciales de la semana empezando en lunes. */
export const WEEKDAY_INITIALS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export const pad2 = (n: number) => String(n).padStart(2, '0');

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export const todayISO = () => toISODate(new Date());
export const tomorrowISO = () => toISODate(addDays(new Date(), 1));

export function monthLabel(year: number, month: number): string {
  return `${capitalize(MONTHS[month])} ${year}`;
}

/** "8:00 am", "6:30 pm" */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad2(m)} ${suffix}`;
}

function relativeDay(dateStr: string): string | null {
  const diff = Math.round(
    (parseISODate(dateStr).getTime() - parseISODate(todayISO()).getTime()) / 86_400_000,
  );
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  return null;
}

function dayAndMonth(d: Date): string {
  const year = d.getFullYear() !== new Date().getFullYear() ? ` de ${d.getFullYear()}` : '';
  return `${d.getDate()} de ${MONTHS[d.getMonth()]}${year}`;
}

/** "Mañana" o "Martes 17 de noviembre" */
export function dayLabel(dateStr: string): string {
  const d = parseISODate(dateStr);
  return relativeDay(dateStr) ?? `${capitalize(WEEKDAYS[d.getDay()])} ${dayAndMonth(d)}`;
}

/** "Hoy, 13 de noviembre" o "Martes 17 de noviembre" */
export function longDayLabel(dateStr: string): string {
  const d = parseISODate(dateStr);
  const rel = relativeDay(dateStr);
  return rel ? `${rel}, ${dayAndMonth(d)}` : `${capitalize(WEEKDAYS[d.getDay()])} ${dayAndMonth(d)}`;
}

/** "Mañana, sábado 14 de noviembre" o "Lunes 16 de noviembre" */
export function formatFullDate(dateStr: string): string {
  const d = parseISODate(dateStr);
  const rel = relativeDay(dateStr);
  const full = `${WEEKDAYS[d.getDay()]} ${dayAndMonth(d)}`;
  return rel ? `${rel}, ${full}` : capitalize(full);
}

/** "Mañana, 8:00 am" */
export function formatWhen(t: { date: string; time: string }): string {
  return `${dayLabel(t.date)}, ${formatTime(t.time)}`;
}

export function taskTimestamp(t: Pick<Task, 'date' | 'time'>): number {
  const d = parseISODate(t.date);
  const [h, m] = t.time.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

export const compareTasks = (a: Task, b: Task) => taskTimestamp(a) - taskTimestamp(b);

/** Celdas del mes (semana iniciando en lunes); null para huecos. */
export function buildMonthGrid(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array(offset).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(toISODate(new Date(year, month, day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
