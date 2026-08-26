import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { LayoutDashboard, BarChart2, Calendar, Settings as SettingsIcon, AlertCircle, Sparkles, Loader2, TrendingUp } from 'lucide-react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Analysis from './components/Analysis';
import SessionList from './components/SessionList';
import Settings from './components/Settings';
import AnalyticsAndFinance from './components/AnalyticsAndFinance';
import MiniTimerBanner from './components/MiniTimerBanner';
import TimerHourlyNotifier from './components/TimerHourlyNotifier';
import { useUIFeedback } from './hooks/useUIFeedback';


export default function App() {
  const { showToast } = useUIFeedback();
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [sessions, setSessions] = useState([]);
  const [hourlyRate, setHourlyRate] = useState(2.50);
  const [loading, setLoading] = useState(true);
  // Contatore usato per scartare risposte di sincronizzazione arrivate fuori
  // ordine (es. cambio rapido tra sezioni): solo la risposta alla richiesta
  // più recente può aggiornare lo stato.
  const syncRequestIdRef = useRef(0);

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

  // Sincronizza activeTimer in localStorage
  useEffect(() => {
    if (activeTimer) {
      localStorage.setItem('workhours_active_timer', JSON.stringify(activeTimer));
    } else {
      localStorage.removeItem('workhours_active_timer');
    }
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
  const handleSaveSession = useCallback(async (sessionData) => {
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
        showToast('Errore nel salvare la sessione. Riprova.', 'error');
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
        showToast('Sessione salvata con successo.', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Errore nel salvare la sessione. Riprova.', 'error');
    }
  }, [user, showToast]);

  // Aggiorna una sessione esistente
  const handleUpdateSession = useCallback(async (id, updatedData) => {
    if (!user) return;

    try {
      // .select() è indispensabile: senza di esso Supabase risponde con
      // data = null e error = null anche quando 0 righe sono state modificate
      // (id inesistente, sessione di un altro utente, RLS che blocca silenziosamente).
      // Senza questo controllo l'app mostrava "successo" e aggiornava lo stato
      // locale anche quando la modifica non era MAI stata scritta sul database:
      // al cambio di sezione successivo la sincronizzazione automatica
      // (vedi useEffect qui sotto) ricaricava i dati reali e la modifica
      // spariva silenziosamente, dando l'impressione che "a volte funzioni e a volte no".
      const { data, error } = await supabase
        .from('sessions')
        .update(updatedData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('Errore nell\'aggiornare la sessione:', error);
        showToast('Errore durante la modifica. Riprova.', 'error');
      } else if (!data || data.length === 0) {
        // La query non ha modificato nessuna riga: la sessione non esiste
        // (più) o non appartiene all'utente. Risincronizziamo lo stato con
        // il database reale invece di lasciare l'interfaccia in uno stato
        // ottimistico ma falso.
        console.error('Aggiornamento sessione fallito: nessuna riga modificata per id', id);
        showToast('Modifica non salvata: la sessione non è stata trovata. Sincronizzazione in corso...', 'error');
        const { data: refetched } = await supabase
          .from('sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .order('start_time', { ascending: false });
        if (refetched) setSessions(refetched);
      } else {
        // Usiamo la riga effettivamente restituita dal database come fonte
        // di verità, non semplicemente i dati inviati.
        setSessions(prev => prev.map(s => s.id === id ? { ...s, ...data[0] } : s));
        showToast('Sessione modificata con successo.', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Errore durante la modifica. Riprova.', 'error');
    }
  }, [user, showToast]);

  // Elimina una sessione (aggiornamento ottimistico con rollback in caso di errore)
  const handleDeleteSession = useCallback(async (id) => {
    if (!user) return;

    let removedSession = null;
    let removedIndex = -1;
    setSessions(prev => {
      removedIndex = prev.findIndex(s => s.id === id);
      removedSession = removedIndex >= 0 ? prev[removedIndex] : null;
      return prev.filter(s => s.id !== id);
    });

    try {
      const { data, error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .select();

      if (error || !data || data.length === 0) {
        if (error) {
          console.error('Errore nell\'eliminare la sessione:', error);
        } else {
          console.error('Eliminazione sessione fallita: nessuna riga eliminata per id', id);
        }
        showToast('Errore durante l\'eliminazione. Riprova.', 'error');
        // Rollback: ripristina la sessione rimossa localmente
        if (removedSession) {
          setSessions(prev => {
            const next = [...prev];
            next.splice(Math.min(removedIndex, next.length), 0, removedSession);
            return next;
          });
        }
      } else {
        showToast('Sessione eliminata.', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Errore durante l\'eliminazione. Riprova.', 'error');
      if (removedSession) {
        setSessions(prev => {
          const next = [...prev];
          next.splice(Math.min(removedIndex, next.length), 0, removedSession);
          return next;
        });
      }
    }
  }, [user, showToast]);

  // Aggiorna la tariffa oraria di default
  const handleUpdateRate = useCallback(async (newRate) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ hourly_rate: newRate })
        .eq('id', user.id);

      if (error) {
        console.error('Errore nell\'aggiornare la tariffa:', error);
        showToast('Errore durante il salvataggio della tariffa. Riprova.', 'error');
        throw error;
      } else {
        setHourlyRate(newRate);
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, [user, showToast]);

  // Sincronizzazione automatica tra le sezioni
  useEffect(() => {
    if (user && !loading) {
      const requestId = ++syncRequestIdRef.current;
      supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('start_time', { ascending: false })
        .then(({ data, error }) => {
          // Scarta la risposta se nel frattempo è partita una richiesta più recente
          // (es. l'utente ha cambiato sezione più volte rapidamente): altrimenti una
          // risposta lenta e "vecchia" potrebbe sovrascrivere dati più aggiornati.
          if (requestId !== syncRequestIdRef.current) return;
          if (!error && data) {
            setSessions(data);
          }
        });
    }
  }, [activeView, user]); // Refetch leggero in background quando si cambia schermata

  // Sincronizzazione manuale globale
  const handleRefreshSessions = useCallback(async () => {
    if (!user) return;
    const requestId = ++syncRequestIdRef.current;
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('start_time', { ascending: false });

      if (requestId !== syncRequestIdRef.current) return;
      if (!error && data) {
        setSessions(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  // Gestisce il logout, resettando la sessione locale
  const handleLogout = useCallback(() => {
    setSession(null);
    setUser(null);
  }, []);

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
      case 'analytics':
        return <AnalyticsAndFinance sessions={sessions} hourlyRate={hourlyRate} onRefreshSessions={handleRefreshSessions} />;
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
            onLogout={handleLogout}
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
      {/* Componente invisibile: notifica ogni ora piena di sessione attiva, indipendentemente dalla vista corrente */}
      <TimerHourlyNotifier activeTimer={activeTimer} />

      {/* Sidebar for Desktop */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon"><LayoutDashboard size={20} /></div>
          <h2>Work Tracker</h2>
        </div>
        <nav className="sidebar-nav">
          <button className={`sidebar-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>
          <button className={`sidebar-item ${activeView === 'analytics' ? 'active' : ''}`} onClick={() => setActiveView('analytics')}>
            <TrendingUp size={20} />
            <span>Analytics & Finance</span>
          </button>
          <button className={`sidebar-item ${activeView === 'analysis' ? 'active' : ''}`} onClick={() => setActiveView('analysis')}>
            <BarChart2 size={20} />
            <span>Analisi</span>
          </button>
          <button className={`sidebar-item ${activeView === 'sessions' ? 'active' : ''}`} onClick={() => setActiveView('sessions')}>
            <Calendar size={20} />
            <span>Sessioni</span>
          </button>
          <button className={`sidebar-item ${activeView === 'settings' ? 'active' : ''}`} onClick={() => setActiveView('settings')}>
            <SettingsIcon size={20} />
            <span>Impostazioni</span>
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
          <MiniTimerBanner activeTimer={activeTimer} onClick={() => setActiveView('dashboard')} />
        )}

        {/* Contenuto della vista corrente */}
        {renderView()}
      </div>

      {/* Nav Bar Fissa in Basso per Mobile */}
      <nav className="nav-bar mobile-nav">
        <button className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>
          <LayoutDashboard />
          <span>Home</span>
        </button>
        <button className={`nav-item ${activeView === 'analytics' ? 'active' : ''}`} onClick={() => setActiveView('analytics')}>
          <TrendingUp />
          <span>Finance</span>
        </button>
        <button className={`nav-item ${activeView === 'analysis' ? 'active' : ''}`} onClick={() => setActiveView('analysis')}>
          <BarChart2 />
          <span>Analisi</span>
        </button>
        <button className={`nav-item ${activeView === 'sessions' ? 'active' : ''}`} onClick={() => setActiveView('sessions')}>
          <Calendar />
          <span>Sessioni</span>
        </button>
        <button className={`nav-item ${activeView === 'settings' ? 'active' : ''}`} onClick={() => setActiveView('settings')}>
          <SettingsIcon />
          <span>Menu</span>
        </button>
      </nav>
    </div>
  );
}

