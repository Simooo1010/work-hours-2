import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { LayoutDashboard, Clock, Calendar, Settings as SettingsIcon, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TimerWidget from './components/TimerWidget';
import SessionList from './components/SessionList';
import Settings from './components/Settings';

export default function App() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [sessions, setSessions] = useState([]);
  const [hourlyRate, setHourlyRate] = useState(2.50);
  const [loading, setLoading] = useState(true);

  // Stato per il timer attivo (sollevato in App.jsx per l'indicatore fluttuante)
  const [activeTimer, setActiveTimer] = useState(() => {
    const saved = localStorage.getItem('workhours_active_timer');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Stato per i secondi trascorsi nel banner mini-timer
  const [miniElapsedMs, setMiniElapsedMs] = useState(0);

  // Sincronizza activeTimer in localStorage
  useEffect(() => {
    if (activeTimer) {
      localStorage.setItem('workhours_active_timer', JSON.stringify(activeTimer));
    } else {
      localStorage.removeItem('workhours_active_timer');
    }
  }, [activeTimer]);

  // Aggiorna il contatore del mini-timer fluttuante
  useEffect(() => {
    if (!activeTimer) {
      setMiniElapsedMs(0);
      return;
    }

    const updateMiniTimer = () => {
      const { startTime, isPaused, pausedDurationMs, lastPauseTime } = activeTimer;
      const start = new Date(startTime).getTime();
      
      if (isPaused) {
        const pauseTime = new Date(lastPauseTime).getTime();
        setMiniElapsedMs(pauseTime - start - pausedDurationMs);
      } else {
        const now = Date.now();
        setMiniElapsedMs(now - start - pausedDurationMs);
      }
    };

    updateMiniTimer();
    const interval = setInterval(updateMiniTimer, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  // Gestione sessione utente su Supabase o Mock
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, activeSession) => {
      if (activeSession) {
        setSession(activeSession);
        setUser(activeSession.user);
      } else {
        setSession(null);
        setUser(null);
        setSessions([]);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Caricamento dei dati (Sessioni e Profilo/Tariffa Oraria) quando l'utente è loggato
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Carica il profilo dell'utente per recuperare la tariffa oraria
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Errore caricamento profilo:', profileError);
          // Se non esiste il profilo su Supabase (nuovo utente), lo creiamo
          if (!supabase.isMock && profileError.message?.includes('rows') || profileError.code === 'PGRST116') {
            const { data: newProfile } = await supabase
              .from('profiles')
              .insert({ id: user.id, hourly_rate: 2.50 })
              .select()
              .single();
            if (newProfile) {
              setHourlyRate(Number(newProfile.hourly_rate));
            }
          }
        } else if (profile) {
          setHourlyRate(Number(profile.hourly_rate));
        }

        // 2. Carica tutte le sessioni lavorative dell'utente
        const { data: sessionsList, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .order('start_time', { ascending: false });

        if (sessionsError) {
          console.error('Errore caricamento sessioni:', sessionsError);
        } else if (sessionsList) {
          setSessions(sessionsList);
        }
      } catch (err) {
        console.error('Errore di fetch dei dati:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // --- AZIONI DATABASE / STATE ---

  // Salva una nuova sessione (dal timer o dal modulo manuale)
  const handleSaveSession = async (sessionData) => {
    if (!user) return;

    try {
      const newSession = {
        ...sessionData,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('sessions')
        .insert(newSession);

      if (error) {
        console.error('Errore nel salvare la sessione:', error);
        alert('Errore nel salvare la sessione. Riprova.');
      } else {
        // Se Supabase non ritorna i dati inseriti (dipende da config RLS/versione), ricarichiamo le sessioni
        // Il nostro Mock client restituisce i dati inseriti in un array
        if (data && data.length > 0) {
          setSessions(prev => [data[0], ...prev]);
        } else {
          // Ricarica per sicurezza
          const { data: refetched } = await supabase
            .from('sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .order('start_time', { ascending: false });
          if (refetched) setSessions(refetched);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Aggiorna una sessione esistente
  const handleUpdateSession = async (id, updatedData) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .update(updatedData)
        .eq('id', id);

      if (error) {
        console.error('Errore nell\'aggiornare la sessione:', error);
        alert('Errore durante la modifica. Riprova.');
      } else {
        // Aggiorna lo stato locale
        setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updatedData } : s));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Elimina una sessione
  const handleDeleteSession = async (id) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Errore nell\'eliminare la sessione:', error);
        alert('Errore durante l\'eliminazione. Riprova.');
      } else {
        // Aggiorna lo stato locale
        setSessions(prev => prev.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Aggiorna la tariffa oraria di default
  const handleUpdateRate = async (newRate) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ hourly_rate: newRate })
        .eq('id', user.id);

      if (error) {
        console.error('Errore nell\'aggiornare la tariffa:', error);
        alert('Errore durante il salvataggio della tariffa. Riprova.');
        throw error;
      } else {
        setHourlyRate(newRate);
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Formatta millisecondi del mini-timer in HH:MM:SS
  const formatMiniElapsed = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  // Renderizza la vista corrente
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard sessions={sessions} />;
      case 'timer':
        return (
          <TimerWidget
            hourlyRate={hourlyRate}
            onSaveSession={handleSaveSession}
            activeTimer={activeTimer}
            setActiveTimer={setActiveTimer}
          />
        );
      case 'sessions':
        return (
          <SessionList
            sessions={sessions}
            hourlyRate={hourlyRate}
            onSaveSession={handleSaveSession}
            onUpdateSession={handleUpdateSession}
            onDeleteSession={handleDeleteSession}
          />
        );
      case 'settings':
        return (
          <Settings
            hourlyRate={hourlyRate}
            onUpdateRate={handleUpdateRate}
            user={user}
            onLogout={() => {
              setSession(null);
              setUser(null);
            }}
          />
        );
      default:
        return <Dashboard sessions={sessions} />;
    }
  };

  // Mostra caricamento iniziale
  if (loading && user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh', gap: '16px', backgroundColor: 'var(--bg-primary)' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-brand)' }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500' }}>Caricamento dati...</span>
      </div>
    );
  }

  // Se non autenticato, mostra login
  if (!session) {
    return <Login onLoginSuccess={(sess) => {
      setSession(sess);
      setUser(sess.user);
    }} />;
  }

  return (
    <div className="app-container">
      {/* Intestazione fissa dell'app */}
      <header className="header">
        <h1>Work Tracker</h1>
        {supabase.isMock ? (
          <span className="badge badge-demo">Demo Locale</span>
        ) : (
          <span className="badge badge-connected">Cloud Attivo</span>
        )}
      </header>

      {/* Banner fluttuante se c'è un timer attivo in background (non nella vista timer) */}
      {activeTimer && activeView !== 'timer' && (
        <div style={{ padding: '16px 20px 0 20px' }}>
          <div className="mini-timer-banner" onClick={() => setActiveView('timer')}>
            <div className="mini-timer-info">
              <div className="mini-timer-pulse"></div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Sessione in corso</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Note: {activeTimer.notes || 'Nessuna'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', fontSize: '18px', color: 'var(--color-brand)' }}>
                {formatMiniElapsed(miniElapsedMs)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Contenuto della vista corrente */}
      {renderView()}

      {/* Nav Bar Fissa in Basso per Mobile */}
      <nav className="nav-bar">
        <button
          className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveView('dashboard')}
        >
          <LayoutDashboard />
          <span>Dashboard</span>
        </button>

        <button
          className={`nav-item ${activeView === 'timer' ? 'active' : ''}`}
          onClick={() => setActiveView('timer')}
        >
          <div style={{ position: 'relative' }}>
            <Clock />
            {activeTimer && !activeTimer.isPaused && (
              <div style={{ position: 'absolute', right: '-2px', top: '-2px', width: '8px', height: '8px', backgroundColor: 'var(--color-brand)', borderRadius: '50%' }}></div>
            )}
          </div>
          <span>Timer</span>
        </button>

        <button
          className={`nav-item ${activeView === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveView('sessions')}
        >
          <Calendar />
          <span>Sessioni</span>
        </button>

        <button
          className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveView('settings')}
        >
          <SettingsIcon />
          <span>Impostazioni</span>
        </button>
      </nav>
    </div>
  );
}
