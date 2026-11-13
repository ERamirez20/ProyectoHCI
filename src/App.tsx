import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, MapPin } from 'lucide-react';
import type { Screen, Settings, Task, TaskInput } from './types';
import { compareTasks, formatWhen, taskTimestamp, todayISO } from './dates';
import { DEFAULT_SETTINGS, createSampleTasks, newId } from './data';
import { STORAGE_KEYS, clearAll, load, save } from './storage';
import { validateTaskInput } from './validation';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import SideMenu from './components/SideMenu';
import Modal from './components/Modal';
import PinModal from './components/PinModal';
import Toast, { type ToastMessage } from './components/Toast';
import AgendaScreen from './screens/AgendaScreen';
import DictarScreen from './screens/DictarScreen';
import AjustesScreen from './screens/AjustesScreen';

const loadSettings = (): Settings => {
  const stored = load<Partial<Settings>>(STORAGE_KEYS.settings, () => ({}));
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    patterns: { ...DEFAULT_SETTINGS.patterns, ...stored.patterns },
  };
};

type Panel = 'menu' | 'notifications' | 'pin' | 'reset' | null;

export default function App() {
  const [screen, setScreen] = useState<Screen>('agenda');
  const [tasks, setTasks] = useState<Task[]>(() => load(STORAGE_KEYS.tasks, createSampleTasks));
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [pinConnected, setPinConnected] = useState<boolean>(() => load(STORAGE_KEYS.pin, () => true));
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [panel, setPanel] = useState<Panel>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [resetCount, setResetCount] = useState(0);

  useEffect(() => {
    save(STORAGE_KEYS.tasks, tasks);
  }, [tasks]);
  useEffect(() => {
    save(STORAGE_KEYS.pin, pinConnected);
  }, [pinConnected]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  const showToast = useCallback((text: string) => setToast({ id: Date.now(), text }), []);
  const hideToast = useCallback(() => setToast(null), []);
  const closePanel = useCallback(() => setPanel(null), []);

  const nextTask = useMemo(() => {
    const now = Date.now();
    return tasks.filter((t) => !t.done && taskTimestamp(t) >= now).sort(compareTasks)[0] ?? null;
  }, [tasks]);

  /** Único punto de creación (Agenda y Dictar): valida, asigna id y muestra el día en el calendario. */
  const createTask = (values: TaskInput): Task | null => {
    if (validateTaskInput(values)) return null;
    const task: Task = { ...values, title: values.title.trim(), id: newId(), done: false };
    setTasks((prev) => [...prev, task]);
    setSelectedDate(task.date);
    return task;
  };

  const updateTask = (id: string, patch: Partial<Task>) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const deleteTask = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const navigate = (next: Screen) => {
    setScreen(next);
    setPanel(null);
  };

  const setPin = (connected: boolean) => {
    setPinConnected(connected);
    showToast(connected ? 'Pin conectado (simulado)' : 'Pin desconectado (simulado)');
  };

  const resetDemo = () => {
    clearAll();
    setTasks(createSampleTasks());
    setSettings(DEFAULT_SETTINGS);
    setPinConnected(true);
    setSelectedDate(todayISO());
    setResetCount((n) => n + 1);
    setScreen('agenda');
    setPanel(null);
    showToast('Demo restablecida');
  };

  return (
    <div className="app">
      <Header
        title={screen === 'ajustes' ? 'Configuración' : 'Mi agenda'}
        pinConnected={pinConnected}
        onMenu={() => setPanel('menu')}
        onBell={() => setPanel('notifications')}
        onSettings={() => navigate('ajustes')}
      />

      <main className="app-main" key={resetCount}>
        {screen === 'agenda' && (
          <AgendaScreen
            tasks={tasks}
            nextTask={nextTask}
            pinConnected={pinConnected}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onCreate={createTask}
            onUpdate={updateTask}
            onDelete={deleteTask}
            showToast={showToast}
          />
        )}
        {screen === 'dictar' && (
          <DictarScreen
            nextTask={nextTask}
            pinConnected={pinConnected}
            onCreate={createTask}
            onUpdate={updateTask}
            onViewInAgenda={(date) => {
              setSelectedDate(date);
              navigate('agenda');
            }}
            showToast={showToast}
          />
        )}
        {screen === 'ajustes' && (
          <AjustesScreen
            settings={settings}
            pinConnected={pinConnected}
            onManagePin={() => setPanel('pin')}
            showToast={showToast}
            onSave={(next) => {
              setSettings(next);
              save(STORAGE_KEYS.settings, next);
            }}
          />
        )}
      </main>

      <BottomNav current={screen} onNavigate={navigate} />

      {panel === 'menu' && (
        <SideMenu
          current={screen}
          onNavigate={navigate}
          onReset={() => setPanel('reset')}
          onClose={closePanel}
        />
      )}

      {panel === 'notifications' && (
        <Modal title="Avisos" onClose={closePanel}>
          <ul className="notice-list">
            <li className="notice">
              <span className="notice-icon">
                <Bell size={18} />
              </span>
              <div>
                <p className="notice-title">
                  {nextTask ? `Recordatorio: ${nextTask.title}` : 'Sin recordatorios pendientes'}
                </p>
                <p className="notice-meta">{nextTask ? formatWhen(nextTask) : 'No hay avisos próximos'}</p>
                <span className="demo-tag">Aviso simulado</span>
              </div>
            </li>
            <li className="notice">
              <span className="notice-icon">
                <MapPin size={18} />
              </span>
              <div>
                <p className="notice-title">Pin sincronizado</p>
                <p className="notice-meta">Batería al 80% · Hace un momento</p>
                <span className="demo-tag">Aviso simulado</span>
              </div>
            </li>
          </ul>
          <p className="modal-note">La app muestra estos avisos como vista previa; no envía notificaciones al teléfono.</p>
          <button type="button" className="btn btn-primary btn-block" onClick={closePanel}>
            Entendido
          </button>
        </Modal>
      )}

      {panel === 'pin' && (
        <PinModal connected={pinConnected} onSetConnected={setPin} onClose={closePanel} />
      )}

      {panel === 'reset' && (
        <Modal title="¿Restablecer demo?" onClose={closePanel}>
          <p className="modal-text">
            Se borrarán los recordatorios guardados y se recuperarán las tareas y configuraciones de ejemplo.
          </p>
          <div className="btn-row">
            <button type="button" className="btn btn-secondary" onClick={closePanel}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={resetDemo}>
              Restablecer
            </button>
          </div>
        </Modal>
      )}

      <Toast toast={toast} onDone={hideToast} />
    </div>
  );
}
