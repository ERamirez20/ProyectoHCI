import type { AlertType, Settings, Task } from './types';
import { addDays, toISODate } from './dates';

export const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export function createSampleTasks(): Task[] {
  const today = new Date();
  const day = (offset: number) => toISODate(addDays(today, offset));
  return [
    { id: 'demo-1', title: 'Comprar pan', date: day(1), time: '08:00', done: false, alarm: true },
    { id: 'demo-2', title: 'Llamar a la farmacia', date: day(2), time: '10:30', done: false, alarm: true },
    { id: 'demo-3', title: 'Cita con el médico', date: day(4), time: '16:00', done: false, alarm: true },
    { id: 'demo-4', title: 'Tomar el medicamento', date: day(0), time: '07:30', done: true, alarm: true },
    { id: 'demo-5', title: 'Regar las plantas', date: day(-2), time: '18:00', done: true, alarm: false },
  ];
}

export const DEFAULT_SETTINGS: Settings = {
  pinSound: true,
  volume: 70,
  readAloud: false,
  tone: 'Suave',
  vibration: true,
  intensity: 'Media',
  duration: 'Corta',
  patterns: { recordatorio: 'Un pulso', alarma: 'Continuo', avisoPrevio: 'Doble pulso' },
  phoneAlerts: true,
  notifyBefore: 15,
  repeatEvery: 5,
  phoneBackup: true,
};

export const TONE_OPTIONS = ['Suave', 'Campana', 'Melodía', 'Clásico'];
export const INTENSITY_OPTIONS = ['Baja', 'Media', 'Alta'];
export const DURATION_OPTIONS = ['Corta', 'Media', 'Larga'];
export const PATTERN_OPTIONS = ['Un pulso', 'Doble pulso', 'Tres pulsos', 'Continuo'];

export const ALERT_TYPES: { key: AlertType; label: string }[] = [
  { key: 'recordatorio', label: 'Recordatorio' },
  { key: 'alarma', label: 'Alarma' },
  { key: 'avisoPrevio', label: 'Aviso previo' },
];

export const NOTIFY_BEFORE_OPTIONS = [
  { value: 0, label: 'A la hora' },
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
];

export const REPEAT_OPTIONS = [
  { value: 0, label: 'Nunca' },
  { value: 5, label: 'Cada 5 min' },
  { value: 10, label: 'Cada 10 min' },
  { value: 15, label: 'Cada 15 min' },
];

export const pinDetail = (connected: boolean) =>
  connected ? 'Batería: 80% · Sincronizado ahora' : 'Sin conexión · Última sincronización hace un momento';
