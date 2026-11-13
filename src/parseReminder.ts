import { addDays, pad2, toISODate } from './dates';

/** Hora dicha sin indicar mañana/tarde (por ejemplo "a las ocho"). */
export interface AmbiguousTime {
  hour: number;
  minute: number;
}

export interface ParsedReminder {
  title: string;
  /** YYYY-MM-DD o '' si no se mencionó. */
  date: string;
  /** HH:MM o '' si no se mencionó o es ambigua. */
  time: string;
  ambiguousTime: AmbiguousTime | null;
}

type Meridiem = 'am' | 'pm' | 'manana' | 'tarde' | 'noche' | 'madrugada';

interface Clock {
  hour: number;
  minute: number;
  meridiem: Meridiem | null;
}

const NUMBER_WORDS: Record<string, number> = {
  un: 1, uno: 1, una: 1, primero: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7,
  ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
  dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20, veintiun: 21,
  veintiuno: 21, veintiuna: 21, veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25,
  veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29, treinta: 30,
  'treinta y uno': 31, 'treinta y una': 31, cuarenta: 40, 'cuarenta y cinco': 45, cincuenta: 50,
};

const MONTHS: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7,
  septiembre: 8, setiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
};

const WEEKDAYS: Record<string, number> = {
  domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6,
};

const WORDS = Object.keys(NUMBER_WORDS)
  .sort((a, b) => b.length - a.length)
  .map((w) => w.replace(/ /g, '\\s+'))
  .join('|');
const N = `(?:\\d{1,2}|${WORDS})`;
const MER = `(?:\\s*,?\\s*(?:de|en|por)\\s+la\\s+(?<mer1>manana|tarde|noche|madrugada)|\\s*(?<mer2>a\\.?\\s?m\\.?|p\\.?\\s?m\\.?)(?![a-z]))?`;
const MINUTES = `(?:\\s*:\\s*(?<mm>\\d{2})|\\s+y\\s+(?<plus>media|cuarto|${N})|\\s+menos\\s+(?<minus>cuarto|${N}))?`;
const PREFIX = '(?:como\\s+a\\s+las|a\\s+eso\\s+de\\s+las|para\\s+las|a\\s+las|a\\s+la)';

const TIME_PATTERNS = [
  new RegExp(`\\b${PREFIX}\\s+(?<h>${N})\\b${MINUTES}(?:\\s+en\\s+punto|\\s+horas?\\b)?${MER}`),
  new RegExp(`\\b(?<h>\\d{1,2})\\s*:\\s*(?<mm>\\d{2})\\b${MER}`),
  /\b(?<h>\d{1,2})\s*(?<mer2>a\.?\s?m\.?|p\.?\s?m\.?)(?![a-z])/,
];
const NOON = /\b(?:al\s+|a\s+|para\s+el\s+)?mediodia\b/;
const MIDNIGHT = /\b(?:a\s+la\s+|a\s+)?medianoche\b/;
const THIS_PART = /\besta\s+(?<part>manana|tarde|noche)\b/;
const PART_OF_DAY = /\b(?:de|en|por)\s+la\s+(?<mer1>manana|tarde|noche|madrugada)\b/;

const MONTH_ALT = Object.keys(MONTHS).join('|');
const DATE_WITH_MONTH = new RegExp(
  `\\b(?:el\\s+)?(?:dia\\s+)?(?<d>${N})\\s+de\\s+(?<mon>${MONTH_ALT})\\b(?:\\s+(?:de|del)\\s+(?<y>\\d{4}))?`,
);
const DATE_NUMERIC = /\b(?:el\s+)?(?<d>\d{1,2})\/(?<m>\d{1,2})(?:\/(?<y>\d{2,4}))?\b/;
const WEEKDAY = new RegExp(
  `\\b(?:(?<este>este)\\s+|el\\s+(?:proximo\\s+)?|proximo\\s+)?(?<wd>${Object.keys(WEEKDAYS).join('|')})\\b(?:\\s+(?:que\\s+viene|proximo))?`,
);
const DAY_ONLY = new RegExp(`\\bel\\s+dia\\s+(?<d>${N})\\b`);
const DAY_AFTER_TOMORROW = /\bpasado\s+manana\b/;
const TOMORROW = /\bmanana\b/;
const TODAY = /\bhoy\b/;

const LEADING =
  /^(?:\s|[,.;:¡!¿?-]|(?:recuerdame|recordarme|recuerda|recordar|agendame|agendar|agenda|anotame|anotar|anota|tengo\s+que|hay\s+que|que|y)\b)+/;
const TRAILING = /(?:\s|[,.;:¡!¿?-]|\b(?:a|al|el|la|para|de|del|y|que|en|por)\b)+$/;

/** Minúsculas sin tildes, conservando la longitud para poder recortar el texto original. */
function normalize(text: string): string {
  return text
    .split('')
    .map((ch) => {
      const n = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      return n.length === 1 ? n : ch;
    })
    .join('');
}

function toNumber(s: string | undefined): number | null {
  if (!s) return null;
  if (/^\d+$/.test(s)) return Number(s);
  return NUMBER_WORDS[s.replace(/\s+/g, ' ')] ?? null;
}

function readMeridiem(g: Record<string, string | undefined>): Meridiem | null {
  if (g.mer1) return g.mer1 as Meridiem;
  if (g.mer2) return g.mer2.startsWith('a') ? 'am' : 'pm';
  return null;
}

function readClock(g: Record<string, string | undefined>): Clock | null {
  let hour = toNumber(g.h);
  if (hour === null) return null;
  let minute = 0;
  if (g.mm) {
    minute = Number(g.mm);
  } else if (g.plus) {
    minute = g.plus === 'media' ? 30 : g.plus === 'cuarto' ? 15 : (toNumber(g.plus) ?? -1);
  } else if (g.minus) {
    const sub = g.minus === 'cuarto' ? 15 : (toNumber(g.minus) ?? -1);
    if (sub <= 0 || sub >= 60) return null;
    minute = 60 - sub;
    hour = hour === 1 ? 12 : hour === 0 ? 23 : hour - 1;
  }
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute, meridiem: readMeridiem(g) };
}

/** Convierte a 24 h. Devuelve null en `time` si no se sabe si es am o pm. */
function resolveClock({ hour, minute, meridiem }: Clock): { time: string; ambiguous: AmbiguousTime | null } {
  const fmt = (h: number) => ({ time: `${pad2(h)}:${pad2(minute)}`, ambiguous: null });
  if (hour === 0 || hour >= 13) return fmt(hour);
  switch (meridiem) {
    case 'am':
    case 'madrugada':
      return fmt(hour === 12 ? 0 : hour);
    case 'manana':
      return fmt(hour);
    case 'pm':
    case 'tarde':
      return fmt(hour === 12 ? 12 : hour + 12);
    case 'noche':
      return fmt(hour === 12 ? 0 : hour < 5 ? hour : hour + 12);
    default:
      return { time: '', ambiguous: { hour, minute } };
  }
}

function makeDate(year: number, month: number, day: number): Date | null {
  const d = new Date(year, month, day);
  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day ? d : null;
}

function cleanTitle(raw: string): string {
  const collapsed = raw.replace(/\s+/g, ' ').trim();
  const norm = normalize(collapsed);
  const lead = LEADING.exec(norm)?.[0].length ?? 0;
  const trail = TRAILING.exec(norm.slice(lead))?.[0].length ?? 0;
  const title = collapsed.slice(lead, collapsed.length - trail).trim();
  return title.charAt(0).toUpperCase() + title.slice(1);
}

/**
 * Interpreta frases sencillas como "Comprar pan mañana a las ocho de la mañana".
 * Solo completa lo que se dijo explícitamente; lo demás queda vacío para que el usuario lo indique.
 */
export function parseReminder(text: string, now: Date = new Date()): ParsedReminder {
  let norm = normalize(text);
  const spans: [number, number][] = [];

  const consume = (m: RegExpExecArray) => {
    spans.push([m.index, m.index + m[0].length]);
    norm = norm.slice(0, m.index) + ' '.repeat(m[0].length) + norm.slice(m.index + m[0].length);
  };
  const take = (re: RegExp) => {
    const m = re.exec(norm);
    if (m) consume(m);
    return m;
  };

  // Hora
  let clock: Clock | null = null;
  for (const re of TIME_PATTERNS) {
    const m = re.exec(norm);
    const c = m ? readClock(m.groups ?? {}) : null;
    if (m && c) {
      clock = c;
      consume(m);
      break;
    }
  }
  if (!clock && take(NOON)) clock = { hour: 12, minute: 0, meridiem: 'pm' };
  if (!clock && take(MIDNIGHT)) clock = { hour: 0, minute: 0, meridiem: null };

  // "esta tarde", "en la noche"… (se quitan antes de buscar "mañana" como fecha)
  let partOfDay: Meridiem | null = null;
  let thisPart = false;
  const thisPartMatch = take(THIS_PART);
  if (thisPartMatch) {
    thisPart = true;
    partOfDay = thisPartMatch.groups?.part as Meridiem;
  }
  const partMatch = take(PART_OF_DAY);
  if (partMatch) partOfDay = partMatch.groups?.mer1 as Meridiem;
  if (clock && !clock.meridiem && partOfDay) clock.meridiem = partOfDay;

  // Fecha
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let date: Date | null = null;

  if (take(DAY_AFTER_TOMORROW)) date = addDays(today, 2);

  if (!date) {
    const m = DATE_WITH_MONTH.exec(norm);
    const day = toNumber(m?.groups?.d);
    if (m && day !== null && m.groups) {
      const month = MONTHS[m.groups.mon];
      const year = m.groups.y ? Number(m.groups.y) : today.getFullYear();
      let d = makeDate(year, month, day);
      if (d && !m.groups.y && d < today) d = makeDate(year + 1, month, day);
      if (d) {
        date = d;
        consume(m);
      }
    }
  }

  if (!date) {
    const m = DATE_NUMERIC.exec(norm);
    if (m?.groups) {
      const yRaw = m.groups.y;
      const year = yRaw ? (yRaw.length === 2 ? 2000 + Number(yRaw) : Number(yRaw)) : today.getFullYear();
      let d = makeDate(year, Number(m.groups.m) - 1, Number(m.groups.d));
      if (d && !yRaw && d < today) d = makeDate(year + 1, Number(m.groups.m) - 1, Number(m.groups.d));
      if (d) {
        date = d;
        consume(m);
      }
    }
  }

  if (!date) {
    const m = take(WEEKDAY);
    if (m?.groups) {
      let diff = (WEEKDAYS[m.groups.wd] - today.getDay() + 7) % 7;
      if (diff === 0 && !m.groups.este) diff = 7;
      date = addDays(today, diff);
    }
  }

  if (!date) {
    const m = DAY_ONLY.exec(norm);
    const day = toNumber(m?.groups?.d);
    if (m && day !== null) {
      let d = makeDate(today.getFullYear(), today.getMonth(), day);
      if (d && d < today) d = makeDate(today.getFullYear(), today.getMonth() + 1, day);
      if (d) {
        date = d;
        consume(m);
      }
    }
  }

  if (!date && take(TOMORROW)) date = addDays(today, 1);
  if (!date && take(TODAY)) date = today;
  if (!date && thisPart) date = today;

  // Título: el texto original sin las partes reconocidas
  spans.sort((a, b) => a[0] - b[0]);
  let rest = '';
  let pos = 0;
  for (const [start, end] of spans) {
    rest += `${text.slice(pos, start)} `;
    pos = end;
  }
  rest += text.slice(pos);

  const resolved = clock ? resolveClock(clock) : { time: '', ambiguous: null };
  return {
    title: cleanTitle(rest),
    date: date ? toISODate(date) : '',
    time: resolved.time,
    ambiguousTime: resolved.ambiguous,
  };
}
