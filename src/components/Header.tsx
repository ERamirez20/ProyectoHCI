import { Bell, MapPin, Menu, Settings } from 'lucide-react';

interface HeaderProps {
  title: string;
  pinConnected: boolean;
  onMenu: () => void;
  onBell: () => void;
  onSettings: () => void;
}

export default function Header({ title, pinConnected, onMenu, onBell, onSettings }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <button type="button" className="menu-btn" aria-label="Abrir menú" onClick={onMenu}>
          <Menu size={22} strokeWidth={2.5} />
        </button>
        <MapPin
          size={16}
          strokeWidth={2.5}
          className={`header-pin${pinConnected ? '' : ' is-off'}`}
          aria-label={pinConnected ? 'Pin conectado' : 'Pin desconectado'}
        />
        <h1>{title}</h1>
        <div className="header-actions">
          <button type="button" className="icon-btn" aria-label="Avisos" onClick={onBell}>
            <Bell size={20} fill="currentColor" />
            <span className="badge-dot" />
          </button>
          <button type="button" className="icon-btn" aria-label="Ajustes" onClick={onSettings}>
            <Settings size={21} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </header>
  );
}
