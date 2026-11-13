import { Bluetooth, BluetoothOff } from 'lucide-react';
import Modal from './Modal';
import PinStatus from './PinStatus';

interface PinModalProps {
  connected: boolean;
  onSetConnected: (connected: boolean) => void;
  onClose: () => void;
}

export default function PinModal({ connected, onSetConnected, onClose }: PinModalProps) {
  const info = [
    ['Nombre', 'Pin de Mi agenda'],
    ['Modelo', 'MA-01 (ficticio)'],
    ['Batería', connected ? '80%' : '—'],
    ['Señal', connected ? 'Buena' : 'Sin conexión'],
    ['Firmware', '1.2.0'],
    ['Sincronización', connected ? 'Ahora' : 'Hace un momento'],
  ];

  return (
    <Modal title="Administrar pin" onClose={onClose}>
      <PinStatus connected={connected} large />
      <dl className="info-list">
        {info.map(([term, value]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="modal-note">Información ficticia de demostración. No se usa Bluetooth.</p>
      <div className="btn-stack">
        {connected ? (
          <button type="button" className="btn btn-secondary btn-block" onClick={() => onSetConnected(false)}>
            <BluetoothOff size={18} />
            Simular desconexión
          </button>
        ) : (
          <button type="button" className="btn btn-primary btn-block" onClick={() => onSetConnected(true)}>
            <Bluetooth size={18} />
            Simular conexión
          </button>
        )}
        <button type="button" className="btn btn-ghost btn-block" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </Modal>
  );
}
