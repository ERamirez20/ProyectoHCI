import { List, Mic, Settings } from 'lucide-react';
import type { Screen } from '../types';

const ITEMS = [
  { id: 'dictar', label: 'Dictar', Icon: Mic },
  { id: 'agenda', label: 'Agenda', Icon: List },
  { id: 'ajustes', label: 'Ajustes', Icon: Settings },
] as const;

interface BottomNavProps {
  current: Screen;
  onNavigate: (screen: Screen) => void;
}

export default function BottomNav({ current, onNavigate }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {ITEMS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`nav-item${current === id ? ' is-active' : ''}`}
          aria-current={current === id ? 'page' : undefined}
          onClick={() => onNavigate(id)}
        >
          <Icon size={20} strokeWidth={2.5} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
