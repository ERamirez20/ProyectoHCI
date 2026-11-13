import { useEffect, useRef, useState } from 'react';
import { AudioLines, Bluetooth, BluetoothOff, CheckCircle2, ClipboardCheck, Headphones, Mic } from 'lucide-react';
import type { Task, TaskInput } from '../types';
import { dayLabel, formatTime, formatWhen } from '../dates';
import { createDemoProposal } from '../data';
import Modal from '../components/Modal';
import TaskForm from '../components/TaskForm';
import Toggle from '../components/Toggle';

type Phase = 'idle' | 'listening' | 'proposal' | 'saved';

const MIC_HELP: Record<Phase, string> = {
  idle: 'Toca el micrófono y dicta tu tarea',
  listening: 'Escuchando…',
  proposal: 'Revisa la propuesta',
  saved: 'Toca el micrófono para dictar otra tarea',
};

interface DictarScreenProps {
  tasks: Task[];
  nextTask: Task | null;
  pinConnected: boolean;
  onAdd: (values: TaskInput) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onViewInAgenda: (date: string) => void;
  showToast: (text: string) => void;
}

export default function DictarScreen({
  tasks,
  nextTask,
  pinConnected,
  onAdd,
  onUpdate,
  onViewInAgenda,
  showToast,
}: DictarScreenProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [proposal, setProposal] = useState<TaskInput | null>(null);
  const [editing, setEditing] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  // Evita guardar dos veces si se toca "Sí, agenda" antes de que React vuelva a renderizar.
  const confirmed = useRef(false);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const listening = phase === 'listening';
  const ready = phase === 'proposal' && proposal !== null;

  const showProposal = () => {
    window.clearTimeout(timer.current);
    confirmed.current = false;
    setProposal(createDemoProposal());
    setPhase('proposal');
  };

  const handleMic = () => {
    if (listening) return showProposal();
    setProposal(null);
    setPhase('listening');
    timer.current = window.setTimeout(showProposal, 1800);
  };

  const confirm = () => {
    if (!ready || !proposal || confirmed.current) return;
    confirmed.current = true;
    const exists = tasks.some(
      (t) =>
        !t.done &&
        t.title.toLowerCase() === proposal.title.toLowerCase() &&
        t.date === proposal.date &&
        t.time === proposal.time,
    );
    if (exists) {
      showToast('Ese recordatorio ya estaba en tu agenda');
    } else {
      onAdd(proposal);
      showToast('Recordatorio agendado');
    }
    setPhase('saved');
  };

  const cancel = () => {
    setProposal(null);
    setPhase('idle');
    showToast('Propuesta descartada');
  };

  const restart = () => {
    setProposal(null);
    setPhase('idle');
  };

  return (
    <div className="screen">
      <section className="card">
        <div className="card-head">
          <h2 className="card-title">
            <Headphones size={18} className="accent" strokeWidth={2.4} />
            Te escucho
          </h2>
          <AudioLines size={18} className={`wave-icon${listening ? ' is-active' : ''}`} aria-hidden />
        </div>

        <div className="mic-area">
          <button
            type="button"
            className={`mic-btn${listening ? ' is-listening' : ''}`}
            aria-label={listening ? 'Terminar dictado' : 'Dictar'}
            onClick={handleMic}
          >
            <Mic size={28} strokeWidth={2.4} />
          </button>
          <p className="mic-help" aria-live="polite">
            {MIC_HELP[phase]}
          </p>
          <p className="demo-note">Dictado de demostración</p>
        </div>

        <hr className="divider" />

        {proposal ? (
          <div className={`proposal-card${phase === 'saved' ? ' is-saved' : ''}`}>
            <p className="proposal-title">
              {phase === 'saved' && <CheckCircle2 size={18} className="saved-icon" aria-hidden />}
              {phase === 'saved' ? 'Agendado' : 'Propuesta'}: {proposal.title}
            </p>
            <p className="proposal-meta">
              {formatWhen(proposal)} • {proposal.alarm ? 'Alarma activada' : 'Alarma desactivada'}
            </p>
          </div>
        ) : (
          <div className="proposal-card is-empty">
            <p className="proposal-title">{listening ? 'Escuchando…' : 'Sin propuesta'}</p>
            <p className="proposal-meta">
              {listening ? 'Preparando la propuesta' : 'La propuesta aparecerá aquí.'}
            </p>
          </div>
        )}

        {phase === 'saved' && proposal ? (
          <div className="btn-row">
            <button type="button" className="btn btn-primary" onClick={() => onViewInAgenda(proposal.date)}>
              Ver en Agenda
            </button>
            <button type="button" className="btn btn-secondary" onClick={restart}>
              Dictar otra
            </button>
          </div>
        ) : (
          <div className="btn-row is-three">
            <button type="button" className="btn btn-primary" disabled={!ready} onClick={confirm}>
              Sí, agenda
            </button>
            <button type="button" className="btn btn-secondary" disabled={!ready} onClick={() => setEditing(true)}>
              Cambiar
            </button>
            <button type="button" className="btn btn-secondary" disabled={!ready} onClick={cancel}>
              Cancelar
            </button>
          </div>
        )}

        <p className="hint">También puedes decir: “Sí”, “Cambiar”, “Cancelar”.</p>
      </section>

      <section className="card">
        <h2 className="card-title">
          <ClipboardCheck size={18} className="accent" strokeWidth={2.4} />
          Próximo recordatorio
        </h2>

        <div className="next-row">
          <div className={`next-box${nextTask ? '' : ' is-empty'}`}>
            {nextTask ? (
              <>
                <p className="next-title">{nextTask.title}</p>
                <p className="next-meta">
                  {dayLabel(nextTask.date)} • {formatTime(nextTask.time)}
                </p>
              </>
            ) : (
              <>
                <p className="next-title">Sin recordatorios pendientes</p>
                <p className="next-meta">Agenda una tarea para verla aquí.</p>
              </>
            )}
          </div>
          <div className="alarm-toggle">
            <Toggle
              checked={!!nextTask?.alarm}
              disabled={!nextTask}
              label="Alarma del próximo recordatorio"
              onChange={(alarm) => {
                if (!nextTask) return;
                onUpdate(nextTask.id, { alarm });
                showToast(alarm ? 'Alarma activada' : 'Alarma desactivada');
              }}
            />
            <span>Alarma</span>
          </div>
        </div>

        <hr className="divider" />

        <div className="pin-row">
          <span className={`pin-inline${pinConnected ? '' : ' is-off'}`}>
            {pinConnected ? <Bluetooth size={18} /> : <BluetoothOff size={18} />}
            {pinConnected ? 'Pin conectado' : 'Pin desconectado'}
          </span>
          <button type="button" className="btn btn-secondary" onClick={() => showToast('Prueba de sonido simulada')}>
            Probar sonido
          </button>
        </div>
      </section>

      {editing && proposal && (
        <Modal title="Cambiar propuesta" onClose={() => setEditing(false)}>
          <TaskForm
            initial={proposal}
            submitLabel="Actualizar"
            onCancel={() => setEditing(false)}
            onSubmit={(values) => {
              setProposal(values);
              setEditing(false);
              showToast('Propuesta actualizada');
            }}
          />
        </Modal>
      )}
    </div>
  );
}
