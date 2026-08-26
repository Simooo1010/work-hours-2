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
          const notificationOptions = {
            body: message,
            tag: 'work-tracker-hourly',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [200, 100, 200],
            renotify: true,
          };

          // Su iOS (PWA installata sulla schermata Home) le notifiche vanno
          // mostrate tramite il service worker: `new Notification()` da sola
          // spesso viene ignorata in modalità standalone. Se un service
          // worker è attivo lo usiamo sempre; altrimenti ricadiamo sul
          // costruttore diretto (browser desktop/Android senza SW pronto).
          const controller = navigator.serviceWorker?.controller;
          if (controller) {
            controller.postMessage({
              type: 'show-notification',
              title: 'Work Tracker',
              options: notificationOptions,
            });
          } else {
            try {
              new Notification('Work Tracker', notificationOptions);
            } catch (err) {
              console.error('Impossibile mostrare la notifica del browser:', err);
            }
          }
        }
      }
    };

    checkElapsed();
    const interval = setInterval(checkElapsed, 1000);

    // I timer JS vengono sospesi/rallentati da iOS quando l'app va in
    // background o lo schermo si blocca. Rieseguiamo subito il controllo
    // non appena l'app torna in primo piano, così la notifica dell'ora
    // maturata nel frattempo arriva il prima possibile, invece di aspettare
    // il prossimo tick dell'intervallo (che potrebbe essere ritardato).
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') checkElapsed();
    };
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', checkElapsed);
    window.addEventListener('pageshow', checkElapsed);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', checkElapsed);
      window.removeEventListener('pageshow', checkElapsed);
    };
  }, [startTime, showToast]);

  return null;
}
