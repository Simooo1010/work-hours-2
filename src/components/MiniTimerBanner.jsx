import { useEffect, useState } from 'react';
import { FlapRow, Meter } from './Tassametro';

// Formatta millisecondi in HH:MM:SS (supporta countdown negativi per avvii programmati)
function formatElapsed(ms) {
  const isNegative = ms < 0;
  const absMs = Math.abs(ms);
  const totalSecs = Math.floor(absMs / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  const pad = (num) => String(num).padStart(2, '0');
  return `${isNegative ? '-' : ''}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// Componente isolato: gestisce il proprio tick al secondo così da non forzare
// il re-render dell'intera App (e della vista corrente) ogni secondo.
export default function MiniTimerBanner({ activeTimer, rate: rateProp, onClick }) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!activeTimer) {
      setElapsedMs(0);
      return;
    }

    const update = () => {
      const { startTime, isPaused, pausedDurationMs, lastPauseTime } = activeTimer;
      const start = new Date(startTime).getTime();

      if (isPaused) {
        const pauseTime = new Date(lastPauseTime).getTime();
        setElapsedMs(pauseTime - start - pausedDurationMs);
      } else {
        setElapsedMs(Date.now() - start - pausedDurationMs);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  if (!activeTimer) return null;

  const hours = Math.max(0, elapsedMs) / 3600000;
  const rate = Number(rateProp || 0);
  return (
    <div className="mini-timer-wrap">
      <button type="button" className="mini-timer-banner" onClick={onClick} aria-label="Torna al timer">
        <span className="mini-timer-info">
          <span className="mini-timer-pulse" aria-hidden="true"></span>
          <span className="mono-label">{elapsedMs < 0 ? 'AVVIO PROGRAMMATO' : activeTimer.isPaused ? 'IN PAUSA' : 'IN CORSO'}</span>
        </span>
        <FlapRow text={formatElapsed(elapsedMs)} size="S" label={`Tempo trascorso ${formatElapsed(elapsedMs)}`} />
        {rate > 0 && <Meter amount={hours * rate} size="S" />}
      </button>
    </div>
  );
}
