import React, { useMemo } from 'react';
import { PixelTrend, PixelClock, PixelMoney, PixelHistory } from './PixelIcons';
import TimerWidget from './TimerWidget';
import { roundHours, getRoundedEarnings, formatHoursAndMinutes } from '../utils/rounding';

export default function Dashboard({ sessions, hourlyRate, activeTimer, setActiveTimer, onSaveSession }) {
  
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

  return (
    <div className="view-content dashboard-grid">
      {/* 1. SEZIONE TOTALI STORICI (Arrotondati) */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="card-title" style={{ marginBottom: '4px' }}>
          <PixelTrend size={18} color="var(--color-brand)" />
          <span>Riepilogo Totale (Arrotondato)</span>
        </div>
        <div className="stats-grid">
          <div className="stat-box highlight">
            <span className="stat-lbl">Guadagno Totale</span>
            <span className="stat-val earnings">€{roundedTotals.earnings.toFixed(2)}</span>
          </div>
          <div className="stat-box">
            <span className="stat-lbl">Ore Totali</span>
            <span className="stat-val">{formatHoursAndMinutes(roundedTotals.hours)}</span>
          </div>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
          Conteggio basato su {roundedTotals.count} sessioni registrate
        </div>
      </div>

      {/* 2. TIMER DI TRACCIAMENTO IN TEMPO REALE */}
      <TimerWidget
        hourlyRate={hourlyRate}
        onSaveSession={onSaveSession}
        activeTimer={activeTimer}
        setActiveTimer={setActiveTimer}
      />

      {/* 3. LISTA DELLE SESSIONI DI OGGI */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="card-title" style={{ marginBottom: '4px' }}>
          <PixelHistory size={18} color="var(--color-brand)" />
          <span>Sessioni di Oggi ({formatDateIt(todayStr)})</span>
        </div>
        
        {todaySessions.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0', fontSize: '14px' }}>
            Nessuna sessione registrata oggi. Avvia il timer sopra per iniziare!
          </p>
        ) : (
          <div className="sessions-list-container">
            {todaySessions.map((session) => {
              const rHours = roundHours(Number(session.duration_hours));
              const rEarnings = rHours * Number(session.hourly_rate);
              
              return (
                <div key={session.id} className="session-item">
                  <div className="session-info">
                    <div className="session-date" style={{ fontSize: '14px' }}>
                      {session.notes || 'Sessione di Lavoro'}
                    </div>
                    <div className="session-time" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                      <PixelClock size={12} />
                      <span>
                        {session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        (@ €{Number(session.hourly_rate).toFixed(2)}/h)
                      </span>
                    </div>
                  </div>

                  <div className="session-financial">
                    <span className="session-earnings" style={{ fontSize: '14px' }}>
                      €{rEarnings.toFixed(2)}
                    </span>
                    <span className="session-hours" style={{ fontSize: '12px' }}>
                      {formatHoursAndMinutes(rHours)} (arr.)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
