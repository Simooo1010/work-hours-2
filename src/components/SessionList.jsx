import React, { useState, memo } from 'react';
import { Plus, Trash2, Edit2, Calendar, Clock, FileText, X, AlertTriangle, Loader2 } from 'lucide-react';
import { roundHours, getRoundedEarnings } from '../utils/rounding';
import { useUIFeedback } from '../hooks/useUIFeedback';

function SessionList({ sessions, hourlyRate, onSaveSession, onUpdateSession, onDeleteSession }) {
  const { confirmDialog } = useUIFeedback();

  // Stati per il form di inserimento manuale
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stati per la modifica (Modal)
  const [editingSession, setEditingSession] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Funzione helper per calcolare la durata in ore
  const getDurationHours = (start, end) => {
    if (!start || !end) return 0;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    let startMin = startH * 60 + startM;
    let endMin = endH * 60 + endM;
    
    if (endMin < startMin) {
      // Sessione a cavallo della mezzanotte
      endMin += 24 * 60;
    }
    
    return (endMin - startMin) / 60;
  };

  // Formatta decimali ore in ore e minuti (es. 1.25 -> "1h 15m")
  const formatHoursAndMinutes = (hoursDecimal) => {
    const totalMinutes = Math.round(hoursDecimal * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  // Formatta la data per visualizzarla in italiano
  const formatDateIt = (dateStr) => {
    const d = new Date(dateStr);
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    const formatted = d.toLocaleDateString('it-IT', options);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).replace('.', '');
  };

  // Calcolo live della durata e dei guadagni per l'inserimento
  const liveDuration = getDurationHours(startTime, endTime);
  const liveEarnings = liveDuration * hourlyRate;

  // Gestione invio form di inserimento manuale
  const handleAddSessionSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!startTime || !endTime) {
      setFormError('Inserisci sia l\'orario di inizio che di fine.');
      return;
    }

    const durationHours = getDurationHours(startTime, endTime);
    if (durationHours <= 0) {
      setFormError('L\'orario di fine deve essere diverso dall\'orario di inizio.');
      return;
    }

    // Aggiungiamo i secondi (00) per uniformare il formato con il database/timer
    const sessionData = {
      date,
      start_time: `${startTime}:00`,
      end_time: `${endTime}:00`,
      duration_hours: durationHours,
      hourly_rate: hourlyRate,
      earnings: durationHours * hourlyRate,
      notes: notes.trim() || null
    };

    setIsSubmitting(true);
    try {
      await onSaveSession(sessionData);
      // Resetta campi
      setStartTime('');
      setEndTime('');
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Apertura modale di modifica
  const handleOpenEditModal = (session) => {
    setEditingSession(session);
    setEditDate(session.date);
    // Rimuoviamo i secondi per gli input time
    setEditStartTime(session.start_time.substring(0, 5));
    setEditEndTime(session.end_time.substring(0, 5));
    setEditNotes(session.notes || '');
    setEditError('');
  };

  // Gestione salvataggio modifica
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');

    if (!editStartTime || !editEndTime) {
      setEditError('Inserisci sia l\'orario di inizio che di fine.');
      return;
    }

    const durationHours = getDurationHours(editStartTime, editEndTime);
    if (durationHours <= 0) {
      setEditError('L\'orario di fine deve essere diverso dall\'orario di inizio.');
      return;
    }

    const updatedData = {
      date: editDate,
      start_time: `${editStartTime}:00`,
      end_time: `${editEndTime}:00`,
      duration_hours: durationHours,
      // Manteniamo la tariffa oraria originaria della sessione
      hourly_rate: editingSession.hourly_rate,
      earnings: durationHours * editingSession.hourly_rate,
      notes: editNotes.trim() || null
    };

    setIsEditSubmitting(true);
    try {
      await onUpdateSession(editingSession.id, updatedData);
      setEditingSession(null);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Gestione eliminazione sessione
  const handleDeleteClick = async (id) => {
    const confirmed = await confirmDialog('Sei sicuro di voler eliminare questa sessione di lavoro permanentemente?', {
      title: 'Elimina sessione',
      confirmLabel: 'Elimina',
      danger: true,
    });
    if (confirmed) {
      onDeleteSession(id);
    }
  };

  return (
    <div className="view-content session-grid">
      {/* 1. AGGIUNGI SESSIONE MANUALE */}
      <div className="card">
        <div className="card-title">
          <Plus size={18} color="var(--color-brand)" />
          <span>Aggiungi Sessione Manualmente</span>
        </div>

        {formError && (
          <div className="login-error" style={{ marginBottom: '14px' }}>
            <AlertTriangle size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
            {formError}
          </div>
        )}

        <form onSubmit={handleAddSessionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label htmlFor="date">Data</label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startTime">Inizio</label>
              <input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="endTime">Fine</label>
              <input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Note (opzionale)</label>
            <input
              id="notes"
              type="text"
              placeholder="Descrizione del lavoro"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {liveDuration > 0 && (
            <div className="db-info-box" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Durata reale: <strong>{formatHoursAndMinutes(liveDuration)}</strong></span>
                <span>Guadagno reale: <strong>€{liveEarnings.toFixed(2)}</strong></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(115, 120, 116, 0.15)', paddingTop: '8px', color: 'var(--color-brand)', fontWeight: '600' }}>
                <span>Durata arrotondata: <strong>{roundHours(liveDuration).toFixed(1)}h</strong></span>
                <span>Guadagno arrotondato: <strong>€{getRoundedEarnings(liveDuration, hourlyRate).toFixed(2)}</strong></span>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ marginTop: '4px' }} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {isSubmitting ? 'Salvataggio...' : 'Salva Sessione'}
          </button>
        </form>
      </div>

      {/* 2. ELENCO DELLE SESSIONI REGISTRATE */}
      <div className="card">
        <div className="card-title">
          <Calendar size={18} color="var(--color-brand)" />
          <span>Sessioni Registrate</span>
        </div>

        {sessions.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0' }}>
            Nessuna sessione registrata. Inserisci una sessione a mano o avvia il timer.
          </p>
        ) : (
          <div className="sessions-list-container">
            {sessions.map((session) => (
              <div key={session.id} className="session-item">
                <div className="session-info">
                  <div className="session-date">{formatDateIt(session.date)}</div>
                  <div className="session-time" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    <span>
                      {session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      (@ €{Number(session.hourly_rate).toFixed(2)}/h)
                    </span>
                  </div>
                  {session.notes && (
                    <div className="session-notes" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FileText size={11} />
                      <span>{session.notes}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="session-financial">
                    <span className="session-earnings">€{Number(session.earnings).toFixed(2)}</span>
                    <span className="session-hours">{formatHoursAndMinutes(session.duration_hours)}</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      className="btn-icon" 
                      onClick={() => handleOpenEditModal(session)} 
                      style={{ width: '32px', height: '32px' }}
                      title="Modifica"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button 
                      className="btn-icon" 
                      onClick={() => handleDeleteClick(session.id)} 
                      style={{ width: '32px', height: '32px', color: 'var(--color-danger)' }}
                      title="Elimina"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. MODALE DI MODIFICA SESSIONE */}
      {editingSession && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Modifica Sessione</h2>
              <button 
                onClick={() => setEditingSession(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {editError && (
              <div className="login-error">
                <AlertTriangle size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label htmlFor="editDate">Data</label>
                <input
                  id="editDate"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="editStartTime">Ora Inizio</label>
                  <input
                    id="editStartTime"
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editEndTime">Ora Fine</label>
                  <input
                    id="editEndTime"
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="editNotes">Note (opzionale)</label>
                <input
                  id="editNotes"
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>

              <div className="db-info-box" style={{ fontSize: '12px' }}>
                <span>Tariffa della sessione: <strong>€{Number(editingSession.hourly_rate).toFixed(2)} / ora</strong>. Questa tariffa non cambia per preservare lo storico dei tuoi guadagni.</span>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingSession(null)} style={{ flex: 1 }} disabled={isEditSubmitting}>
                  Annulla
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isEditSubmitting}>
                  {isEditSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Salva Modifiche'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(SessionList);
