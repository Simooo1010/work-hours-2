import { useMemo, useState, memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buildWeek, mondayOf, isoWeek } from '../utils/week';
import { TimeCard, Stub } from './Tassametro';
import { formatHoursIt, formatEuro } from '../utils/format';

function WeekView({ sessions, hourlyRate, onOpenFinance }) {
  const [monday, setMonday] = useState(() => mondayOf(new Date()));
  const week = useMemo(() => buildWeek(sessions, monday), [sessions, monday]);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
  const shift = (n) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + n * 7);
    setMonday(d);
  };

  return (
    <div className="view-content">
      <div className="week-head">
        <button className="btn-icon" onClick={() => shift(-1)} aria-label="Settimana precedente">
          <ChevronLeft size={20} />
        </button>
        <div className="week-title">
          <span className="mono-label">SETTIMANA {isoWeek(monday)}</span>
          <span className="week-range">{fmt(monday)} - {fmt(sunday)}</span>
        </div>
        <button className="btn-icon" onClick={() => shift(1)} aria-label="Settimana successiva">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="week-sheet">
        <TimeCard days={week.days} empty={week.count === 0} />
        <div className="week-totals">
          <div className="week-total-block">
            <span className="mono-label">ORE TOTALI</span>
            <span className="week-total-num">{formatHoursIt(week.hours)}<small> h</small></span>
          </div>
          <div className="week-total-block">
            <span className="mono-label">GUADAGNO ARROTONDATO</span>
            <span className="week-total-num"><small>€ </small>{formatEuro(week.earnings)}</span>
          </div>
          <div className="mono-line">
            {week.count} {week.count === 1 ? 'sessione' : 'sessioni'} · € {formatEuro(hourlyRate)}/h · arrotondato per sessione
          </div>
        </div>
        <Stub label="SALDO DELLA SETTIMANA" amount={week.earnings} paid={false}>
          <p className="stub-text">
            Lo stato di pagamento e l'invio a Finance Tracker si gestiscono nella sezione Finance.
          </p>
          <button className="btn btn-primary big-btn" onClick={onOpenFinance}>
            VAI A FINANCE
          </button>
        </Stub>
      </div>
    </div>
  );
}

export default memo(WeekView);
