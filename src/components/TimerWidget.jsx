import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Edit2, Clock, Coins, Check, AlertCircle, X } from 'lucide-react';

export default function TimerWidget({ hourlyRate, onSaveSession, activeTimer, setActiveTimer }) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isEditingStart, setIsEditingStart] = useState(false);
  const [editStartTimeVal, setEditStartTimeVal] = useState('');
  const [notes, setNotes] = useState('');
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [showDelayedModal, setShowDelayedModal] = useState(false);
  const [delayedMinutes, setDelayedMinutes] = useState(10);
  const [delayError, setDelayError] = useState('');

  useEffect(() => {
    const checkIOS = () => {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
             (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    };
    setIsIOSDevice(checkIOS());
  }, []);

  // Aggiorna il contatore del timer ogni secondo
  useEffect(() => {
    if (!activeTimer) {
      setElapsedMs(0);
      return;
    }

    const updateTimer = () => {
      const { startTime, isPaused, pausedDurationMs, lastPauseTime } = activeTimer;
      const start = new Date(startTime).getTime();
      
      if (isPaused) {
        const pauseTime = new Date(lastPauseTime).getTime();
        setElapsedMs(pauseTime - start - pausedDurationMs);
      } else {
        const now = Date.now();
        setElapsedMs(now - start - pausedDurationMs);
      }
    };

    updateTimer(); // Esegui subito
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  // Avvia il timer
  const handleStart = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const initialTimer = {
      startTime: now.toISOString(),
      isPaused: false,
      pausedDurationMs: 0,
      lastPauseTime: null,
      date: todayStr,
    };
    setActiveTimer(initialTimer);
    setNotes('');
    setIsEditingStart(false);
  };

  // Avvia il timer in modo programmato (ritardato di X minuti)
  const handleStartDelayed = (minutes) => {
    const now = new Date();
    const futureStart = new Date(now.getTime() + minutes * 60 * 1000);
    const todayStr = now.toISOString().split('T')[0];
    const initialTimer = {
      startTime: futureStart.toISOString(),
      isPaused: false,
      pausedDurationMs: 0,
      lastPauseTime: null,
      date: todayStr,
    };
    setActiveTimer(initialTimer);
    setNotes('');
    setIsEditingStart(false);
  };

  // Metti in pausa il timer
  const handlePause = () => {
    if (!activeTimer || activeTimer.isPaused) return;

    setActiveTimer(prev => ({
      ...prev,
      isPaused: true,
      lastPauseTime: new Date().toISOString()
    }));
  };

  // Riprendi il timer
  const handleResume = () => {
    if (!activeTimer || !activeTimer.isPaused) return;

    const pauseTime = new Date(activeTimer.lastPauseTime).getTime();
    const now = Date.now();
    const additionalPauseMs = now - pauseTime;

    setActiveTimer(prev => ({
      ...prev,
      isPaused: false,
      pausedDurationMs: prev.pausedDurationMs + additionalPauseMs,
      lastPauseTime: null
    }));
  };

  // Ferma e salva il timer
  const handleStop = () => {
    if (!activeTimer) return;

    // Se il timer non è ancora iniziato (avvio programmato)
    if (elapsedMs < 0) {
      if (confirm('Vuoi annullare l\'avvio programmato del timer?')) {
        setActiveTimer(null);
      }
      return;
    }

    const durationHours = elapsedMs / (1000 * 60 * 60);
    
    // Se la durata è piccolissima (es. meno di 10 secondi), chiediamo conferma o la consideriamo nulla
    if (durationHours < 0.001) {
      if (confirm('La sessione è troppo breve per essere registrata (meno di 4 secondi). Vuoi annullarla?')) {
        setActiveTimer(null);
        return;
      }
    }

    const { startTime, pausedDurationMs } = activeTimer;
    
    // Calcoliamo l'orario di fine effettivo
    const startDate = new Date(startTime);
    // L'orario di fine corrisponde a: inizio + durata totale passata + durata delle pause
    const endDate = new Date(startDate.getTime() + elapsedMs + pausedDurationMs);

    const pad = (num) => String(num).padStart(2, '0');
    
    const formatTime = (dateObj) => {
      return `${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`;
    };

    const startTimeFormatted = formatTime(startDate);
    const endTimeFormatted = formatTime(endDate);

    const sessionData = {
      date: activeTimer.date,
      start_time: startTimeFormatted,
      end_time: endTimeFormatted,
      duration_hours: durationHours,
      hourly_rate: hourlyRate,
      earnings: durationHours * hourlyRate,
      notes: notes.trim() || null
    };

    onSaveSession(sessionData);
    setActiveTimer(null);
    setNotes('');
  };

  // Avvia la modifica dell'ora di inizio al volo
  const startEditingStart = () => {
    if (!activeTimer) return;
    const startDate = new Date(activeTimer.startTime);
    const pad = (num) => String(num).padStart(2, '0');
    setEditStartTimeVal(`${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`);
    setIsEditingStart(true);
  };

  // Salva l'ora di inizio corretta
  const saveAdjustedStart = () => {
    if (!activeTimer || !editStartTimeVal) return;

    const [hours, minutes] = editStartTimeVal.split(':').map(Number);
    const currentStart = new Date(activeTimer.startTime);
    const newStart = new Date(currentStart);
    newStart.setHours(hours, minutes, 0, 0);

    // Se la nuova data d'inizio è nel futuro rispetto a ora, la teniamo a oggi o gestiamo l'errore
    if (newStart.getTime() > Date.now()) {
      alert("L'ora di inizio non può essere nel futuro.");
      return;
    }

    // Calcoliamo la differenza di inizio
    const diffMs = currentStart.getTime() - newStart.getTime();

    setActiveTimer(prev => {
      // Se spostiamo l'inizio indietro, aumentiamo la durata accumulata (o eliminiamo pause se necessario)
      // Per semplicità, resettiamo il calcolo delle pause per evitare disallineamenti e aggiorniamo lo startTime.
      // Se il timer era in pausa, lo riprendiamo o lo lasciamo in pausa calcolando il tempo rispetto al nuovo inizio.
      
      return {
        ...prev,
        startTime: newStart.toISOString(),
        // Azzariamo le pause per far sì che la durata sia calcolata esattamente da quel momento ad adesso
        pausedDurationMs: 0,
        isPaused: false,
        lastPauseTime: null
      };
    });

    setIsEditingStart(false);
  };

  // Formatta millisecondi in HH:MM:SS (con supporto per countdown negativi)
  const formatElapsed = (ms) => {
    const isNegative = ms < 0;
    const absMs = Math.abs(ms);
    const totalSecs = Math.floor(absMs / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    const pad = (num) => String(num).padStart(2, '0');
    return `${isNegative ? '-' : ''}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  // Guadagno accumulato stimato (evita valori inferiori a zero durante il countdown)
  const estimatedEarnings = Math.max(0, (elapsedMs / (1000 * 60 * 60)) * hourlyRate);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card-title">
        <Clock size={18} color="var(--color-brand)" />
        <span>Tracciamento in Tempo Reale</span>
      </div>

      {!activeTimer ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Nessuna sessione attiva al momento. Avvia il timer quando inizi a lavorare.
          </p>
          <div className="btn-split-container">
            <button 
              className="btn-split-main"
              onClick={handleStart}
            >
              <Play size={20} fill="white" color="white" />
              Inizia Sessione
            </button>
            <div 
              className="btn-split-timer"
              onClick={!isIOSDevice ? () => { setShowDelayedModal(true); setDelayError(''); } : undefined}
              title="Programma avvio sessione"
            >
              <Clock size={20} color="white" />
              
              {isIOSDevice && (
                <select
                  value=""
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (val >= 1 && val <= 100) {
                      handleStartDelayed(val);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    WebkitAppearance: 'menulist-button',
                  }}
                >
                  <option value="" disabled>Avvia tra...</option>
                  {Array.from({ length: 100 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'minuto' : 'minuti'}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="timer-container">
          <div className={`timer-circle ${!activeTimer.isPaused ? 'active' : ''}`}>
            <div className={`timer-display ${!activeTimer.isPaused ? 'active' : ''}`}>
              {formatElapsed(elapsedMs)}
            </div>
             <div className="timer-label">
              {elapsedMs < 0 ? 'Avvio programmato' : (activeTimer.isPaused ? 'In Pausa' : 'In Corso')}
            </div>
          </div>

          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <div className="stat-box" style={{ flex: 1, padding: '10px 14px' }}>
              <span className="stat-lbl" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Coins size={12} color="var(--color-success)" /> Stima Guadagno
              </span>
              <span className="stat-val earnings" style={{ fontSize: '18px' }}>
                €{estimatedEarnings.toFixed(2)}
              </span>
            </div>

            <div className="stat-box" style={{ flex: 1, padding: '10px 14px', position: 'relative' }}>
              <span className="stat-lbl">Iniziato alle</span>
              {isEditingStart ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <input
                    type="time"
                    value={editStartTimeVal}
                    onChange={(e) => setEditStartTimeVal(e.target.value)}
                    style={{ padding: '4px 6px', fontSize: '14px', width: '75px', borderRadius: '4px' }}
                  />
                  <button className="btn-icon" onClick={saveAdjustedStart} style={{ width: '28px', height: '28px', backgroundColor: 'var(--color-brand)', color: 'white' }}>
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '600' }}>
                    {new Date(activeTimer.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button 
                    onClick={startEditingStart} 
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                    title="Modifica ora di inizio"
                  >
                    <Edit2 size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="form-group" style={{ width: '100%', marginBottom: '0' }}>
            <label htmlFor="timer-notes">Note sulla sessione (opzionale)</label>
            <input
              id="timer-notes"
              type="text"
              placeholder="Cosa stai facendo?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ fontSize: '14px', padding: '10px' }}
            />
          </div>

          <div className="timer-controls">
            {elapsedMs < 0 ? (
              <button className="btn btn-danger" onClick={handleStop} style={{ flex: 1 }}>
                <Square size={16} fill="white" />
                Annulla Avvio
              </button>
            ) : (
              <>
                {activeTimer.isPaused ? (
                  <button className="btn btn-primary" onClick={handleResume} style={{ flex: 1 }}>
                    <Play size={16} fill="white" />
                    Riprendi
                  </button>
                ) : (
                  <button className="btn btn-secondary" onClick={handlePause} style={{ flex: 1 }}>
                    <Pause size={16} />
                    Pausa
                  </button>
                )}
                <button className="btn btn-danger" onClick={handleStop} style={{ flex: 1 }}>
                  <Square size={16} fill="white" />
                  Termina
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showDelayedModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '340px', padding: '24px' }}>
            <div className="modal-header" style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <Clock size={20} color="var(--color-brand)" />
                Avvio Temporizzato
              </h3>
              <button 
                onClick={() => { setShowDelayedModal(false); setDelayError(''); }} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: '1.4' }}>
              Imposta il timer affinché parta automaticamente dopo i minuti selezionati.
            </p>
            
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label htmlFor="delayed-minutes-input" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block', color: 'var(--text-primary)' }}>
                Minuti di attesa (da 1 a 100)
              </label>
              <input
                id="delayed-minutes-input"
                type="number"
                min="1"
                max="100"
                value={delayedMinutes}
                onChange={(e) => {
                  const val = e.target.value;
                  setDelayedMinutes(val);
                  const parsed = parseInt(val, 10);
                  if (val && (isNaN(parsed) || parsed < 1 || parsed > 100)) {
                    setDelayError('Inserisci un numero intero compreso tra 1 e 100.');
                  } else {
                    setDelayError('');
                  }
                }}
                placeholder="Es. 10"
                style={{ width: '100%', padding: '10px', fontSize: '15px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', outline: 'none' }}
              />
              <small style={{ display: 'block', marginTop: '6px', color: delayError ? 'var(--color-danger)' : 'var(--text-secondary)', fontSize: '12px' }}>
                {delayError || 'L\'intervallo consentito va da 1 a 100 minuti.'}
              </small>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => { setShowDelayedModal(false); setDelayError(''); }} 
                style={{ flex: 1, height: '40px', padding: '0 12px', fontSize: '14px' }}
              >
                Annulla
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  const val = parseInt(delayedMinutes, 10);
                  if (isNaN(val) || val < 1 || val > 100) {
                    setDelayError('Inserisci un numero valido compreso tra 1 e 100.');
                    return;
                  }
                  handleStartDelayed(val);
                  setShowDelayedModal(false);
                }}
                disabled={!!delayError || !delayedMinutes}
                style={{ flex: 1, height: '40px', padding: '0 12px', fontSize: '14px' }}
              >
                Avvia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
