import { CircleDot, CircleOff } from 'lucide-react';

interface PinStatusProps {
  connected: boolean;
  large?: boolean;
}

export default function PinStatus({ connected, large }: PinStatusProps) {
  const Icon = connected ? CircleDot : CircleOff;
  return (
    <div className={`pin-status${connected ? '' : ' is-off'}${large ? ' is-large' : ''}`}>
      <Icon size={large ? 20 : 18} strokeWidth={2.5} aria-hidden />
      <span>{connected ? 'Pin conectado' : 'Pin desconectado'}</span>
    </div>
  );
}
