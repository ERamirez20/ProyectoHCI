import { useState, type ReactNode } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import type { Settings } from '../types';
import {
  ALERT_TYPES,
  DURATION_OPTIONS,
  INTENSITY_OPTIONS,
  NOTIFY_BEFORE_OPTIONS,
  PATTERN_OPTIONS,
  REPEAT_OPTIONS,
  TONE_OPTIONS,
  pinDetail,
} from '../data';
import PinStatus from '../components/PinStatus';
import Select from '../components/Select';
import Toggle from '../components/Toggle';

interface RowProps {
  label: string;
  children: ReactNode;
  disabled?: boolean;
  nested?: boolean;
}

function Row({ label, children, disabled, nested }: RowProps) {
  return (
    <div className={`s-row${disabled ? ' is-disabled' : ''}${nested ? ' is-nested' : ''}`}>
      <span className="s-row-label">{label}</span>
      {children}
    </div>
  );
}

interface AjustesScreenProps {
  settings: Settings;
  pinConnected: boolean;
  onSave: (settings: Settings) => void;
  onManagePin: () => void;
  showToast: (text: string) => void;
}

export default function AjustesScreen({ settings, pinConnected, onSave, onManagePin, showToast }: AjustesScreenProps) {
  const [draft, setDraft] = useState(settings);
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const testSound = () =>
    showToast(
      draft.pinSound
        ? `Prueba de sonido simulada · ${draft.tone}, ${draft.volume}%`
        : 'El sonido del pin está desactivado',
    );

  const testVibration = () =>
    showToast(
      draft.vibration
        ? `Prueba de vibración simulada · ${draft.intensity}, ${draft.duration.toLowerCase()}`
        : 'La vibración del pin está desactivada',
    );

  return (
    <div className="screen settings">
      <h2 className="section-heading">
        <SettingsIcon size={20} className="accent" strokeWidth={2.4} />
        Ajustes
      </h2>

      <section className="card s-card">
        <h3 className="s-kicker">Mi pin</h3>
        <div className="pin-card-row">
          <div className="pin-card-info">
            <PinStatus connected={pinConnected} large />
            <p className="muted-sm">{pinDetail(pinConnected)}</p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={onManagePin}>
            Administrar pin
          </button>
        </div>
      </section>

      <section className="card s-card">
        <h3 className="s-title">Sonido y voz</h3>
        <Row label="Sonido del pin">
          <Toggle checked={draft.pinSound} onChange={(v) => set('pinSound', v)} label="Sonido del pin" />
        </Row>
        <Row label="Volumen" disabled={!draft.pinSound}>
          <div className="volume">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={draft.volume}
              disabled={!draft.pinSound}
              aria-label="Volumen"
              onChange={(e) => set('volume', Number(e.target.value))}
            />
            <span className="value">{draft.volume}%</span>
          </div>
        </Row>
        <Row label="Leer recordatorios en voz alta">
          <Toggle
            checked={draft.readAloud}
            onChange={(v) => set('readAloud', v)}
            label="Leer recordatorios en voz alta"
          />
        </Row>
        <Row label="Tono del aviso" disabled={!draft.pinSound}>
          <Select
            label="Tono del aviso"
            value={draft.tone}
            options={TONE_OPTIONS}
            disabled={!draft.pinSound}
            onChange={(v) => set('tone', v)}
          />
        </Row>
        <div className="s-actions">
          <button type="button" className="btn btn-secondary" onClick={testSound}>
            Probar sonido
          </button>
        </div>
      </section>

      <section className="card s-card">
        <h3 className="s-title">Vibración</h3>
        <Row label="Vibración del pin">
          <Toggle checked={draft.vibration} onChange={(v) => set('vibration', v)} label="Vibración del pin" />
        </Row>
        <Row label="Intensidad" disabled={!draft.vibration}>
          <Select
            label="Intensidad"
            value={draft.intensity}
            options={INTENSITY_OPTIONS}
            disabled={!draft.vibration}
            onChange={(v) => set('intensity', v)}
          />
        </Row>
        <Row label="Duración" disabled={!draft.vibration}>
          <Select
            label="Duración"
            value={draft.duration}
            options={DURATION_OPTIONS}
            disabled={!draft.vibration}
            onChange={(v) => set('duration', v)}
          />
        </Row>
        <p className={`s-sub${draft.vibration ? '' : ' is-disabled'}`}>Patrones por tipo de alerta</p>
        {ALERT_TYPES.map(({ key, label }) => (
          <Row key={key} label={label} nested disabled={!draft.vibration}>
            <Select
              label={`Patrón de vibración: ${label}`}
              value={draft.patterns[key]}
              options={PATTERN_OPTIONS}
              disabled={!draft.vibration}
              onChange={(v) => set('patterns', { ...draft.patterns, [key]: v })}
            />
          </Row>
        ))}
        <div className="s-actions">
          <button type="button" className="btn btn-secondary" onClick={testVibration}>
            Probar vibración
          </button>
        </div>
      </section>

      <section className="card s-card">
        <h3 className="s-title">Notificaciones</h3>
        <Row label="Avisos en el teléfono">
          <Toggle checked={draft.phoneAlerts} onChange={(v) => set('phoneAlerts', v)} label="Avisos en el teléfono" />
        </Row>
        <Row label="Avisar antes">
          <Select
            label="Avisar antes"
            value={draft.notifyBefore}
            options={NOTIFY_BEFORE_OPTIONS}
            onChange={(v) => set('notifyBefore', v)}
          />
        </Row>
        <Row label="Repetir si no confirmo">
          <Select
            label="Repetir si no confirmo"
            value={draft.repeatEvery}
            options={REPEAT_OPTIONS}
            onChange={(v) => set('repeatEvery', v)}
          />
        </Row>
        <Row label="Respaldo en el teléfono">
          <Toggle checked={draft.phoneBackup} onChange={(v) => set('phoneBackup', v)} label="Respaldo en el teléfono" />
        </Row>
      </section>

      <button
        type="button"
        className="btn btn-primary btn-block btn-save"
        onClick={() => {
          onSave(draft);
          showToast('Cambios guardados');
        }}
      >
        Guardar cambios
      </button>
      <p className="save-hint">{dirty ? 'Tenés cambios sin guardar.' : 'Todo está guardado.'}</p>
    </div>
  );
}
