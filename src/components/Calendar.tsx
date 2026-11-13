import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { WEEKDAY_INITIALS, buildMonthGrid, longDayLabel, monthLabel, parseISODate, todayISO } from '../dates';

export type DayMark = 'pending' | 'done';

interface CalendarProps {
  selectedDate: string;
  onSelect: (date: string) => void;
  marks: Map<string, DayMark>;
}

const monthOf = (iso: string) => {
  const d = parseISODate(iso);
  return { year: d.getFullYear(), month: d.getMonth() };
};

export default function Calendar({ selectedDate, onSelect, marks }: CalendarProps) {
  const [view, setView] = useState(() => monthOf(selectedDate));

  useEffect(() => {
    setView(monthOf(selectedDate));
  }, [selectedDate]);

  const today = todayISO();
  const cells = buildMonthGrid(view.year, view.month);

  const shiftMonth = (delta: number) =>
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const goToday = () => {
    onSelect(today);
    setView(monthOf(today));
  };

  return (
    <div className="calendar">
      <div className="cal-header">
        <h3 aria-live="polite">{monthLabel(view.year, view.month)}</h3>
        <button type="button" className="icon-btn" aria-label="Ir a hoy" onClick={goToday}>
          <CalendarDays size={21} strokeWidth={2.2} />
        </button>
      </div>

      <div className="cal-grid cal-weekdays" aria-hidden>
        {WEEKDAY_INITIALS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((iso, i) => {
          if (!iso) return <span key={`empty-${i}`} />;
          const mark = marks.get(iso);
          const classes = [
            'cal-day',
            iso === today && 'is-today',
            iso === selectedDate && 'is-selected',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={iso}
              type="button"
              className={classes}
              aria-pressed={iso === selectedDate}
              aria-label={`${longDayLabel(iso)}${mark ? ', con tareas' : ''}`}
              onClick={() => onSelect(iso)}
            >
              <span className="cal-num">{Number(iso.slice(8))}</span>
              {mark && <span className={`cal-dot is-${mark}`} />}
            </button>
          );
        })}
      </div>

      <div className="cal-footer">
        <button type="button" className="icon-btn" aria-label="Mes anterior" onClick={() => shiftMonth(-1)}>
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <button type="button" className="icon-btn" aria-label="Mes siguiente" onClick={() => shiftMonth(1)}>
          <ChevronRight size={22} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
