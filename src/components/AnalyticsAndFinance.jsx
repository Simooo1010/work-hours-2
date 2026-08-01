import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock3, 
  Sparkles,
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  PlusCircle,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PieChart
} from 'lucide-react';
import { 
  roundHours, 
  calculateRealVsRoundedStats, 
  formatHoursAndMinutes 
} from '../utils/rounding';
import { 
  fetchFinanceTrackerIncomes, 
  matchWorkHoursWithFinance, 
  saveMockFinanceIncomes 
} from '../utils/financeIntegration';

const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const WEEKDAYS_IT = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

export default function AnalyticsAndFinance({ sessions, hourlyRate }) {
  // Stato Intervallo Temporale
  const [timeRange, setTimeRange] = useState('mese'); // 'settimana', 'mese', 'anno', 'totale', 'custom'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Stato per l'integrazione Finance Tracker
  const [incomes, setIncomes] = useState([]);
  const [loadingIncomes, setLoadingIncomes] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('Lavoro');
  const [showAddMockModal, setShowAddMockModal] = useState(false);
  const [newMockTitle, setNewMockTitle] = useState('Lavoro 01/07 - 15/07/26');
  const [newMockAmount, setNewMockAmount] = useState('');

  // Detection dimensione schermo per layout mobile reattivo
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Caricamento entrate dal Finance Tracker
  const loadFinanceData = async () => {
    setLoadingIncomes(true);
    try {
      const data = await fetchFinanceTrackerIncomes();
      setIncomes(data);
    } catch (err) {
      console.error('Errore nel caricamento entrate finance:', err);
    } finally {
      setLoadingIncomes(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, []);

  // --- FILTRAGGIO DELLE SESSIONI IN BASE ALL'INTERVALLO TEMPORALE ---
  const filteredSessions = useMemo(() => {
    if (!Array.isArray(sessions)) return [];

    return sessions.filter(s => {
      if (!s.date) return false;
      const sessionDate = new Date(s.date);

      if (timeRange === 'totale') return true;

      if (timeRange === 'mese') {
        return sessionDate.getFullYear() === currentDate.getFullYear() &&
               sessionDate.getMonth() === currentDate.getMonth();
      }

      if (timeRange === 'anno') {
        return sessionDate.getFullYear() === currentDate.getFullYear();
      }

      if (timeRange === 'settimana') {
        const d = new Date(currentDate);
        const day = d.getDay();
        const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diffToMon));
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        return sessionDate >= monday && sessionDate <= sunday;
      }

      if (timeRange === 'custom') {
        if (!customStartDate && !customEndDate) return true;
        const start = customStartDate ? new Date(customStartDate) : new Date('2000-01-01');
        const end = customEndDate ? new Date(customEndDate) : new Date('2099-12-31');
        end.setHours(23, 59, 59, 999);
        return sessionDate >= start && sessionDate <= end;
      }

      return true;
    });
  }, [sessions, timeRange, currentDate, customStartDate, customEndDate]);

  // --- STATISTICHE REALI VS ARROTONDATE ---
  const stats = useMemo(() => {
    return calculateRealVsRoundedStats(filteredSessions);
  }, [filteredSessions]);

  // --- CONFRONTO FINANZIARIO CON FINANCE TRACKER ---
  const financeMatches = useMemo(() => {
    return matchWorkHoursWithFinance(filteredSessions, incomes, searchKeyword);
  }, [filteredSessions, incomes, searchKeyword]);

  const financeSummary = useMemo(() => {
    let totalExpected = 0;
    let totalReceived = 0;
    let totalPending = 0;

    financeMatches.forEach(m => {
      totalExpected += m.expectedEarnings;
      totalReceived += m.incomeAmount;
      if (m.difference < 0) {
        totalPending += Math.abs(m.difference);
      }
    });

    return { totalExpected, totalReceived, totalPending };
  }, [financeMatches]);

  // Navigazione date
  const handlePrevPeriod = () => {
    const d = new Date(currentDate);
    if (timeRange === 'mese') {
      d.setMonth(d.getMonth() - 1);
    } else if (timeRange === 'anno') {
      d.setFullYear(d.getFullYear() - 1);
    } else if (timeRange === 'settimana') {
      d.setDate(d.getDate() - 7);
    }
    setCurrentDate(d);
  };

  const handleNextPeriod = () => {
    const d = new Date(currentDate);
    if (timeRange === 'mese') {
      d.setMonth(d.getMonth() + 1);
    } else if (timeRange === 'anno') {
      d.setFullYear(d.getFullYear() + 1);
    } else if (timeRange === 'settimana') {
      d.setDate(d.getDate() + 7);
    }
    setCurrentDate(d);
  };

  // Etichetta periodo
  const periodLabel = useMemo(() => {
    if (timeRange === 'totale') return 'Tutto lo storico';
    if (timeRange === 'anno') return `Anno ${currentDate.getFullYear()}`;
    if (timeRange === 'mese') return `${MONTHS_IT[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (timeRange === 'settimana') {
      const d = new Date(currentDate);
      const day = d.getDay();
      const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(d.setDate(diffToMon));
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return `${mon.getDate()} ${MONTHS_IT[mon.getMonth()].substring(0, 3)} - ${sun.getDate()} ${MONTHS_IT[sun.getMonth()].substring(0, 3)} ${sun.getFullYear()}`;
    }
    if (timeRange === 'custom') return 'Intervallo Personalizzato';
    return '';
  }, [timeRange, currentDate]);

  // Aggiungi una simulazione entrata per test locale
  const handleAddMockIncome = (e) => {
    e.preventDefault();
    if (!newMockTitle || !newMockAmount) return;

    const newInc = {
      id: `mock-${Date.now()}`,
      title: newMockTitle,
      amount: Number(newMockAmount),
      type: 'income',
      created_at: new Date().toISOString()
    };

    const updated = [newInc, ...incomes];
    setIncomes(updated);
    saveMockFinanceIncomes(updated);
    setNewMockTitle('Lavoro 01/08 - 15/08/26');
    setNewMockAmount('');
    setShowAddMockModal(false);
  };

  // Distribuzione giorni della settimana
  const dayDistribution = useMemo(() => {
    const days = [0, 0, 0, 0, 0, 0, 0];
    filteredSessions.forEach(s => {
      const day = new Date(s.date).getDay();
      const idx = day === 0 ? 6 : day - 1;
      days[idx] += roundHours(Number(s.duration_hours) || 0);
    });
    const max = Math.max(...days, 1);
    return days.map((hrs, idx) => ({
      dayName: WEEKDAYS_IT[idx],
      shortName: WEEKDAYS_IT[idx].substring(0, 3),
      hours: hrs,
      percentage: (hrs / max) * 100
    }));
  }, [filteredSessions]);

  return (
    <div className="view-content" style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '20px' : '28px', paddingBottom: '100px' }}>
      
      {/* 1. INTESTAZIONE CON TITOLO E CONTROLLI TEMPORALI */}
      <div className="card" style={{ padding: isMobile ? '16px' : '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: isMobile ? '20px' : '22px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <TrendingUp style={{ color: 'var(--color-brand)' }} size={isMobile ? 22 : 26} />
              Analytics & Finance
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
              Indicatori di arrotondamento orario e tracciamento pagamenti dal Finance Tracker.
            </p>
          </div>

          {/* Navigatore periodo (< Agosto 2026 >) */}
          {timeRange !== 'totale' && timeRange !== 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: '12px', width: isMobile ? '100%' : 'auto', justifyContent: 'space-between' }}>
              <button onClick={handlePrevPeriod} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', padding: '4px' }}>
                <ChevronLeft size={20} />
              </button>
              <span style={{ fontWeight: '700', fontSize: '13px', textAlign: 'center', color: 'var(--text-primary)', flex: 1 }}>
                {periodLabel}
              </span>
              <button onClick={handleNextPeriod} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', padding: '4px' }}>
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Pulsanti Filtro Temporale (Pills con scroll orizzontale su mobile) */}
        <div className="wheel-picker-scroll" style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', width: '100%', WebkitOverflowScrolling: 'touch' }}>
          {['settimana', 'mese', 'anno', 'totale', 'custom'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              style={{
                padding: '8px 14px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.2s ease',
                backgroundColor: timeRange === t ? 'var(--color-brand)' : 'var(--bg-tertiary)',
                color: timeRange === t ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              {t === 'settimana' && 'Settimana'}
              {t === 'mese' && 'Mese'}
              {t === 'anno' && 'Anno'}
              {t === 'totale' && 'Totale Storico'}
              {t === 'custom' && 'Personalizzato'}
            </button>
          ))}
        </div>

        {/* Datepicker Personalizzato */}
        {timeRange === 'custom' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px', paddingTop: '4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600' }}>Da Data:</label>
              <input 
                type="date" 
                value={customStartDate} 
                onChange={e => setCustomStartDate(e.target.value)}
                className="input-field" 
                style={{ padding: '10px 12px', fontSize: '14px' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600' }}>A Data:</label>
              <input 
                type="date" 
                value={customEndDate} 
                onChange={e => setCustomEndDate(e.target.value)}
                className="input-field" 
                style={{ padding: '10px 12px', fontSize: '14px' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. INDICATORI ARROTONDAMENTO ORE & GUADAGNI REALI */}
      <div>
        <div className="card-title" style={{ marginBottom: '14px' }}>
          <Clock3 size={18} style={{ color: 'var(--color-brand)' }} />
          <span>Indicatore Arrotondamento: Ore & Guadagni Reali</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          
          {/* Card 1: Ore Reali vs Arrotondate */}
          <div className="card" style={{ padding: isMobile ? '18px' : '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Confronto Ore
                </span>
                <span style={deltaBadgeStyle(stats.deltaHours)}>
                  {stats.deltaHours > 0 ? '+' : ''}{formatHoursAndMinutes(Math.abs(stats.deltaHours))} ({stats.percentageHours >= 0 ? '+' : ''}{stats.percentageHours.toFixed(1)}%)
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 }}>
                    {stats.roundedHours.toFixed(1)}h
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Ore Arrotondate (Conteggiate)</div>
                </div>
                <div style={{ fontSize: '20px', color: 'var(--border-color)', fontWeight: '300' }}>/</div>
                <div>
                  <div style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                    {formatHoursAndMinutes(stats.realHours)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Ore Reali ({stats.realHours.toFixed(2)}h)</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '14px', fontSize: '12px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)', padding: '10px 12px', borderRadius: '12px' }}>
              {stats.deltaMinutes === 0 ? (
                <span>Le ore reali e arrotondate coincidono.</span>
              ) : stats.deltaMinutes > 0 ? (
                <span style={{ color: '#10b981', fontWeight: '600' }}>
                  🟢 +{stats.deltaMinutes}m in più per l'arrotondamento per eccesso.
                </span>
              ) : (
                <span style={{ color: '#ef4444', fontWeight: '600' }}>
                  🔴 {stats.deltaMinutes}m in meno per l'arrotondamento per difetto.
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Guadagni Reali vs Arrotondati */}
          <div className="card" style={{ padding: isMobile ? '18px' : '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Confronto Guadagni
                </span>
                <span style={deltaBadgeStyle(stats.deltaEarnings)}>
                  {stats.deltaEarnings >= 0 ? '+' : ''}€{stats.deltaEarnings.toFixed(2)}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: '800', color: 'var(--color-brand)', lineHeight: 1 }}>
                    €{stats.roundedEarnings.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Guadagno Arrotondato</div>
                </div>
                <div style={{ fontSize: '20px', color: 'var(--border-color)', fontWeight: '300' }}>/</div>
                <div>
                  <div style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                    €{stats.realEarnings.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Guadagno Reale</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '14px', fontSize: '12px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)', padding: '10px 12px', borderRadius: '12px' }}>
              Impatto economico netto: <strong style={{ color: stats.deltaEarnings >= 0 ? '#10b981' : '#ef4444' }}>{stats.deltaEarnings >= 0 ? '+' : ''}€{stats.deltaEarnings.toFixed(2)}</strong> rispetto alle ore reali effettive.
            </div>
          </div>

          {/* Card 3: Efficienza Arrotondamento */}
          <div className="card" style={{ padding: isMobile ? '18px' : '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Efficienza & Rapporto
                </span>
                <Sparkles size={18} style={{ color: '#f59e0b' }} />
              </div>

              <div style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 }}>
                {stats.count > 0 ? `${(stats.deltaMinutes / stats.count).toFixed(1)}m` : '0m'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Scarto medio per singola sessione ({stats.count} sessioni)</div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                <span>Rendimento Arrotondamento</span>
                <span>{stats.realHours > 0 ? `${((stats.roundedHours / stats.realHours) * 100).toFixed(1)}%` : '100%'}</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${Math.min(Math.max((stats.roundedHours / (stats.realHours || 1)) * 100, 0), 100)}%`, 
                    height: '100%', 
                    backgroundColor: stats.deltaHours >= 0 ? '#10b981' : '#ef4444',
                    borderRadius: '4px'
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. INTEGRAZIONE FINANCE TRACKER & STATO PAGAMENTI */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div className="card-title" style={{ marginBottom: 0 }}>
            <Wallet size={18} style={{ color: 'var(--color-brand)' }} />
            <span>Finance Tracker & Pagamenti</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', width: isMobile ? '100%' : 'auto' }}>
            <button 
              className="btn btn-secondary" 
              onClick={loadFinanceData}
              disabled={loadingIncomes}
              style={{ padding: '8px 12px', fontSize: '12px', flex: 1, gap: '6px', height: '40px' }}
            >
              <RefreshCw size={14} className={loadingIncomes ? 'animate-spin' : ''} />
              Sincronizza
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowAddMockModal(true)}
              style={{ padding: '8px 12px', fontSize: '12px', flex: 1, gap: '6px', height: '40px' }}
            >
              <PlusCircle size={14} />
              + Entrata Test
            </button>
          </div>
        </div>

        {/* Card Summary Finanziario */}
        <div className="card" style={{ marginBottom: '14px', padding: isMobile ? '14px' : '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: isMobile ? '10px' : '16px' }}>
            <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '14px', borderRadius: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>Compenso Dovuto (Work Tracker)</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>
                €{financeSummary.totalExpected.toFixed(2)}
              </div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '14px', borderRadius: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>Incassato (Finance Tracker)</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#10b981', marginTop: '2px' }}>
                €{financeSummary.totalReceived.toFixed(2)}
              </div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '14px', borderRadius: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>Saldo in Attesa / Sospeso</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: financeSummary.totalPending > 0 ? '#ef4444' : '#10b981', marginTop: '2px' }}>
                €{financeSummary.totalPending.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Dettaglio Pagamenti: Modalità Mobile Card vs Table Desktop */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>
              Dettaglio Pagamenti ({financeMatches.length})
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>Sigla:</span>
              <input 
                type="text" 
                value={searchKeyword} 
                onChange={e => setSearchKeyword(e.target.value)} 
                className="input-field" 
                style={{ width: '100px', padding: '4px 8px', fontSize: '12px' }} 
                placeholder="es: Lavoro"
              />
            </div>
          </div>

          {financeMatches.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <AlertCircle size={32} style={{ margin: '0 auto 10px auto', color: 'var(--text-muted)' }} />
              <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Nessun pagamento o sessione trovata.</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Verifica la sigla <code>Lavoro</code> nelle entrate di Finance Tracker o inserisci un'entrata test.
              </p>
            </div>
          ) : isMobile ? (
            /* Vista lista Card per Smartphone Mobile */
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {financeMatches.map((m, idx) => (
                <div key={m.id || idx} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '14px' }}>{m.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {m.periodLabel} • {m.sessionsCount} sessioni
                      </div>
                    </div>
                    <span style={statusBadgeStyle(m.status)}>
                      {m.status === 'saldato' && '🟢 Saldato'}
                      {m.status === 'extra' && '🔵 Extra'}
                      {m.status === 'parziale' && '🟡 Parziale'}
                      {m.status === 'in_attesa' && '🔴 Attesa'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-tertiary)', padding: '10px 12px', borderRadius: '10px', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Spettante: </span>
                      <strong style={{ color: 'var(--text-primary)' }}>€{m.expectedEarnings.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Incassato: </span>
                      <strong style={{ color: m.incomeAmount > 0 ? '#10b981' : 'var(--text-secondary)' }}>€{m.incomeAmount.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Diff: </span>
                      <strong style={{ color: m.difference >= 0 ? '#10b981' : '#ef4444' }}>
                        {m.difference >= 0 ? '+' : ''}€{m.difference.toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Vista Tabella Desktop */
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: '700' }}>Periodo / Sigla Transazione</th>
                    <th style={{ padding: '12px 16px', fontWeight: '700' }}>Stato Pagamento</th>
                    <th style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'right' }}>Spettante (Work)</th>
                    <th style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'right' }}>Incassato (Finance)</th>
                    <th style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'right' }}>Differenza</th>
                  </tr>
                </thead>
                <tbody>
                  {financeMatches.map((m, idx) => (
                    <tr key={m.id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '14px' }}>{m.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {m.periodLabel} • {m.sessionsCount} sessioni abbinate
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={statusBadgeStyle(m.status)}>
                          {m.status === 'saldato' && '🟢 Saldato'}
                          {m.status === 'extra' && '🔵 Extra Incassato'}
                          {m.status === 'parziale' && '🟡 Pagamento Parziale'}
                          {m.status === 'in_attesa' && '🔴 In Attesa'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', color: 'var(--text-primary)' }}>
                        €{m.expectedEarnings.toFixed(2)}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', color: m.incomeAmount > 0 ? '#10b981' : 'var(--text-secondary)' }}>
                        €{m.incomeAmount.toFixed(2)}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '800', color: m.difference >= 0 ? '#10b981' : '#ef4444' }}>
                        {m.difference >= 0 ? '+' : ''}€{m.difference.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 4. DISTRIBUZIONE ORE PER GIORNO DELLA SETTIMANA */}
      <div>
        <div className="card-title" style={{ marginBottom: '14px' }}>
          <Calendar size={18} style={{ color: 'var(--color-brand)' }} />
          <span>Distribuzione Ore per Giorno della Settimana</span>
        </div>

        <div className="card" style={{ padding: isMobile ? '16px' : '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(4, 1fr)' : 'repeat(auto-fit, minmax(90px, 1fr))', gap: '8px' }}>
            {dayDistribution.map((item, idx) => (
              <div key={idx} style={{ backgroundColor: 'var(--bg-tertiary)', padding: isMobile ? '10px 6px' : '14px 10px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {item.shortName}
                </div>
                <div style={{ fontSize: isMobile ? '15px' : '18px', fontWeight: '800', color: item.hours > 0 ? 'var(--color-brand)' : 'var(--text-secondary)' }}>
                  {item.hours.toFixed(1)}h
                </div>
                <div style={{ height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${item.percentage}%`, height: '100%', backgroundColor: 'var(--color-brand)', borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Aggiungi Entrata Mock (per test di integrazione) */}
      {showAddMockModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px', padding: isMobile ? '20px' : '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px' }}>Aggiungi Entrata Test</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Simula il salvataggio di un'entrata per testare l'algoritmo di matching con la sigla (es. <code>Lavoro 01/07 - 15/07/26</code>).
            </p>

            <form onSubmit={handleAddMockIncome}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px' }}>Titolo / Sigla Entrata</label>
                <input 
                  type="text" 
                  value={newMockTitle} 
                  onChange={e => setNewMockTitle(e.target.value)} 
                  className="input-field" 
                  placeholder="es: Lavoro 01/07 - 15/07/26 [fuori]" 
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px' }}>Importo (€)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={newMockAmount} 
                  onChange={e => setNewMockAmount(e.target.value)} 
                  className="input-field" 
                  placeholder="es: 150.00" 
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddMockModal(false)} style={{ width: 'auto', padding: '8px 16px' }}>Annulla</button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '8px 16px' }}>Salva</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Stili helper per i badge
const deltaBadgeStyle = (val) => ({
  fontSize: '11px',
  fontWeight: '700',
  padding: '4px 8px',
  borderRadius: '9999px',
  backgroundColor: val > 0 ? 'rgba(16, 185, 129, 0.15)' : val < 0 ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-tertiary)',
  color: val > 0 ? '#10b981' : val < 0 ? '#ef4444' : 'var(--text-secondary)'
});

const statusBadgeStyle = (status) => ({
  fontSize: '11px',
  fontWeight: '700',
  padding: '4px 10px',
  borderRadius: '9999px',
  display: 'inline-block',
  whiteSpace: 'nowrap',
  backgroundColor: 
    status === 'saldato' ? 'rgba(16, 185, 129, 0.15)' :
    status === 'extra' ? 'rgba(59, 130, 246, 0.15)' :
    status === 'parziale' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
  color: 
    status === 'saldato' ? '#10b981' :
    status === 'extra' ? '#3b82f6' :
    status === 'parziale' ? '#f59e0b' : '#ef4444'
});
