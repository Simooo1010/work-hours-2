import React, { useMemo, memo } from 'react';
import { Clock } from 'lucide-react';
import TimerWidget from './TimerWidget';
import { roundHours, formatHoursAndMinutes } from '../utils/rounding';
import { TimeCard } from './Tassametro';
import { formatHoursIt, formatEuro } from '../utils/format';
import { buildWeek, mondayOf } from '../utils/week';

function Dashboard({ sessions, hourlyRate, activeTimer, setActiveTimer, onSaveSession, onOpenWeek }) {
  
  // Calcolo dei totali storici CON ARROTONDAMENTO applicato (richiesto per la dashboard principale)
  const roundedTotals = useMemo(() => {
    let hours = 0;
    let earnings = 0;
    
    sessions.forEach(s => {
      const rh = roundHours(Number(s.duration_hours));
      hours += rh;
      earnings += rh * Number(s.hourly_rate);
    });
    
    return { hours, earnings, count: sessions.length };
  }, [sessions]);

  // Filtra le sessioni di oggi (in data locale)
  const todayStr = new Date().toLocaleDateString('sv-SE'); // Formato YYYY-MM-DD locale
  
  const todaySessions = useMemo(() => {
    return sessions.filter(s => s.date === todayStr);
  }, [sessions, todayStr]);

  // Formatta la data per visualizzarla in italiano
  const formatDateIt = (dateStr) => {
    const d = new Date(dateStr);
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    const formatted = d.toLocaleDateString('it-IT', options);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).replace('.', '');
  };

  const todayHours = todaySessions.reduce((a, s) => a + roundHours(Number(s.duration_hours)), 0);
  const todayEarnings = todaySessions.reduce(
    (a, s) => a + roundHours(Number(s.duration_hours)) * Number(s.hourly_rate),
    0
  );
  const week = useMemo(() => buildWeek(sessions, mondayOf(new Date())), [sessions]);

  return (
    <div className="view-content dashboard-grid">
      {/* 1. TIMER: split-flap + tassametro */}
      <TimerWidget
        hourlyRate={hourlyRate}
        onSaveSession={onSaveSession}
        activeTimer={activeTimer}
        setActiveTimer={setActiveTimer}
      />

      {/* 2. RIEPILOGO DI OGGI */}
      <div className="card dashboard-today">
        <div className="mono-label">OGGI · {formatDateIt(todayStr)}</div>
        <div className="mono-line" style={{ fontSize: '15px' }}>
          Oggi {formatHoursIt(todayHours)} h · € {formatEuro(todayEarnings)}
        </div>
        {todaySessions.length === 0 ? (
          <p className="mono-line">Nessuna sessione registrata oggi. Avvia il timer per iniziare.</p>
        ) : (
          <div className="sessions-list-container">
            {todaySessions.map((session) => {
              const rHours = roundHours(Number(session.duration_hours));
              const rEarnings = rHours * Number(session.hourly_rate);
              return (
                <div key={session.id} className="session-item">
                  <div className="session-info">
                    <div className="session-date">{session.notes || 'Sessione di Lavoro'}</div>
                    <div className="session-time">
                      <Clock size={12} aria-hidden="true" />
                      <span>
                        {session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}
                      </span>
                      <span>(@ €{Number(session.hourly_rate).toFixed(2)}/h)</span>
                    </div>
                  </div>
                  <div className="session-financial">
                    <span className="session-earnings">€{rEarnings.toFixed(2)}</span>
                    <span className="session-hours">{formatHoursAndMinutes(rHours)} (arr.)</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. SETTIMANA IN MINIATURA (tap = Settimana) */}
      <button
        type="button"
        className="card dashboard-week-mini"
        onClick={onOpenWeek}
        aria-label="Apri la settimana"
      >
        <div className="mono-label">QUESTA SETTIMANA · {formatHoursIt(week.hours)} h · € {formatEuro(week.earnings)}</div>
        <TimeCard days={week.days} empty={week.count === 0} />
      </button>

      <div className="mono-line dashboard-total">
        Totale storico arrotondato: € {formatEuro(roundedTotals.earnings)} · {formatHoursAndMinutes(roundedTotals.hours)} · {roundedTotals.count} sessioni
      </div>
    </div>
  );
}

export default memo(Dashboard);
