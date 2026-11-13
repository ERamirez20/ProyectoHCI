import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { TaskInput } from '../types';
import Toggle from './Toggle';

interface TaskFormProps {
  initial: TaskInput;
  submitLabel: string;
  onSubmit: (values: TaskInput) => void;
  onCancel: () => void;
  children?: ReactNode;
}

export default function TaskForm({ initial, submitLabel, onSubmit, onCancel, children }: TaskFormProps) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState('');
  const submitted = useRef(false);

  const set = <K extends keyof TaskInput>(key: K, value: TaskInput[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (submitted.current) return;
    const title = values.title.trim();
    if (!title) return setError('Escribe el nombre de la tarea.');
    if (!values.date || !values.time) return setError('Elige la fecha y la hora.');
    submitted.current = true;
    onSubmit({ ...values, title });
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <label className="field">
        <span>Tarea</span>
        <input
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Ej.: Comprar pan"
          maxLength={80}
          autoFocus={!initial.title}
        />
      </label>
      <div className="field-row">
        <label className="field">
          <span>Fecha</span>
          <input type="date" value={values.date} onChange={(e) => set('date', e.target.value)} />
        </label>
        <label className="field">
          <span>Hora</span>
          <input type="time" value={values.time} onChange={(e) => set('time', e.target.value)} />
        </label>
      </div>
      <div className="field-inline">
        <span>Alarma</span>
        <Toggle checked={values.alarm} onChange={(v) => set('alarm', v)} label="Alarma" />
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="btn-row">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
      </div>
      {children}
    </form>
  );
}
