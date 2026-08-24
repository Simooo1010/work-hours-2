import { useEffect, useRef } from 'react';
import { useUIFeedback } from '../hooks/useUIFeedback';

const HOUR_MS = 60 * 60 * 1000;

// Componente invisibile, sempre montato: avvisa l'utente ogni ora piena di
// lavoro trascorsa durante una sessione attiva (1h, 2h, 3h, ...), tramite
// notifica del browser (se autorizzata) e, comunque, un toast in-app.
export default function TimerHourlyNotifier({ activeTimer }) {
  const { showToast } = useUIFeedback();
  const lastNotifiedHourRef = useRef(0);
  const activeTimerRef = useRef(activeTimer);

  // Teniamo sempre un riferimento aggiornato all'ultimo activeTimer, senza che
  // questo forzi il riavvio dell'intervallo sottostante (es. su pausa/ripresa).
  useEffect(() => {
    activeTimerRef.current = activeTimer;
  }, [activeTimer]);

  // L'intervallo si avvia/ferma solo quando cambia l'orario di inizio effettivo
  // (cioè quando parte un nuovo timer), non ad ogni piccola modifica di stato.
  const startTime = activeTimer?.startTime ?? null;

  useEffect(() => {
    lastNotifiedHourRef.current = 0;
    if (!startTime) return;

    const checkElapsed = () => {
      const timer = activeTimerRef.current;
      if (!timer) return;

      const { startTime: st, isPaused, pausedDurationMs, lastPauseTime } = timer;
      const start = new Date(st).getTime();

      const elapsedMs = isPaused
        ? new Date(lastPauseTime).getTime() - start - pausedDurationMs
        : Date.now() - start - pausedDurationMs;

      if (elapsedMs < 0) return; // Avvio programmato non ancora iniziato

      const elapsedHours = Math.floor(elapsedMs / HOUR_MS);

      if (elapsedHours > lastNotifiedHourRef.current) {
        lastNotifiedHourRef.current = elapsedHours;

        const label = elapsedHours === 1 ? '1 ora' : `${elapsedHours} ore`;
        const message = `Sessione in corso da ${label}${timer.notes ? ` — ${timer.notes}` : ''}.`;

        showToast(message, 'info', 6000);

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('Work Tracker', { body: message, tag: 'work-tracker-hourly' });
          } catch (err) {
            console.error('Impossibile mostrare la notifica del browser:', err);
          }
        }
      }
    };

    checkElapsed();
    const interval = setInterval(checkElapsed, 1000);
    return () => clearInterval(interval);
  }, [startTime, showToast]);

  return null;
}
