import { PixelPlay, PixelPause, PixelStop, PixelEdit, PixelClock, PixelMoney, PixelCheck, PixelAlert } from './PixelIcons';
import React, { useState, useEffect } from 'react';


export default function TimerWidget({ hourlyRate, onSaveSession, activeTimer, setActiveTimer }) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isEditingStart, setIsEditingStart] = useState(false);
  const [editStartTimeVal, setEditStartTimeVal] = useState('');
  const [notes, setNotes] = useState('');

  // Aggiorna il contatore del timer ogni secondo
  useEffect(() => {
    if (!activeTimer) {
      setElapsedMs(0);
      return;
    }

    const updateTimer = () => {
      const { startTime, isPaused, pausedDurationMs, lastPauseTime } = activeTimer;
      const start = new Date(startTime).getTime();
      
      if (isScheduled) {
        if (Date.now() >= start) {
          setActiveTimer(prev => ({...prev, isScheduled: false}));
        } else {
          setElapsedMs(Date.now() - start);
        }
        return;
      }

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
  const handleStart = (delayMinutes = 0) => {
    const delay = typeof delayMinutes === 'number' ? delayMinutes : 0;
    const nowMs = Date.now();
    const startTimeMs = nowMs + delay * 60000;
    const todayStr = new Date().toISOString().split('T')[0];
    const initialTimer = {
      startTime: new Date(startTimeMs).toISOString(),
      isPaused: false,
      pausedDurationMs: 0,
      lastPauseTime: null,
      date: todayStr,
      isScheduled: delay > 0
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

  // Formatta millisecondi in HH:MM:SS
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

  // Guadagno accumulato stimato
  const estimatedEarnings = (Math.max(0, elapsedMs) / (1000 * 60 * 60)) * hourlyRate;

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
          <div style={{ display: 'flex', width: '100%', maxWidth: '300px', margin: '0 auto' }}>
            <button className="btn btn-success arcade-btn" onClick={() => handleStart(0)} style={{ flex: 1, padding: '16px', borderRight: 'none' }}>
              <Play size={20} fill="white" />
              Inizia Sessione
            </button>
            <div style={{ position: 'relative', width: '56px' }}>
              <button className="btn btn-success arcade-btn" style={{ width: '100%', height: '100%', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} fill="white" />
              </button>
              <select 
                style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                onChange={(e) => {
                  if(e.target.value) handleStart(Number(e.target.value));
                  e.target.value = "";
                }}
                defaultValue=""
              >
                <option value="" disabled>Ritarda avvio...</option>
                <option value="1">Tra 1 minuto</option>
                <option value="5">Tra 5 minuti</option>
                <option value="10">Tra 10 minuti</option>
                <option value="15">Tra 15 minuti</option>
                <option value="30">Tra 30 minuti</option>
                <option value="60">Tra 1 ora</option>
              </select>
            </div>
          </div>
        </div>
      ) : (
        <div className="timer-container">
          <div className={`timer-circle ${!activeTimer.isPaused ? 'active' : ''}`}>
            {/* Pixel Flower Accessory */}
            <div style={{position: 'absolute', top: '-16px', right: '-16px', zIndex: 20}}>
              <div className="pixel-flower"></div>
            </div>
            <div className={`timer-display ${!activeTimer.isPaused ? 'active' : ''}`}>
              {formatElapsed(elapsedMs)}
            </div>
            <div className="timer-label">
              {activeTimer.isScheduled ? 'Inizia tra...' : (activeTimer.isPaused ? 'In Pausa' : 'In Corso')}
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
            {activeTimer.isScheduled ? (
               <button className="btn btn-primary arcade-btn" onClick={() => setActiveTimer(prev => ({...prev, isScheduled: false, startTime: new Date().toISOString()}))} style={{ flex: 1 }}>
                  <Play size={16} fill="white" />
                  Avvia Ora
               </button>
            ) : activeTimer.isPaused ? (
              <button className="btn btn-primary arcade-btn" onClick={handleResume} style={{ flex: 1 }}>
                <Play size={16} fill="white" />
                Riprendi
              </button>
            ) : (
              <button className="btn btn-secondary arcade-btn" onClick={handlePause} style={{ flex: 1 }}>
                <Pause size={16} />
                Pausa
              </button>
            )}
            <button className="btn btn-danger arcade-btn" onClick={handleStop} style={{ flex: 1 }}>
              <Square size={16} fill="white" />
              Termina
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
