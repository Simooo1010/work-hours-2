import { PixelMoney, PixelDB, PixelLogout, PixelPhone, PixelGlobe, PixelKey, PixelShield, PixelSparkle, PixelCheck } from './PixelIcons';
import React, { useState } from 'react';

import { supabase } from '../supabaseClient';

export default function Settings({ hourlyRate, onUpdateRate, user, onLogout }) {
  const [rateInput, setRateInput] = useState(hourlyRate.toFixed(2));
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const isMock = supabase.isMock;

  const handleRateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setIsSaved(false);

    const newRate = parseFloat(rateInput);
    if (isNaN(newRate) || newRate < 0) {
      alert("Inserisci una tariffa oraria valida.");
      setLoading(false);
      return;
    }

    try {
      await onUpdateRate(newRate);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000); // Rimuovi il messaggio di successo dopo 3 secondi
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = async () => {
    if (confirm("Sei sicuro di voler uscire?")) {
      await supabase.auth.signOut();
      onLogout();
    }
  };

  return (
    <div className="view-content settings-grid">
      {/* 1. IMPOSTAZIONE TARIFFA ORARIA */}
      <div className="card">
        <div className="card-title">
          <DollarSign size={18} color="var(--color-success)" />
          <span>Tariffa Oraria</span>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
          Imposta la tua tariffa oraria predefinita. Questa tariffa verrà memorizzata e usata per calcolare i guadagni delle nuove sessioni. Le sessioni passate manterranno la tariffa con cui sono state salvate.
        </p>

        <form onSubmit={handleRateSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label htmlFor="hourly-rate-input">Tariffa (€/ora)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: '600' }}>€</span>
              <input
                id="hourly-rate-input"
                type="number"
                step="0.01"
                min="0"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                required
                style={{ paddingLeft: '30px' }}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '12px 24px' }} disabled={loading}>
            {isSaved ? <Check size={16} /> : 'Salva'}
          </button>
        </form>

        {isSaved && (
          <p style={{ color: 'var(--color-success)', fontSize: '13px', fontWeight: '500', marginTop: '10px' }}>
            Tariffa oraria aggiornata con successo!
          </p>
        )}
      </div>

      {/* 2. STATO DATABASE & DETTAGLI CONNESSIONE */}
      <div className="card">
        <div className="card-title">
          <Database size={18} color="var(--color-brand)" />
          <span>Stato Connessione</span>
        </div>

        {isMock ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-demo">Database Locale (LocalStorage)</span>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Attualmente i tuoi dati sono salvati solo sul browser di questo dispositivo. Se svuoti la cache del browser o cambi dispositivo, perderai i dati.
            </p>

            <div className="db-info-box" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontWeight: '600', color: 'var(--color-brand)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Smartphone size={15} />
                <span>Come abilitare il Cloud Sync e l'accesso su Safari iPhone:</span>
              </div>
              <ol style={{ paddingLeft: '20px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Registrati gratis su <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-brand)' }}>Supabase</a>.</li>
                <li>Crea un nuovo progetto database.</li>
                <li>Esegui il file <code style={{ backgroundColor: 'var(--bg-secondary)', padding: '2px 4px', borderRadius: '3px' }}>supabase_setup.sql</code> nel pannello SQL di Supabase.</li>
                <li>Crea un file <code style={{ backgroundColor: 'var(--bg-secondary)', padding: '2px 4px', borderRadius: '3px' }}>.env</code> nel tuo progetto inserendo le chiavi URL e ANON_KEY di Supabase.</li>
                <li>Pubblica l'app gratis su <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-brand)' }}>Vercel</a>.</li>
              </ol>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                Ti guiderò passo-passo in questa procedura al termine della scrittura del codice!
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-connected">Connesso a Supabase (Cloud)</span>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              I tuoi dati sono ospitati in modo sicuro sul cloud di Supabase. Le sessioni e le impostazioni sono crittografate e accessibili da qualsiasi browser autorizzato (compreso il tuo iPhone su Safari).
            </p>

            <div className="db-info-box" style={{ borderColor: 'var(--border-color)', backgroundColor: 'rgba(16, 185, 129, 0.02)' }}>
              <div style={{ fontWeight: '600', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Shield size={14} />
                <span>Sicurezza attiva:</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Row Level Security (RLS) è abilitato su Supabase. Solo il proprietario registrato con l'account email (ossia tu) può accedere e modificare i dati di questo database.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. PROFILO UTENTE E LOGOUT */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Connesso come:</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
              {user?.email || 'Utente Locale'}
            </div>
          </div>
          
          <button className="btn btn-danger" onClick={handleLogoutClick} style={{ width: 'auto', padding: '10px 18px' }}>
            <LogOut size={16} />
            Esci
          </button>
        </div>
      </div>
    </div>
  );
}
