import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock3, 
  HelpCircle, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  PlusCircle,
  Zap,
  Wallet
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
    <div className="dashboard-container" style={{ paddingBottom: '40px' }}>
      {/* Header & Selettore Temporale */}
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp style={{ color: 'var(--color-brand)' }} size={28} />
            Analytics & Finance
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Analizza l'arrotondamento orario, l'impatto sui guadagni e sincronizza i pagamenti dal Finance Tracker.
          </p>
        </div>

        {/* Filtri Temporali */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px', alignItems: 'center' }}>
          <div className="badge-group" style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-secondary)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <button 
              className={`filter-btn ${timeRange === 'settimana' ? 'active' : ''}`}
              onClick={() => setTimeRange('settimana')}
              style={filterBtnStyle(timeRange === 'settimana')}
            >
              Settimana
            </button>
            <button 
              className={`filter-btn ${timeRange === 'mese' ? 'active' : ''}`}
              onClick={() => setTimeRange('mese')}
              style={filterBtnStyle(timeRange === 'mese')}
            >
              Mese
            </button>
            <button 
              className={`filter-btn ${timeRange === 'anno' ? 'active' : ''}`}
              onClick={() => setTimeRange('anno')}
              style={filterBtnStyle(timeRange === 'anno')}
            >
              Anno
            </button>
            <button 
              className={`filter-btn ${timeRange === 'totale' ? 'active' : ''}`}
              onClick={() => setTimeRange('totale')}
              style={filterBtnStyle(timeRange === 'totale')}
            >
              Totale
            </button>
            <button 
              className={`filter-btn ${timeRange === 'custom' ? 'active' : ''}`}
              onClick={() => setTimeRange('custom')}
              style={filterBtnStyle(timeRange === 'custom')}
            >
              Custom
            </button>
          </div>

          {/* Selettore Mese/Anno/Settimana con freccette */}
          {timeRange !== 'totale' && timeRange !== 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-secondary)', padding: '4px 12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <button onClick={handlePrevPeriod} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={18} />
              </button>
              <span style={{ fontWeight: '600', fontSize: '13px', minWidth: '130px', textAlign: 'center', color: 'var(--text-primary)' }}>
                {periodLabel}
              </span>
              <button onClick={handleNextPeriod} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Datepicker Custom */}
        {timeRange === 'custom' && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
            <input 
              type="date" 
              value={customStartDate} 
              onChange={e => setCustomStartDate(e.target.value)}
              className="input-field" 
              style={{ width: 'auto' }}
            />
            <span style={{ alignSelf: 'center', color: 'var(--text-secondary)' }}>fino a</span>
            <input 
              type="date" 
              value={customEndDate} 
              onChange={e => setCustomEndDate(e.target.value)}
              className="input-field" 
              style={{ width: 'auto' }}
            />
          </div>
        )}
      </div>

      {/* --- SEZIONE 1: INDICATORE ARROTONDAMENTO ORE & GUADAGNI REALI VS ARROTONDATI --- */}
      <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
        <Clock3 size={20} style={{ color: 'var(--color-brand)' }} />
        Indicatore Arrotondamento: Ore & Guadagni Reali
      </h3>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {/* Card 1: Ore Reali vs Arrotondate */}
        <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Confronto Ore</span>
            <span style={deltaBadgeStyle(stats.deltaHours)}>
              {stats.deltaHours > 0 ? '+' : ''}{formatHoursAndMinutes(Math.abs(stats.deltaHours))} ({stats.percentageHours >= 0 ? '+' : ''}{stats.percentageHours.toFixed(1)}%)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {stats.roundedHours.toFixed(1)}h
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Ore Arrotondate (Conteggiate)</div>
            </div>
            <div style={{ fontSize: '20px', color: 'var(--border-color)' }}>/</div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                {formatHoursAndMinutes(stats.realHours)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Ore Reali Effettive ({stats.realHours.toFixed(2)}h)</div>
            </div>
          </div>

          <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '8px' }}>
            {stats.deltaMinutes === 0 ? (
              <span>Le ore reali e arrotondate coincidono perfettamente.</span>
            ) : stats.deltaMinutes > 0 ? (
              <span style={{ color: '#10b981', fontWeight: '600' }}>
                🟢 +{stats.deltaMinutes} minuti in più riconosciuti dall'arrotondamento per eccesso.
              </span>
            ) : (
              <span style={{ color: '#ef4444', fontWeight: '600' }}>
                🔴 {stats.deltaMinutes} minuti in meno per l'arrotondamento per difetto.
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Guadagni Reali vs Arrotondati */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Confronto Guadagni</span>
            <span style={deltaBadgeStyle(stats.deltaEarnings)}>
              {stats.deltaEarnings >= 0 ? '+' : ''}€{stats.deltaEarnings.toFixed(2)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--color-brand)' }}>
                €{stats.roundedEarnings.toFixed(2)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Guadagno Arrotondato (Dovuto)</div>
            </div>
            <div style={{ fontSize: '20px', color: 'var(--border-color)' }}>/</div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                €{stats.realEarnings.toFixed(2)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Guadagno Reale Teorico</div>
            </div>
          </div>

          <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '8px' }}>
            Impatto economico netto dell'arrotondamento: <strong>{stats.deltaEarnings >= 0 ? '+' : ''}€{stats.deltaEarnings.toFixed(2)}</strong> rispetto alle ore reali lavorate.
          </div>
        </div>

        {/* Card 3: Efficienza Arrotondamento */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Efficienza & Rapporto</span>
            <Sparkles size={18} style={{ color: '#f59e0b' }} />
          </div>

          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)' }}>
            {stats.count > 0 ? `${(stats.deltaMinutes / stats.count).toFixed(1)}m` : '0m'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Scarto medio per singola sessione ({stats.count} sessioni)</div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${Math.min(Math.max((stats.roundedHours / (stats.realHours || 1)) * 100, 0), 100)}%`, 
                  height: '100%', 
                  backgroundColor: stats.deltaHours >= 0 ? '#10b981' : '#ef4444',
                  borderRadius: '4px'
                }} 
              />
            </div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {stats.realHours > 0 ? `${((stats.roundedHours / stats.realHours) * 100).toFixed(1)}%` : '100%'}
            </span>
          </div>
        </div>
      </div>

      {/* --- SEZIONE 2: INTEGRATO CON FINANCE TRACKER & CONFRONTO PAGAMENTI --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <Wallet size={20} style={{ color: 'var(--color-brand)' }} />
            Integrazione Finance Tracker & Stato Pagamenti
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Confronto tra i compensi spettanti da Work Tracker e le entrate registrate (sigla: <code>Lavoro DD/mm - dd/mm/yy</code>).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="secondary-btn" 
            onClick={loadFinanceData}
            disabled={loadingIncomes}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px' }}
          >
            <RefreshCw size={14} className={loadingIncomes ? 'animate-spin' : ''} />
            Sincronizza Dati
          </button>
          <button 
            className="primary-btn" 
            onClick={() => setShowAddMockModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px' }}
          >
            <PlusCircle size={14} />
            + Aggiungi Entrata (Test)
          </button>
        </div>
      </div>

      {/* Summary Finanziario */}
      <div className="card" style={{ marginBottom: '20px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Compenso Dovuto (Work Tracker)</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>
              €{financeSummary.totalExpected.toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Incassato (Finance Tracker)</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#10b981', marginTop: '2px' }}>
              €{financeSummary.totalReceived.toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Saldo in Attesa / Sospeso</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: financeSummary.totalPending > 0 ? '#ef4444' : '#10b981', marginTop: '2px' }}>
              €{financeSummary.totalPending.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabella / Lista dei Match dei Pagamenti */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '32px' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>
            Dettaglio Pagamenti Spettanti vs Incassati ({financeMatches.length})
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Filtro Sigla:</span>
            <input 
              type="text" 
              value={searchKeyword} 
              onChange={e => setSearchKeyword(e.target.value)} 
              className="input-field" 
              style={{ width: '110px', padding: '4px 8px', fontSize: '12px' }} 
              placeholder="es: Lavoro"
            />
          </div>
        </div>

        {financeMatches.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <AlertCircle size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <p style={{ fontSize: '14px', fontWeight: '600' }}>Nessun pagamento o sessione corrispondente trovata.</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>
              Verifica che le entrate registrate in Finance Tracker contengano la sigla <code>Lavoro</code> o aggiungi un'entrata di prova.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 16px' }}>Periodo / Sigla Transazione</th>
                  <th style={{ padding: '12px 16px' }}>Stato</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Spettante (Work)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Incassato (Finance)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Differenza</th>
                </tr>
              </thead>
              <tbody>
                {financeMatches.map((m, idx) => (
                  <tr key={m.id || idx} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{m.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {m.periodLabel} • {m.sessionsCount} sessioni
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={statusBadgeStyle(m.status)}>
                        {m.status === 'saldato' && '🟢 Saldato'}
                        {m.status === 'extra' && '🔵 Extra Incassato'}
                        {m.status === 'parziale' && '🟡 Pagamento Parziale'}
                        {m.status === 'in_attesa' && '🔴 In Attesa di Pagamento'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600' }}>
                      €{m.expectedEarnings.toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', color: m.incomeAmount > 0 ? '#10b981' : 'var(--text-secondary)' }}>
                      €{m.incomeAmount.toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', color: m.difference >= 0 ? '#10b981' : '#ef4444' }}>
                      {m.difference >= 0 ? '+' : ''}€{m.difference.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- SEZIONE 3: ANALISI DISTRIBUZIONE GIORNALIERA & PRODUTTIVITÀ --- */}
      <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
        <Calendar size={20} style={{ color: 'var(--color-brand)' }} />
        Distribuzione Ore per Giorno della Settimana
      </h3>

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px' }}>
          {dayDistribution.map((item, idx) => (
            <div key={idx} style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                {item.shortName}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: item.hours > 0 ? 'var(--color-brand)' : 'var(--text-secondary)' }}>
                {item.hours.toFixed(1)}h
              </div>
              <div style={{ height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${item.percentage}%`, height: '100%', backgroundColor: 'var(--color-brand)', borderRadius: '3px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Aggiungi Entrata Mock (per test di integrazione) */}
      {showAddMockModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px', backgroundColor: 'var(--bg-primary)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Aggiungi Entrata Finance Tracker (Test)</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Simula il salvataggio di un'entrata per testare l'algoritmo di matching con la sigla (es. <code>Lavoro 01/07 - 15/07/26</code>).
            </p>

            <form onSubmit={handleAddMockIncome}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Titolo / Sigla Entrata</label>
                <input 
                  type="text" 
                  value={newMockTitle} 
                  onChange={e => setNewMockTitle(e.target.value)} 
                  className="input-field" 
                  placeholder="es: Lavoro 01/07 - 15/07/26 [fuori]" 
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Importo (€)</label>
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
                <button type="button" className="secondary-btn" onClick={() => setShowAddMockModal(false)}>Annulla</button>
                <button type="submit" className="primary-btn">Salva Entrata Mock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Stili helper per il componente
const filterBtnStyle = (active) => ({
  padding: '6px 12px',
  borderRadius: '8px',
  fontSize: '12px',
  fontWeight: '600',
  border: 'none',
  cursor: 'pointer',
  backgroundColor: active ? 'var(--color-brand)' : 'transparent',
  color: active ? '#ffffff' : 'var(--text-secondary)',
  transition: 'all 0.2s ease'
});

const deltaBadgeStyle = (val) => ({
  fontSize: '11px',
  fontWeight: '700',
  padding: '4px 8px',
  borderRadius: '20px',
  backgroundColor: val > 0 ? 'rgba(16, 185, 129, 0.15)' : val < 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(156, 163, 175, 0.15)',
  color: val > 0 ? '#10b981' : val < 0 ? '#ef4444' : 'var(--text-secondary)'
});

const statusBadgeStyle = (status) => ({
  fontSize: '11px',
  fontWeight: '700',
  padding: '4px 10px',
  borderRadius: '20px',
  display: 'inline-block',
  backgroundColor: 
    status === 'saldato' ? 'rgba(16, 185, 129, 0.15)' :
    status === 'extra' ? 'rgba(59, 130, 246, 0.15)' :
    status === 'parziale' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
  color: 
    status === 'saldato' ? '#10b981' :
    status === 'extra' ? '#3b82f6' :
    status === 'parziale' ? '#f59e0b' : '#ef4444'
});
