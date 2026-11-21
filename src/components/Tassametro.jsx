import { useEffect, useRef, useState } from 'react';
import { roundHours, roundToQuarterEuro } from '../utils/rounding';
import { formatEuro, formatHoursIt, pad2 } from '../utils/format';

// Una tessera "split-flap": il valore cambia con un flip (rotateX) a meta' animazione.
function FlapTile({ value, outlined }) {
  const [shown, setShown] = useState(value);
  const [flipping, setFlipping] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return undefined;
    prev.current = value;
    setFlipping(true);
    const swap = setTimeout(() => setShown(value), 150);
    const end = setTimeout(() => setFlipping(false), 320);
    return () => {
      clearTimeout(swap);
      clearTimeout(end);
    };
  }, [value]);

  return (
    <span
      className={`flap-tile${outlined ? ' outlined' : ''}${flipping ? ' flipping' : ''}`}
      aria-hidden="true"
    >
      <span className="flap-digit">{shown}</span>
    </span>
  );
}

/**
 * FlapRow: tessere per HH:MM:SS o per un importo. Un solo elemento role="img"
 * con etichetta completa; le tessere sono aria-hidden.
 */
export function FlapRow({ text, size = 'L', outlined = false, label }) {
  const chars = String(text).split('');
  return (
    <div className={`flap-row flap-${size}`} role="img" aria-label={label || String(text)}>
      {chars.map((c, i) =>
        c === ':' || c === ',' || c === '.' || c === '-' ? (
          <span key={`s${i}`} className="flap-sep" aria-hidden="true">{c}</span>
        ) : (
          <FlapTile key={`t${i}`} value={c} outlined={outlined} />
        )
      )}
    </div>
  );
}

/** Meter: euro + intero + decimali in Big Shoulders 900. */
export function Meter({ amount, size = 'L', outlined = false }) {
  const [intPart, dec] = Number(amount || 0).toFixed(2).split('.');
  return (
    <div
      className={`meter meter-${size}${outlined ? ' outlined' : ''}`}
      role="img"
      aria-label={`${intPart},${dec} euro`}
    >
      <span className="meter-eur" aria-hidden="true">€</span>
      <span className="meter-int" aria-hidden="true">{intPart}</span>
      <span className="meter-dec" aria-hidden="true">,{dec}</span>
    </div>
  );
}

/**
 * RoundingRuler: finestra di 1,5 h attorno al tempo trascorso con notch
 * ogni mezz'ora. Il disco nero e' la mezz'ora a cui si arrotonda; il
 * triangolo indica il tempo reale. Regola: utils/rounding.js
 */
export function RoundingRuler({ hours, rate }) {
  const safeHours = Math.max(0, hours);
  const target = roundHours(safeHours);
  const WINDOW = 1.5;
  const base = Math.max(0, Math.round((safeHours - WINDOW / 2) * 2) / 2);
  const notches = [0, 1, 2, 3].map((i) => base + i * 0.5);
  const lo = notches[0] - 0.25;
  const span = notches[3] + 0.25 - lo;
  const pos = (h) => `${Math.min(100, Math.max(0, ((h - lo) / span) * 100))}%`;
  const rounded = roundToQuarterEuro(target * rate);

  return (
    <div className="ruler">
      <div className="ruler-head">
        <span className="mono-label">ARROTONDA A MEZZ'ORA</span>
        <span className="ruler-result">
          {formatHoursIt(target)} h → € {formatEuro(rounded)}
        </span>
      </div>
      <div className="ruler-track" aria-hidden="true">
        <div className="ruler-baseline" />
        {notches.map((n) => (
          <span
            key={n}
            className={`ruler-notch${n === target ? ' target' : ''}`}
            style={{ left: pos(n) }}
          >
            <span className="ruler-label">{formatHoursIt(n)}</span>
          </span>
        ))}
        <span className="ruler-pointer" style={{ left: pos(safeHours) }} />
      </div>
      <span className="sr-only">
        Tempo reale {formatHoursIt(safeHours)} ore, arrotondato a {formatHoursIt(target)} ore.
      </span>
    </div>
  );
}

/** Stamp: parola ruotata con contorno (SALVATA, PAGATO, ERRORE...). */
export function Stamp({ children }) {
  return <span className="stamp" role="status">{children}</span>;
}

/** Stub: blocco in carta perforata con importo, stato e azione. */
export function Stub({ label, amount, paid, children }) {
  return (
    <div className={`stub${paid ? ' paid' : ''}`}>
      <div className="mono-label">{label}</div>
      <div className="stub-amount">€ {formatEuro(amount)}</div>
      {paid && <Stamp>PAGATO</Stamp>}
      {children}
    </div>
  );
}

const AXIS_START = 6;
const AXIS_END = 22;

const toHour = (t) => {
  const [h, m] = String(t).split(':').map(Number);
  return h + (m || 0) / 60;
};

/**
 * TimeCard: scheda nera con asse orario 06-22 e una riga per giorno;
 * ogni sessione e' una barra gialla (PunchBar) posizionata per inizio/fine.
 * days: [{ key, label, sessions: [{start_time, end_time}], hours }]
 */
export function TimeCard({ days, empty }) {
  const span = AXIS_END - AXIS_START;
  const ticks = [6, 10, 14, 18, 22];
  return (
    <div className="timecard" role="table" aria-label="Scheda settimanale">
      <div className="timecard-axis" aria-hidden="true">
        <span className="timecard-daycol" />
        <span className="timecard-axis-track">
          {ticks.map((t) => (
            <span key={t} style={{ left: `${((t - AXIS_START) / span) * 100}%` }}>{pad2(t)}</span>
          ))}
        </span>
        <span className="timecard-hourscol" />
      </div>
      {days.map((d, rowIdx) => (
        <div className="timecard-row" role="row" key={d.key}>
          <span className="timecard-daycol mono-label" role="rowheader">{d.label}</span>
          <span className="timecard-track">
            {d.sessions.map((s, i) => {
              const a = Math.max(AXIS_START, Math.min(AXIS_END, toHour(s.start_time)));
              const rawEnd = toHour(s.end_time);
              const b = Math.max(a + 0.15, Math.min(AXIS_END, rawEnd < a ? AXIS_END : rawEnd));
              return (
                <span
                  key={s.id || i}
                  className="punchbar"
                  style={{
                    left: `${((a - AXIS_START) / span) * 100}%`,
                    width: `${((b - a) / span) * 100}%`,
                    animationDelay: `${rowIdx * 70}ms`,
                  }}
                  title={`${String(s.start_time).substring(0, 5)} - ${String(s.end_time).substring(0, 5)}`}
                />
              );
            })}
          </span>
          <span className="timecard-hourscol timecard-hours" role="cell">
            {d.hours > 0 ? formatHoursIt(d.hours) : '-'}
          </span>
        </div>
      ))}
      {empty && <div className="timecard-empty mono-label">Nessuna sessione</div>}
    </div>
  );
}
