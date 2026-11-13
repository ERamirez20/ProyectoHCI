import { formatTime, pad2 } from '../dates';
import type { AmbiguousTime } from '../parseReminder';

interface MeridiemChoiceProps {
  ambiguous: AmbiguousTime;
  value: string;
  onPick: (time: string) => void;
}

export default function MeridiemChoice({ ambiguous, value, onPick }: MeridiemChoiceProps) {
  const base = ambiguous.hour % 12;
  const minute = pad2(ambiguous.minute);
  const options = [`${pad2(base)}:${minute}`, `${pad2(base + 12)}:${minute}`];
  const spoken = `${ambiguous.hour}:${minute}`;

  return (
    <div className="meridiem-choice" role="group" aria-label={`¿${spoken} de la mañana o de la tarde?`}>
      <span className="meridiem-question">¿{spoken} de la mañana o de la tarde/noche?</span>
      <div className="meridiem-options">
        {options.map((time) => (
          <button
            key={time}
            type="button"
            className={`chip${value === time ? ' is-selected' : ''}`}
            aria-pressed={value === time}
            onClick={() => onPick(time)}
          >
            {formatTime(time)}
          </button>
        ))}
      </div>
    </div>
  );
}
