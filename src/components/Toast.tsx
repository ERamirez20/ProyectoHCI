import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

export interface ToastMessage {
  id: number;
  text: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDone: () => void;
}

export default function Toast({ toast, onDone }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onDone, 2400);
    return () => window.clearTimeout(timer);
  }, [toast, onDone]);

  return (
    <div className="toast-layer" role="status" aria-live="polite">
      {toast && (
        <div className="toast" key={toast.id}>
          <CheckCircle2 size={18} aria-hidden />
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
}
