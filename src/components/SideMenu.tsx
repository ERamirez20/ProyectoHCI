import { useEffect } from 'react';
import { List, Mic, RotateCcw, Settings, X } from 'lucide-react';
import type { Screen } from '../types';

const ITEMS = [
  { id: 'agenda', label: 'Agenda', Icon: List },
  { id: 'dictar', label: 'Dictar', Icon: Mic },
  { id: 'ajustes', label: 'Ajustes', Icon: Settings },
] as const;

interface SideMenuProps {
  current: Screen;
  onNavigate: (screen: Screen) => void;
  onReset: () => void;
  onClose: () => void;
}

export default function SideMenu({ current, onNavigate, onReset, onClose }: SideMenuProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="drawer-layer" onClick={onClose}>
      <div className="drawer-frame">
        <aside className="drawer" aria-label="Menú" onClick={(e) => e.stopPropagation()}>
          <div className="drawer-head">
            <div>
              <p className="drawer-title">Mi agenda</p>
              <p className="drawer-subtitle">Prototipo · pin y alertas simulados</p>
            </div>
            <button type="button" className="icon-btn" aria-label="Cerrar menú" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`drawer-item${current === id ? ' is-active' : ''}`}
              aria-current={current === id ? 'page' : undefined}
              onClick={() => onNavigate(id)}
            >
              <Icon size={20} />
              {label}
            </button>
          ))}

          <div className="drawer-sep" />

          <button type="button" className="drawer-item is-danger" onClick={onReset}>
            <RotateCcw size={20} />
            Restablecer demo
          </button>

          <p className="drawer-foot">Tus recordatorios se guardan en este navegador.</p>
        </aside>
      </div>
    </div>
  );
}
