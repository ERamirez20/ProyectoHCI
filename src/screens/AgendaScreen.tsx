import { useMemo, useState, type FormEvent } from 'react';
import { Bell, BellOff, CalendarDays, CheckCircle2, ChevronRight, Circle, Send } from 'lucide-react';
import type { Task, TaskInput } from '../types';
import { compareTasks, formatTime, formatWhen, longDayLabel } from '../dates';
import Calendar, { type DayMark } from '../components/Calendar';
import Modal from '../components/Modal';
import PinStatus from '../components/PinStatus';
import TaskForm from '../components/TaskForm';
import TaskModal from '../components/TaskModal';

interface AgendaScreenProps {
  tasks: Task[];
  nextTask: Task | null;
  pinConnected: boolean;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onAdd: (values: TaskInput) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
  showToast: (text: string) => void;
}

export default function AgendaScreen({
  tasks,
  nextTask,
  pinConnected,
  selectedDate,
  onSelectDate,
  onAdd,
  onUpdate,
  onDelete,
  showToast,
}: AgendaScreenProps) {
  const [text, setText] = useState('');
  const [newTask, setNewTask] = useState<TaskInput | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingTask = tasks.find((t) => t.id === editingId) ?? null;

  const dayTasks = useMemo(
    () => tasks.filter((t) => t.date === selectedDate).sort(compareTasks),
    [tasks, selectedDate],
  );

  const marks = useMemo(() => {
    const map = new Map<string, DayMark>();
    for (const t of tasks) {
      if (!t.done) map.set(t.date, 'pending');
      else if (!map.has(t.date)) map.set(t.date, 'done');
    }
    return map;
  }, [tasks]);

  const openNewTask = (e: FormEvent) => {
    e.preventDefault();
    setNewTask({ title: text.trim(), date: selectedDate, time: '09:00', alarm: true });
  };

  const saveNewTask = (values: TaskInput) => {
    onAdd(values);
    onSelectDate(values.date);
    setText('');
    setNewTask(null);
    showToast('Tarea agregada');
  };

  return (
    <div className="screen">
      <PinStatus connected={pinConnected} />

      {nextTask ? (
        <button type="button" className="reminder-card" onClick={() => setEditingId(nextTask.id)}>
          <span className="reminder-title">{nextTask.title}</span>
          <span className="reminder-meta">
            {formatWhen(nextTask)} • {nextTask.alarm ? 'Alarma activada' : 'Alarma desactivada'}
          </span>
        </button>
      ) : (
        <div className="reminder-card is-empty">
          <span className="reminder-title">Sin recordatorios pendientes</span>
          <span className="reminder-meta">Escribe una tarea abajo para agregarla.</span>
        </div>
      )}

      <section className="card agenda-card">
        <h2 className="card-title">
          <CalendarDays size={18} className="accent" strokeWidth={2.4} />
          Agenda
        </h2>

        <form className="compose" onSubmit={openNewTask}>
          <label htmlFor="compose-input" className="compose-label">
            Escribir
          </label>
          <div className="compose-row">
            <input
              id="compose-input"
              className="compose-input"
              placeholder="Agregar tarea, fecha y hora"
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoComplete="off"
              enterKeyHint="send"
            />
            <button type="submit" className="send-btn" aria-label="Agregar tarea">
              <Send size={18} fill="currentColor" />
            </button>
          </div>
        </form>

        <Calendar selectedDate={selectedDate} onSelect={onSelectDate} marks={marks} />

        <div className="day-tasks">
          <h3 className="day-title">{longDayLabel(selectedDate)}</h3>
          {dayTasks.length === 0 ? (
            <p className="empty-text">No hay tareas para este día.</p>
          ) : (
            <ul className="task-list">
              {dayTasks.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className={`task-item${t.done ? ' is-done' : ''}`}
                    onClick={() => setEditingId(t.id)}
                  >
                    <span className="task-check" aria-hidden>
                      {t.done ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                    </span>
                    <span className="task-body">
                      <span className="task-title">{t.title}</span>
                      <span className="task-meta">
                        {formatTime(t.time)}
                        {t.done ? ' • Completada' : ''}
                      </span>
                    </span>
                    {t.alarm ? (
                      <Bell size={16} className="task-alarm" aria-label="Alarma activada" />
                    ) : (
                      <BellOff size={16} className="task-alarm is-off" aria-label="Alarma desactivada" />
                    )}
                    <ChevronRight size={18} className="task-chevron" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {newTask && (
        <Modal title="Nueva tarea" onClose={() => setNewTask(null)}>
          <TaskForm initial={newTask} submitLabel="Guardar" onSubmit={saveNewTask} onCancel={() => setNewTask(null)} />
        </Modal>
      )}

      {editingTask && (
        <TaskModal
          task={editingTask}
          onClose={() => setEditingId(null)}
          onSave={(values) => {
            onUpdate(editingTask.id, values);
            onSelectDate(values.date);
            setEditingId(null);
            showToast('Tarea actualizada');
          }}
          onToggleDone={() => {
            onUpdate(editingTask.id, { done: !editingTask.done });
            setEditingId(null);
            showToast(editingTask.done ? 'Tarea marcada como pendiente' : 'Tarea completada');
          }}
          onDelete={() => {
            onDelete(editingTask.id);
            setEditingId(null);
            showToast('Tarea eliminada');
          }}
        />
      )}
    </div>
  );
}
