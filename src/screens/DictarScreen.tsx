import { useCallback, useRef, useState } from 'react';
import {
  AlertCircle,
  AudioLines,
  Bluetooth,
  BluetoothOff,
  CheckCircle2,
  ClipboardCheck,
  Headphones,
  Loader2,
  Mic,
  MicOff,
  Square,
} from 'lucide-react';
import type { Task, TaskInput } from '../types';
import { dayLabel, formatFullDate, formatTime, pad2, todayISO } from '../dates';
import { parseReminder, type AmbiguousTime } from '../parseReminder';
import { AVAILABILITY_PROBLEMS, useSpeechRecognition } from '../useSpeechRecognition';
import { joinEs, missingFields, validateTaskInput } from '../validation';
import MeridiemChoice from '../components/MeridiemChoice';
import Modal from '../components/Modal';
import TaskForm from '../components/TaskForm';
import Toggle from '../components/Toggle';

interface Proposal {
  values: TaskInput;
  transcript: string;
  ambiguousTime: AmbiguousTime | null;
}

interface Editing {
  error: string;
  manual: boolean;
}

const MIC_HELP = {
  idle: 'Tocá para dictar',
  starting: 'Preparando el micrófono…',
  listening: 'Escuchando… Tocá para detener',
  processing: 'Procesando…',
};

interface DictarScreenProps {
  nextTask: Task | null;
  pinConnected: boolean;
  onCreate: (values: TaskInput) => Task | null;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onViewInAgenda: (date: string) => void;
  showToast: (text: string) => void;
}

export default function DictarScreen({
  nextTask,
  pinConnected,
  onCreate,
  onUpdate,
  onViewInAgenda,
  showToast,
}: DictarScreenProps) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<Editing | null>(null);
  // Evita guardar dos veces si se toca "Sí, agenda" antes de que React vuelva a renderizar.
  const confirmed = useRef(false);

  const handleTranscript = useCallback((transcript: string) => {
    const parsed = parseReminder(transcript);
    confirmed.current = false;
    setSaved(false);
    setProposal({
      transcript,
      values: { title: parsed.title, date: parsed.date, time: parsed.time, alarm: true },
      ambiguousTime: parsed.ambiguousTime,
    });
  }, []);

  const speech = useSpeechRecognition(handleTranscript);
  const unavailable = speech.availability !== 'available';
  const problem = unavailable ? AVAILABILITY_PROBLEMS[speech.availability as 'unsupported' | 'insecure'] : speech.problem;
  const active = speech.status !== 'idle';
  const ready = proposal !== null && !saved;

  const handleMic = () => {
    if (speech.status === 'listening') return speech.stop();
    if (speech.status === 'starting') return speech.cancel();
    if (speech.status === 'processing') return;
    setProposal(null);
    setSaved(false);
    speech.start();
  };

  const openManual = () => {
    speech.clearProblem();
    confirmed.current = false;
    setSaved(false);
    setProposal({ transcript: '', values: { title: '', date: todayISO(), time: '', alarm: true }, ambiguousTime: null });
    setEditing({ error: '', manual: true });
  };

  const updateValues = (values: TaskInput) => {
    setProposal((p) => (p ? { ...p, values, ambiguousTime: values.time ? null : p.ambiguousTime } : p));
  };

  const confirm = () => {
    if (!proposal || saved || confirmed.current) return;
    const error = validateTaskInput(proposal.values, !!proposal.ambiguousTime);
    if (error) {
      setEditing({ error, manual: false });
      return;
    }
    confirmed.current = true;
    if (!onCreate(proposal.values)) {
      confirmed.current = false;
      return;
    }
    setSaved(true);
    showToast('Recordatorio agendado');
  };

  const cancel = () => {
    setProposal(null);
    setSaved(false);
    showToast('Propuesta descartada');
  };

  const closeEditor = () => {
    if (editing?.manual && proposal && !proposal.values.title && !proposal.values.time) setProposal(null);
    setEditing(null);
  };

  const values = proposal?.values;
  const missing = values ? missingFields(values) : [];
  const pendingMeridiem = proposal?.ambiguousTime && !values?.time ? proposal.ambiguousTime : null;
  const missingText = missing.filter((m) => !(pendingMeridiem && m === 'la hora'));

  const timeLabel = (v: TaskInput) => {
    if (v.time) return formatTime(v.time);
    if (pendingMeridiem) return `${pendingMeridiem.hour}:${pad2(pendingMeridiem.minute)} ¿am o pm?`;
    return 'Sin hora';
  };

  return (
    <div className="screen">
      <section className="card">
        <div className="card-head">
          <h2 className="card-title">
            <Headphones size={18} className="accent" strokeWidth={2.4} />
            Te escucho
          </h2>
          <AudioLines
            size={18}
            className={`wave-icon${speech.status === 'listening' ? ' is-active' : ''}`}
            aria-hidden
          />
        </div>

        <div className="mic-area">
          <button
            type="button"
            className={`mic-btn${speech.status === 'listening' || speech.status === 'starting' ? ' is-listening' : ''}${speech.status === 'processing' ? ' is-processing' : ''}`}
            aria-label={active ? 'Detener dictado' : 'Dictar recordatorio'}
            disabled={unavailable || speech.status === 'processing'}
            onClick={handleMic}
          >
            {unavailable ? (
              <MicOff size={28} strokeWidth={2.4} />
            ) : speech.status === 'processing' ? (
              <Loader2 size={28} strokeWidth={2.4} className="spin" />
            ) : speech.status === 'listening' ? (
              <Square size={24} strokeWidth={2.4} fill="currentColor" />
            ) : (
              <Mic size={28} strokeWidth={2.4} />
            )}
          </button>
          <p className="mic-help" aria-live="polite">
            {unavailable ? 'Dictado no disponible' : MIC_HELP[speech.status]}
          </p>
        </div>

        {problem && (
          <div className="speech-problem" role="alert">
            <p>
              <AlertCircle size={18} aria-hidden />
              <span>{problem.message}</span>
            </p>
            {problem.offerManual && (
              <button type="button" className="btn btn-secondary btn-block" onClick={openManual}>
                Escribir recordatorio
              </button>
            )}
          </div>
        )}

        <hr className="divider" />

        {proposal && values && !active ? (
          <div className={`proposal-card${saved ? ' is-saved' : ''}`}>
            {proposal.transcript && <p className="proposal-transcript">Escuché: “{proposal.transcript}”</p>}
            <p className="proposal-title">
              {saved && <CheckCircle2 size={18} className="saved-icon" aria-hidden />}
              {saved ? 'Agendado' : 'Propuesta'}: {values.title || <span className="is-missing">sin título</span>}
            </p>
            <p className="proposal-meta">
              {values.date ? formatFullDate(values.date) : 'Sin fecha'} · {timeLabel(values)} •{' '}
              {values.alarm ? 'Alarma activada' : 'Alarma desactivada'}
            </p>
            {!saved && pendingMeridiem && (
              <MeridiemChoice
                ambiguous={pendingMeridiem}
                value=""
                onPick={(time) => updateValues({ ...values, time })}
              />
            )}
            {!saved && missingText.length > 0 && (
              <p className="proposal-missing">
                Falta {joinEs(missingText)}. Tocá “Cambiar” para completarlo.
              </p>
            )}
          </div>
        ) : (
          <div className="proposal-card is-empty">
            {active ? (
              <>
                <p className={`proposal-title${speech.transcript ? ' is-live' : ''}`}>
                  {speech.transcript ? `“${speech.transcript}”` : MIC_HELP[speech.status]}
                </p>
                <p className="proposal-meta">{speech.status === 'processing' ? 'Procesando…' : 'Hablá con normalidad'}</p>
              </>
            ) : (
              <>
                <p className="proposal-title">Sin propuesta</p>
                <p className="proposal-meta">Ejemplo: “Comprar pan mañana a las 8 de la mañana”.</p>
              </>
            )}
          </div>
        )}

        {saved && proposal ? (
          <div className="btn-row">
            <button type="button" className="btn btn-primary" onClick={() => onViewInAgenda(proposal.values.date)}>
              Ver en Agenda
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setProposal(null);
                setSaved(false);
              }}
            >
              Dictar otra
            </button>
          </div>
        ) : (
          <div className="btn-row is-three">
            <button type="button" className="btn btn-primary" disabled={!ready || active} onClick={confirm}>
              Sí, agenda
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={!ready || active}
              onClick={() => setEditing({ error: '', manual: false })}
            >
              Cambiar
            </button>
            <button type="button" className="btn btn-secondary" disabled={!ready || active} onClick={cancel}>
              Cancelar
            </button>
          </div>
        )}

        <p className="hint">Revisá la propuesta antes de agendar. Con “Cambiar” podés corregir cualquier dato.</p>
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
                <p className="next-meta">Dictá o escribí uno para verlo aquí.</p>
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
        <Modal title={editing.manual ? 'Escribir recordatorio' : 'Cambiar propuesta'} onClose={closeEditor}>
          <TaskForm
            initial={proposal.values}
            ambiguousTime={proposal.values.time ? null : proposal.ambiguousTime}
            initialError={editing.error}
            submitLabel="Listo"
            onCancel={closeEditor}
            onSubmit={(next) => {
              updateValues(next);
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
