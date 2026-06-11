import React, { useState, useMemo } from 'react';
import { Calendar, DollarSign, Clock, ChevronLeft, ChevronRight, TrendingUp, Printer } from 'lucide-react';
import { roundHours, getRoundedEarnings, formatHoursAndMinutes } from '../utils/rounding';

const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const WEEKDAYS_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

const getMonday = (dateStr) => {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const formatDateStr = (dateObj) => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function Analysis({ sessions, hourlyRate }) {
  // Stato per l'applicazione dell'arrotondamento (True per default)
  const [roundingApplied, setRoundingApplied] = useState(true);

  // --- STATISTICHE GENERALI (TOTALI) ---
  const totals = useMemo(() => {
    let hours = 0;
    let earnings = 0;
    
    sessions.forEach(s => {
      const h = Number(s.duration_hours);
      if (roundingApplied) {
        const rh = roundHours(h);
        hours += rh;
        earnings += rh * Number(s.hourly_rate);
      } else {
        hours += h;
        earnings += Number(s.earnings);
      }
    });
    
    return { hours, earnings, count: sessions.length };
  }, [sessions, roundingApplied]);

  // --- STATISTICHE MENSILI ---
  const monthlyData = useMemo(() => {
    const groups = {};
    sessions.forEach(s => {
      const yearMonth = s.date.substring(0, 7); // "YYYY-MM"
      if (!groups[yearMonth]) {
        groups[yearMonth] = { hours: 0, earnings: 0, sessions: [] };
      }
      
      const h = Number(s.duration_hours);
      if (roundingApplied) {
        const rh = roundHours(h);
        groups[yearMonth].hours += rh;
        groups[yearMonth].earnings += rh * Number(s.hourly_rate);
      } else {
        groups[yearMonth].hours += h;
        groups[yearMonth].earnings += Number(s.earnings);
      }
      groups[yearMonth].sessions.push(s);
    });
    return groups;
  }, [sessions, roundingApplied]);

  const uniqueMonths = useMemo(() => {
    const months = Object.keys(monthlyData).sort((a, b) => b.localeCompare(a));
    if (months.length === 0) {
      const now = new Date();
      const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return [currentYearMonth];
    }
    return months;
  }, [monthlyData]);

  const [selectedMonth, setSelectedMonth] = useState(() => uniqueMonths[0]);

  React.useEffect(() => {
    if (!uniqueMonths.includes(selectedMonth)) {
      setSelectedMonth(uniqueMonths[0]);
    }
  }, [uniqueMonths, selectedMonth]);

  const selectedMonthStats = useMemo(() => {
    const data = monthlyData[selectedMonth];
    return data || { hours: 0, earnings: 0, sessions: [] };
  }, [monthlyData, selectedMonth]);

  const formattedMonthLabel = (yearMonthStr) => {
    if (!yearMonthStr) return '';
    const [year, month] = yearMonthStr.split('-');
    const monthIndex = parseInt(month, 10) - 1;
    return `${MONTHS_IT[monthIndex]} ${year}`;
  };

  // --- STATISTICHE SETTIMANALI ---
  const weeklyData = useMemo(() => {
    const groups = {};
    
    sessions.forEach(s => {
      const mon = getMonday(s.date);
      const monStr = formatDateStr(mon);
      
      if (!groups[monStr]) {
        groups[monStr] = {
          mondayDate: mon,
          hours: 0,
          earnings: 0,
          days: Array(7).fill(0),
          sessions: []
        };
      }
      
      const h = Number(s.duration_hours);
      let calcH = h;
      let calcEarnings = Number(s.earnings);
      
      if (roundingApplied) {
        calcH = roundHours(h);
        calcEarnings = calcH * Number(s.hourly_rate);
      }
      
      groups[monStr].hours += calcH;
      groups[monStr].earnings += calcEarnings;
      groups[monStr].sessions.push(s);
      
      const day = new Date(s.date).getDay();
      const dayIndex = day === 0 ? 6 : day - 1;
      groups[monStr].days[dayIndex] += calcH;
    });
    
    return groups;
  }, [sessions, roundingApplied]);

  const uniqueWeeks = useMemo(() => {
    const weeks = Object.keys(weeklyData).sort((a, b) => b.localeCompare(a));
    if (weeks.length === 0) {
      const currentMon = getMonday(new Date());
      return [formatDateStr(currentMon)];
    }
    return weeks;
  }, [weeklyData]);

  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);

  React.useEffect(() => {
    if (selectedWeekIndex >= uniqueWeeks.length) {
      setSelectedWeekIndex(0);
    }
  }, [uniqueWeeks, selectedWeekIndex]);

  const activeWeekStr = uniqueWeeks[selectedWeekIndex] || formatDateStr(getMonday(new Date()));
  const activeWeekStats = useMemo(() => {
    const data = weeklyData[activeWeekStr];
    if (data) return data;
    
    const mon = new Date(activeWeekStr);
    return {
      mondayDate: mon,
      hours: 0,
      earnings: 0,
      days: Array(7).fill(0),
      sessions: []
    };
  }, [weeklyData, activeWeekStr]);

  const formattedWeekLabel = useMemo(() => {
    const monday = activeWeekStats.mondayDate;
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const formatDay = (d) => {
      const day = String(d.getDate()).padStart(2, '0');
      const month = d.toLocaleDateString('it-IT', { month: 'short' });
      return `${day} ${month.replace('.', '')}`;
    };

    return `${formatDay(monday)} - ${formatDay(sunday)}`;
  }, [activeWeekStats]);

  const handlePrevWeek = () => {
    if (selectedWeekIndex < uniqueWeeks.length - 1) {
      setSelectedWeekIndex(prev => prev + 1);
    }
  };

  const handleNextWeek = () => {
    if (selectedWeekIndex > 0) {
      setSelectedWeekIndex(prev => prev - 1);
    }
  };

  const maxHoursInWeek = useMemo(() => {
    const max = Math.max(...activeWeekStats.days);
    return max > 0 ? max : 8;
  }, [activeWeekStats]);

  // --- STATI E LOGICA PER ESPORTAZIONE PDF / PRINT ---
  const [exportType, setExportType] = useState('month'); // 'month' | 'week'
  const [exportPeriod, setExportPeriod] = useState(() => uniqueMonths[0]);

  // Sincronizza il periodo quando cambia il tipo di export
  React.useEffect(() => {
    if (exportType === 'month') {
      setExportPeriod(uniqueMonths[0]);
    } else {
      setExportPeriod(uniqueWeeks[0]);
    }
  }, [exportType, uniqueMonths, uniqueWeeks]);

  // Filtra e prepara le sessioni per l'esportazione (SEMPRE CON ARROTONDAMENTO APPLICATO)
  const exportSessions = useMemo(() => {
    if (!exportPeriod) return [];
    
    if (exportType === 'month') {
      return sessions
        .filter(s => s.date.substring(0, 7) === exportPeriod)
        .sort((a, b) => a.date.localeCompare(b.date));
    } else {
      const mon = new Date(exportPeriod);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      
      const monTime = mon.getTime();
      const sunTime = sun.getTime() + 86400000; // Includi tutta la domenica
      
      return sessions
        .filter(s => {
          const t = new Date(s.date).getTime();
          return t >= monTime && t < sunTime;
        })
        .sort((a, b) => a.date.localeCompare(b.date));
    }
  }, [sessions, exportType, exportPeriod]);

  // Calcola i totali per l'esportazione (CON ARROTONDAMENTO)
  const exportTotals = useMemo(() => {
    let rawHours = 0;
    let roundedHours = 0;
    let earnings = 0;
    
    exportSessions.forEach(s => {
      rawHours += Number(s.duration_hours);
      const rh = roundHours(Number(s.duration_hours));
      roundedHours += rh;
      earnings += rh * Number(s.hourly_rate);
    });
    
    return { rawHours, roundedHours, earnings, count: exportSessions.length };
  }, [exportSessions]);

  const handlePrint = () => {
    window.print();
  };

  const formattedExportPeriodLabel = useMemo(() => {
    if (!exportPeriod) return '';
    if (exportType === 'month') {
      return formattedMonthLabel(exportPeriod);
    } else {
      const mon = new Date(exportPeriod);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      
      const fDay = (d) => `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleDateString('it-IT', { month: 'short' }).replace('.', '')}`;
      return `Settimana del ${fDay(mon)} al ${fDay(sun)}`;
    }
  }, [exportType, exportPeriod]);

  const formattedDateItLong = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="view-content">
      {/* SELETTORE LIVELLO ARROTONDAMENTO */}
      <div className="toggle-container">
        <button 
          className={`toggle-btn ${roundingApplied ? 'active' : ''}`}
          onClick={() => setRoundingApplied(true)}
        >
          Valori Arrotondati (Pagamento)
        </button>
        <button 
          className={`toggle-btn ${!roundingApplied ? 'active terracotta' : ''}`}
          onClick={() => setRoundingApplied(false)}
        >
          Valori Reali (Senza Arrotondamento)
        </button>
      </div>

      {/* 1. SEZIONE TOTALI STORICI */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="card-title" style={{ marginBottom: '4px' }}>
          <TrendingUp size={18} color={roundingApplied ? 'var(--color-brand)' : 'var(--color-accent)'} />
          <span>Totale Periodo ({roundingApplied ? 'Arrotondato' : 'Reale'})</span>
        </div>
        <div className="stats-grid">
          <div className={`stat-box ${roundingApplied ? 'highlight' : 'terracotta-highlight'}`}>
            <span className="stat-lbl">Guadagno Totale</span>
            <span className={`stat-val ${roundingApplied ? 'earnings' : 'earnings-alt'}`}>
              €{totals.earnings.toFixed(2)}
            </span>
          </div>
          <div className="stat-box">
            <span className="stat-lbl">Ore Totali</span>
            <span className="stat-val">{formatHoursAndMinutes(totals.hours)}</span>
          </div>
        </div>
      </div>

      {/* 2. REPORT SETTIMANALE CON GRAFICO */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="card-title" style={{ marginBottom: '0' }}>
            <Calendar size={18} color={roundingApplied ? 'var(--color-brand)' : 'var(--color-accent)'} />
            <span>Rendimento Settimanale</span>
          </div>
          
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              className="btn-icon" 
              onClick={handlePrevWeek} 
              disabled={selectedWeekIndex >= uniqueWeeks.length - 1}
              style={{ width: '32px', height: '32px', opacity: selectedWeekIndex >= uniqueWeeks.length - 1 ? 0.3 : 1 }}
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              className="btn-icon" 
              onClick={handleNextWeek} 
              disabled={selectedWeekIndex <= 0}
              style={{ width: '32px', height: '32px', opacity: selectedWeekIndex <= 0 ? 0.3 : 1 }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', margin: '4px 0', fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
          {formattedWeekLabel}
        </div>

        <div className="stats-grid">
          <div className="stat-box" style={{ padding: '12px 14px' }}>
            <span className="stat-lbl">Guadagno Settimana</span>
            <span className={`stat-val ${roundingApplied ? 'earnings' : 'earnings-alt'}`} style={{ fontSize: '20px' }}>
              €{activeWeekStats.earnings.toFixed(2)}
            </span>
          </div>
          <div className="stat-box" style={{ padding: '12px 14px' }}>
            <span className="stat-lbl">Ore Lavorate</span>
            <span className="stat-val" style={{ fontSize: '20px' }}>
              {formatHoursAndMinutes(activeWeekStats.hours)}
            </span>
          </div>
        </div>

        {/* GRAFICO A BARRE CSS */}
        <div className="chart-container">
          <div className="chart-bars">
            {activeWeekStats.days.map((hours, index) => {
              const heightPct = (hours / maxHoursInWeek) * 100;
              const hasHours = hours > 0;
              return (
                <div key={index} className="chart-bar-wrapper">
                  <div 
                    className={`chart-bar-fill ${hasHours ? 'active' : ''} ${!roundingApplied ? 'terracotta' : ''}`}
                    style={{ height: `${Math.max(heightPct, 2)}%` }}
                  >
                    {hasHours && (
                      <span className="chart-bar-val">
                        {hours.toFixed(1)}h
                      </span>
                    )}
                  </div>
                  <span className="chart-bar-lbl">{WEEKDAYS_IT[index]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. REPORT MENSILE CON TABS */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="card-title">
          <DollarSign size={18} color={roundingApplied ? 'var(--color-brand)' : 'var(--color-accent)'} />
          <span>Statistiche Mensili</span>
        </div>

        <div className="month-selector">
          {uniqueMonths.map(ym => (
            <button
              key={ym}
              className={`month-tab ${selectedMonth === ym ? (roundingApplied ? 'active' : 'active terracotta') : ''}`}
              onClick={() => setSelectedMonth(ym)}
            >
              {formattedMonthLabel(ym)}
            </button>
          ))}
        </div>

        <div className="stats-grid" style={{ marginTop: '4px' }}>
          <div className="stat-box" style={{ padding: '14px' }}>
            <span className="stat-lbl">Totale Guadagni</span>
            <span className={`stat-val ${roundingApplied ? 'earnings' : 'earnings-alt'}`} style={{ fontSize: '22px' }}>
              €{selectedMonthStats.earnings?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="stat-box" style={{ padding: '14px' }}>
            <span className="stat-lbl">Totale Ore</span>
            <span className="stat-val" style={{ fontSize: '22px' }}>
              {formatHoursAndMinutes(selectedMonthStats.hours || 0)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', padding: '0 4px' }}>
          <span>Sessioni registrate nel mese:</span>
          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
            {selectedMonthStats.sessions?.length || 0}
          </span>
        </div>
      </div>

      {/* 4. SEZIONE ESPORTAZIONE ORE (PDF/DOCUMENTO) */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="card-title">
          <Printer size={18} color="var(--color-brand)" />
          <span>Esportazione Ore (Arrotondate)</span>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          Configura e genera una ricevuta ore in formato documento PDF per la contabilità del tuo principale. L'arrotondamento alla mezz'ora decimale più vicina verrà applicato automaticamente.
        </p>

        <div className="export-panel">
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label>Tipo di Periodo</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="exportType" 
                  value="month" 
                  checked={exportType === 'month'}
                  onChange={() => setExportType('month')}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-brand)' }}
                />
                Mensile
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="exportType" 
                  value="week" 
                  checked={exportType === 'week'}
                  onChange={() => setExportType('week')}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-brand)' }}
                />
                Settimanale
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Seleziona Periodo</label>
            <select 
              value={exportPeriod} 
              onChange={(e) => setExportPeriod(e.target.value)}
              style={{ borderRadius: '8px', padding: '10px' }}
            >
              {exportType === 'month' ? (
                uniqueMonths.map(ym => (
                  <option key={ym} value={ym}>{formattedMonthLabel(ym)}</option>
                ))
              ) : (
                uniqueWeeks.map(w => {
                  const mon = new Date(w);
                  const sun = new Date(mon);
                  sun.setDate(mon.getDate() + 6);
                  const fDay = (d) => `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleDateString('it-IT', { month: 'short' }).replace('.', '')}`;
                  return (
                    <option key={w} value={w}>Settimana {fDay(mon)} - {fDay(sun)}</option>
                  );
                })
              )}
            </select>
          </div>

          {exportSessions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
              {/* ANTEPRIMA DOCUMENTO */}
              <div className="print-document-screen">
                <h3>Resoconto Pagamento Ore</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '16px', color: 'var(--text-secondary)' }}>
                  <div>
                    <strong>Periodo:</strong> {formattedExportPeriodLabel}<br />
                    <strong>Tariffa Oraria:</strong> €{Number(hourlyRate).toFixed(2)} / ora
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong>Data Report:</strong> {new Date().toLocaleDateString('it-IT')}
                  </div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Note</th>
                      <th style={{ textAlign: 'right' }}>Ore Effettive</th>
                      <th style={{ textAlign: 'right' }}>Ore Arrotondate</th>
                      <th style={{ textAlign: 'right' }}>Subtotale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportSessions.map(s => {
                      const rHours = roundHours(Number(s.duration_hours));
                      const rEarnings = rHours * Number(s.hourly_rate);
                      return (
                        <tr key={s.id}>
                          <td>{new Date(s.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}</td>
                          <td style={{ fontStyle: 'italic' }}>{s.notes || 'Lavoro ordinario'}</td>
                          <td style={{ textAlign: 'right' }}>{Number(s.duration_hours).toFixed(2)}h</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{rHours.toFixed(1)}h</td>
                          <td style={{ textAlign: 'right', color: 'var(--color-brand)', fontWeight: '600' }}>€{rEarnings.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="total-summary">
                  <div style={{ textAlign: 'right', fontSize: '14px', lineHeight: '1.8' }}>
                    <div>Ore Reali Totali: <strong>{exportTotals.rawHours.toFixed(2)}h</strong></div>
                    <div>Ore Arrotondate Totali: <strong>{exportTotals.roundedHours.toFixed(1)}h</strong></div>
                    <div style={{ fontSize: '16px', borderTop: '1px solid #ccc', marginTop: '6px', paddingTop: '6px' }}>
                      Totale Compenso: <strong style={{ color: 'var(--color-brand)' }}>€{exportTotals.earnings.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* PULSANTE DI CONTROLLO ESPORTAZIONE (STAMPA/SALVA) */}
              <button className="btn btn-primary" onClick={handlePrint}>
                <Printer size={18} />
                Stampa o Salva PDF
              </button>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px 0', fontSize: '13px' }}>
              Nessuna sessione registrata nel periodo selezionato.
            </p>
          )}
        </div>
      </div>

      {/* CONTAINER INVISIBILE A SCHERMO - UTILIZZATO SOLO PER LA STAMPA FISICA O SALVATAGGIO PDF */}
      <div className="print-document" style={{ display: 'none' }}>
        <div className="print-header">
          <div>
            <div className="print-title">RESOCONTO ORE LAVORATIVE</div>
            <div>Documento riepilogativo per il pagamento</div>
          </div>
          <div className="print-meta">
            <strong>Data Emissione:</strong> {new Date().toLocaleDateString('it-IT')}<br />
            <strong>Periodo:</strong> {formattedExportPeriodLabel}<br />
            <strong>Tariffa Oraria Applicata:</strong> €{Number(hourlyRate).toFixed(2)} / ora
          </div>
        </div>

        <div>
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Data</th>
                <th style={{ width: '40%' }}>Descrizione Attività</th>
                <th style={{ width: '15%', textAlign: 'right' }}>Ore Effettive</th>
                <th style={{ width: '15%', textAlign: 'right' }}>Ore Arrotondate</th>
                <th style={{ width: '15%', textAlign: 'right' }}>Compenso</th>
              </tr>
            </thead>
            <tbody>
              {exportSessions.map(s => {
                const rHours = roundHours(Number(s.duration_hours));
                const rEarnings = rHours * Number(s.hourly_rate);
                return (
                  <tr key={s.id}>
                    <td>{new Date(s.date).toLocaleDateString('it-IT')}</td>
                    <td>{s.notes || 'Attività lavorativa ordinaria'}</td>
                    <td style={{ textAlign: 'right' }}>{Number(s.duration_hours).toFixed(2)}h</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{rHours.toFixed(1)}h</td>
                    <td style={{ textAlign: 'right' }}>€{rEarnings.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="print-summary-box">
          <div className="print-summary-content">
            <div className="print-summary-row">
              <span>Totale Ore Effettive:</span>
              <span>{exportTotals.rawHours.toFixed(2)} h</span>
            </div>
            <div className="print-summary-row">
              <span>Totale Ore Arrotondate:</span>
              <span>{exportTotals.roundedHours.toFixed(1)} h</span>
            </div>
            <div className="print-summary-row">
              <span>Tariffa Oraria:</span>
              <span>€{Number(hourlyRate).toFixed(2)} / h</span>
            </div>
            <div className="print-summary-row print-summary-total">
              <span>Totale da Pagare:</span>
              <span>€{exportTotals.earnings.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
