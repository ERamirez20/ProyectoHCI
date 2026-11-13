import type { TaskInput } from './types';
import { parseISODate, toISODate } from './dates';

export const isValidDate = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) && toISODate(parseISODate(s)) === s;

export const isValidTime = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

export function joinEs(items: string[]): string {
  return items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

export function missingFields(v: TaskInput): string[] {
  const missing: string[] = [];
  if (!v.title.trim()) missing.push('el título');
  if (!isValidDate(v.date)) missing.push('la fecha');
  if (!isValidTime(v.time)) missing.push('la hora');
  return missing;
}

/** Devuelve un mensaje de error o null si el recordatorio puede guardarse. */
export function validateTaskInput(v: TaskInput, hourNeedsMeridiem = false): string | null {
  const missing = missingFields(v);
  if (missing.length === 0) return null;
  if (hourNeedsMeridiem && missing.length === 1 && missing[0] === 'la hora') {
    return 'Indicá si la hora es de la mañana (am) o de la tarde/noche (pm).';
  }
  return `Falta completar ${joinEs(missing)}.`;
}
