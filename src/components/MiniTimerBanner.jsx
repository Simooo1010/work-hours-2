import { useEffect, useState } from 'react';

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
export default function MiniTimerBanner({ activeTimer, onClick }) {
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

  return (
    <div style={{ padding: '16px 20px 0 20px' }}>
      <div className="mini-timer-banner" onClick={onClick}>
        <div className="mini-timer-info">
          <div
            className="mini-timer-pulse"
            style={{ backgroundColor: elapsedMs < 0 ? '#d97706' : 'var(--color-brand)' }}
          ></div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
              {elapsedMs < 0 ? 'Avvio programmato' : 'Sessione in corso'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Note: {activeTimer.notes || 'Nessuna'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: '700',
              fontSize: '18px',
              color: elapsedMs < 0 ? '#d97706' : 'var(--color-brand)'
            }}
          >
            {formatElapsed(elapsedMs)}
          </span>
        </div>
      </div>
    </div>
  );
}
