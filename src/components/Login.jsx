import { PixelLogin, PixelLock, PixelMail, PixelDB, PixelShield, PixelSparkle } from './PixelIcons';
import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';


export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isMock = supabase.isMock;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
      } else if (data?.session) {
        onLoginSuccess(data.session);
      }
    } catch (err) {
      setError('Si è verificato un errore imprevisto durante l\'accesso.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">
            <Sparkles size={28} />
          </div>
          <h1>Work Tracker</h1>
          <p>Traccia le tue ore e i tuoi guadagni</p>
        </div>

        {isMock && (
          <div className="db-info-box" style={{ borderColor: 'var(--color-accent)', backgroundColor: 'rgba(140, 78, 55, 0.05)' }}>
            <div className="db-info-header" style={{ color: 'var(--color-accent)' }}>
              <Database size={16} />
              <span>Modalità Dispositivo (Locale)</span>
            </div>
            <p style={{ color: 'var(--color-accent)', fontSize: '12px' }}>
              Nessun database remoto configurato. La prima password che inserirai diventerà la password per questo browser. I dati verranno salvati solo in locale.
            </p>
          </div>
        )}

        {!isMock && (
          <div className="db-info-box" style={{ borderColor: 'var(--color-success)', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
            <div className="db-info-header" style={{ color: 'var(--color-success)' }}>
              <Database size={16} />
              <span>Database Cloud Attivo</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
              Collegamento sicuro con Supabase attivo. I dati sono salvati in tempo reale e sincronizzati con tutti i tuoi dispositivi.
            </p>
          </div>
        )}

        {error && (
          <div className="login-error">
            <ShieldAlert size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="email"
                type="email"
                placeholder="es: utente@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="password"
                type="password"
                placeholder="Inserisci la password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
            <LogIn size={18} />
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  );
}
