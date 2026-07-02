import { PixelTracker, PixelAnalysis, PixelHistory, PixelConfig, PixelAlert, PixelSparkle } from './components/PixelIcons';
import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Analysis from './components/Analysis';
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

  const [decorations, setDecorations] = useState([]);

  useEffect(() => {
    const decors = [];
    const types = ['pixel-cloud', 'pixel-cloud', 'pixel-bird', 'pixel-cat'];
    const numDecors = 6 + Math.floor(Math.random() * 6);
    for (let i = 0; i < numDecors; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      let animClass = '';
      if (type === 'pixel-cloud' || type === 'pixel-bird' || type === 'pixel-cat') {
         animClass = Math.random() > 0.5 ? 'anim-drift-right' : 'anim-drift-left';
      }
      decors.push({
        id: i,
        type: type,
        animClass: animClass,
        top: `${Math.floor(Math.random() * 80)}%`,
        left: animClass ? '-10%' : `${Math.floor(Math.random() * 90)}%`,
        scale: 0.5 + Math.random() * 0.8,
        opacity: 0.5 + Math.random() * 0.4,
        animDelay: `-${Math.floor(Math.random() * 45)}s`
      });
    }
    setDecorations(decors);
  }, []);

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
          if (profileError.message?.includes('rows') || profileError.code === 'PGRST116' || profileError.code === '42P01') {
            const { data: newProfile } = await supabase
              .from('profiles')
              .insert({ id: user.id, hourly_rate: 2.50 })
              .select()
              .single();
            if (newProfile) {
              setHourlyRate(Number(newProfile.hourly_rate));
            } else {
              setHourlyRate(2.50);
            }
          } else {
            setHourlyRate(2.50);
          }
        } else if (profile) {
          setHourlyRate(Number(profile.hourly_rate) || 2.50);
        } else {
          setHourlyRate(2.50);
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
        return (
          <Dashboard 
            sessions={sessions} 
            hourlyRate={hourlyRate}
            activeTimer={activeTimer}
            setActiveTimer={setActiveTimer}
            onSaveSession={handleSaveSession}
          />
        );
      case 'analysis':
        return <Analysis sessions={sessions} hourlyRate={hourlyRate} />;
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
        return (
          <Dashboard 
            sessions={sessions} 
            hourlyRate={hourlyRate}
            activeTimer={activeTimer}
            setActiveTimer={setActiveTimer}
            onSaveSession={handleSaveSession}
          />
        );
    }
  };

  // Mostra caricamento iniziale
  if (loading && user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh', gap: '16px', backgroundColor: 'var(--bg-primary)' }}>
        <PixelAlert size={32} style={{ color: 'var(--color-brand)' }} />
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
      {/* Background Decor */}
      {decorations.map((decor) => (
        <div 
          key={decor.id}
          className={`pixel-decor ${decor.type} ${decor.animClass}`} 
          style={{
            top: decor.top, 
            left: decor.left, 
            transform: `scale(${decor.scale})`, 
            opacity: decor.opacity,
            animationDelay: decor.animDelay
          }}
        ></div>
      ))}

      {/* Sidebar for Desktop */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon"><PixelTracker size={20} /></div>
          <h2>Work Tracker</h2>
        </div>
        <nav className="sidebar-nav">
          <button className={`sidebar-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>
            <PixelTracker size={20} />
            <span>TRACKER</span>
          </button>
          <button className={`sidebar-item ${activeView === 'analysis' ? 'active' : ''}`} onClick={() => setActiveView('analysis')}>
            <PixelAnalysis size={20} />
            <span>ANALYSIS</span>
          </button>
          <button className={`sidebar-item ${activeView === 'sessions' ? 'active' : ''}`} onClick={() => setActiveView('sessions')}>
            <PixelHistory size={20} />
            <span>HISTORY</span>
          </button>
          <button className={`sidebar-item ${activeView === 'settings' ? 'active' : ''}`} onClick={() => setActiveView('settings')}>
            <PixelConfig size={20} />
            <span>CONFIG</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          {supabase.isMock ? (
            <span className="badge badge-demo" style={{ width: '100%', justifyContent: 'center' }}>Demo Locale</span>
          ) : (
            <span className="badge badge-connected" style={{ width: '100%', justifyContent: 'center' }}>Cloud Attivo</span>
          )}
        </div>
      </aside>

      <div className="main-content">
        {/* Intestazione fissa dell'app (Mobile) */}
        <header className="header mobile-header">
          <h1>Work Tracker</h1>
          {supabase.isMock ? (
            <span className="badge badge-demo">Demo Locale</span>
          ) : (
            <span className="badge badge-connected">Cloud Attivo</span>
          )}
        </header>

        {/* Banner fluttuante se c'è un timer attivo in background (non nella vista dashboard) */}
        {activeTimer && activeView !== 'dashboard' && (
          <div style={{ padding: '16px 20px 0 20px' }}>
            <div className="mini-timer-banner" onClick={() => setActiveView('dashboard')}>
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
      </div>

      {/* Nav Bar Fissa in Basso per Mobile */}
      <nav className="nav-bar mobile-nav">
        <button className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>
          <PixelTracker size={24} color={activeView === 'dashboard' ? 'var(--bg-primary)' : 'var(--text-primary)'} />
          <span>TRACKER</span>
        </button>
        <button className={`nav-item ${activeView === 'analysis' ? 'active' : ''}`} onClick={() => setActiveView('analysis')}>
          <PixelAnalysis size={24} color={activeView === 'analysis' ? 'var(--bg-primary)' : 'var(--text-primary)'} />
          <span>ANALYSIS</span>
        </button>
        <button className={`nav-item ${activeView === 'sessions' ? 'active' : ''}`} onClick={() => setActiveView('sessions')}>
          <PixelHistory size={24} color={activeView === 'sessions' ? 'var(--bg-primary)' : 'var(--text-primary)'} />
          <span>HISTORY</span>
        </button>
        <button className={`nav-item ${activeView === 'settings' ? 'active' : ''}`} onClick={() => setActiveView('settings')}>
          <PixelConfig size={24} color={activeView === 'settings' ? 'var(--bg-primary)' : 'var(--text-primary)'} />
          <span>CONFIG</span>
        </button>
      </nav>
    </div>
  );
}
