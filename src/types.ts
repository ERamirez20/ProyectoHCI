export type Screen = 'agenda' | 'dictar' | 'ajustes';

export interface Task {
  id: string;
  title: string;
  /** Formato YYYY-MM-DD */
  date: string;
  /** Formato HH:MM (24 h) */
  time: string;
  done: boolean;
  alarm: boolean;
}

export type TaskInput = Pick<Task, 'title' | 'date' | 'time' | 'alarm'>;

export type AlertType = 'recordatorio' | 'alarma' | 'avisoPrevio';

export interface Settings {
  pinSound: boolean;
  volume: number;
  readAloud: boolean;
  tone: string;
  vibration: boolean;
  intensity: string;
  duration: string;
  patterns: Record<AlertType, string>;
  phoneAlerts: boolean;
  notifyBefore: number;
  repeatEvery: number;
  phoneBackup: boolean;
}
