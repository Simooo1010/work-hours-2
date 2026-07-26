import React, { useState, useMemo } from 'react';
import { Calendar, DollarSign, ChevronLeft, ChevronRight, TrendingUp, Printer } from 'lucide-react';
import { roundHours, getRoundedEarnings, formatHoursAndMinutes, getRoundedEndTime } from '../utils/rounding';


const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const WEEKDAYS_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

const getMonday = (dateStr) => {
  const parts = String(dateStr).split('-');
  const d = parts.length === 3 
    ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    : new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
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
  const [exportType, setExportType] = useState('month'); // 'month' | 'week' | 'custom'
  const [exportPeriod, setExportPeriod] = useState(() => uniqueMonths[0]);
  const [customSelectedIds, setCustomSelectedIds] = useState([]);
  const [selectedExportWeeks, setSelectedExportWeeks] = useState(() => uniqueWeeks.length > 0 ? [uniqueWeeks[0]] : []);

  // Sincronizza il periodo quando cambia il tipo di export
  React.useEffect(() => {
    if (exportType === 'month') {
      setExportPeriod(uniqueMonths[0]);
    } else if (exportType === 'week') {
      setSelectedExportWeeks(prev => {
        if (prev.length === 0 || !prev.every(w => uniqueWeeks.includes(w))) {
          return uniqueWeeks.length > 0 ? [uniqueWeeks[0]] : [];
        }
        return prev;
      });
    }
  }, [exportType, uniqueMonths, uniqueWeeks]);

  // Inizializza customSelectedIds con tutte le sessioni al primo cambio su 'custom' o quando cambiano le sessioni
  React.useEffect(() => {
    if (exportType === 'custom') {
      const timer = setTimeout(() => {
        setCustomSelectedIds(prev => {
          const sessionIds = sessions.map(s => s.id);
          const allStillExist = prev.every(id => sessionIds.includes(id));
          if (prev.length === 0 || !allStillExist || prev.length !== sessions.length) {
            return sessionIds;
          }
          return prev;
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [exportType, sessions]);

  const handleToggleCustomSession = (id) => {
    setCustomSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllCustom = () => {
    setCustomSelectedIds(sessions.map(s => s.id));
  };

  const handleDeselectAllCustom = () => {
    setCustomSelectedIds([]);
  };

  const handleToggleExportWeek = (weekStr) => {
    setSelectedExportWeeks(prev =>
      prev.includes(weekStr)
        ? prev.filter(w => w !== weekStr)
        : [...prev, weekStr]
    );
  };

  const handleSelectAllWeeks = () => {
    setSelectedExportWeeks([...uniqueWeeks]);
  };

  const handleDeselectAllWeeks = () => {
    setSelectedExportWeeks([]);
  };

  // Filtra e prepara le sessioni per l'esportazione (SEMPRE CON ARROTONDAMENTO APPLICATO)
  const exportSessions = useMemo(() => {
    if (exportType === 'custom') {
      return sessions
        .filter(s => customSelectedIds.includes(s.id))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    if (exportType === 'month') {
      if (!exportPeriod) return [];
      return sessions
        .filter(s => s.date.substring(0, 7) === exportPeriod)
        .sort((a, b) => a.date.localeCompare(b.date));
    } else {
      // exportType === 'week'
      if (selectedExportWeeks.length === 0) return [];
      return sessions
        .filter(s => {
          const sessionMonStr = formatDateStr(getMonday(s.date));
          return selectedExportWeeks.includes(sessionMonStr);
        })
        .sort((a, b) => a.date.localeCompare(b.date));
    }
  }, [sessions, exportType, exportPeriod, customSelectedIds, selectedExportWeeks]);

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

  return (
    <div className="view-content analysis-grid">
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          <Calendar size={18} color={roundingApplied ? 'var(--color-brand)' : 'var(--color-accent)'} />
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
      </div>

      {/* 4. ESPORTAZIONE TABELLA E TOTALI ORE/GUADAGNO */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="card-title">
          <Printer size={18} color="var(--color-brand)" />
          <span>Esportazione Ore (Arrotondate)</span>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: '0' }}>
            <label>Tipo Periodo</label>
            <select 
              value={exportType} 
              onChange={(e) => setExportType(e.target.value)}
              style={{ borderRadius: '8px', padding: '10px' }}
            >
              <option value="month">Mensile</option>
              <option value="week">Settimanale</option>
              <option value="custom">Personalizzato (Custom)</option>
            </select>
          </div>
          
          <div className="form-group" style={{ flex: 1, marginBottom: '0' }}>
            <label>Seleziona Data</label>
            {exportType === 'custom' ? (
              <select disabled style={{ borderRadius: '8px', padding: '10px', opacity: 0.6, cursor: 'not-allowed' }}>
                <option>Selezione Libera (Sotto)</option>
              </select>
            ) : exportType === 'week' ? (
              <select 
                value={(() => {
                  const isAllSelected = selectedExportWeeks.length === uniqueWeeks.length && uniqueWeeks.length > 0;
                  const isLast2Selected = uniqueWeeks.length >= 2 && selectedExportWeeks.length === 2 && selectedExportWeeks.every((w, i) => w === uniqueWeeks[i]);
                  const isLast4Selected = uniqueWeeks.length >= 4 && selectedExportWeeks.length === 4 && selectedExportWeeks.every((w, i) => w === uniqueWeeks[i]);
                  if (selectedExportWeeks.length === 1) return selectedExportWeeks[0];
                  if (isAllSelected) return 'all';
                  if (isLast2Selected) return 'last2';
                  if (isLast4Selected) return 'last4';
                  if (selectedExportWeeks.length === 0) return '';
                  return 'custom_weeks';
                })()} 
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'all') {
                    setSelectedExportWeeks([...uniqueWeeks]);
                  } else if (val === 'last2') {
                    setSelectedExportWeeks(uniqueWeeks.slice(0, 2));
                  } else if (val === 'last4') {
                    setSelectedExportWeeks(uniqueWeeks.slice(0, 4));
                  } else if (val && val !== 'custom_weeks') {
                    setSelectedExportWeeks([val]);
                  }
                }}
                style={{ borderRadius: '8px', padding: '10px' }}
              >
                {selectedExportWeeks.length > 1 && 
                 selectedExportWeeks.length !== uniqueWeeks.length && 
                 !(uniqueWeeks.length >= 2 && selectedExportWeeks.length === 2 && selectedExportWeeks.every((w, i) => w === uniqueWeeks[i])) &&
                 !(uniqueWeeks.length >= 4 && selectedExportWeeks.length === 4 && selectedExportWeeks.every((w, i) => w === uniqueWeeks[i])) && (
                  <option value="custom_weeks">{selectedExportWeeks.length} settimane selezionate (modifica sotto)</option>
                )}
                {selectedExportWeeks.length === 0 && (
                  <option value="">Nessuna settimana selezionata</option>
                )}
                <option value="all">Tutte le settimane ({uniqueWeeks.length})</option>
                {uniqueWeeks.length >= 2 && <option value="last2">Ultime 2 settimane</option>}
                {uniqueWeeks.length >= 4 && <option value="last4">Ultime 4 settimane</option>}
                <optgroup label="Singole Settimane">
                  {uniqueWeeks.map(w => {
                    const mon = new Date(w);
                    const sun = new Date(mon);
                    sun.setDate(mon.getDate() + 6);
                    const fDay = (d) => `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleDateString('it-IT', { month: 'short' }).replace('.', '')}`;
                    return (
                      <option key={w} value={w}>Settimana {fDay(mon)} - {fDay(sun)}</option>
                    );
                  })}
                </optgroup>
              </select>
            ) : (
              <select 
                value={exportPeriod} 
                onChange={(e) => setExportPeriod(e.target.value)}
                style={{ borderRadius: '8px', padding: '10px' }}
              >
                {uniqueMonths.map(ym => (
                  <option key={ym} value={ym}>{formattedMonthLabel(ym)}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {exportType === 'week' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                Seleziona Settimane ({selectedExportWeeks.length}/{uniqueWeeks.length})
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--color-brand)', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', padding: '0' }}
                  onClick={handleSelectAllWeeks}
                >
                  Seleziona Tutte
                </button>
                <span style={{ color: 'var(--border-color)', fontSize: '11px' }}>|</span>
                <button 
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--color-brand)', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', padding: '0' }}
                  onClick={handleDeselectAllWeeks}
                >
                  Deseleziona Tutte
                </button>
              </div>
            </div>
            
            <div className="custom-sessions-list" style={{ 
              maxHeight: '180px', 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '6px',
              paddingRight: '4px'
            }}>
              {uniqueWeeks.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                  Nessuna settimana registrata.
                </div>
              ) : (
                uniqueWeeks.map(w => {
                  const isChecked = selectedExportWeeks.includes(w);
                  const mon = new Date(w);
                  const sun = new Date(mon);
                  sun.setDate(mon.getDate() + 6);
                  const fDay = (d) => `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleDateString('it-IT', { month: 'short' }).replace('.', '')}`;
                  
                  const weekData = weeklyData[w];
                  const hoursStr = weekData ? `${weekData.hours.toFixed(1)}h` : '0h';
                  const countStr = weekData ? `${weekData.sessions.length} sessioni` : '0 sessioni';

                  return (
                    <label 
                      key={w} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        fontSize: '12px', 
                        cursor: 'pointer', 
                        padding: '6px 8px', 
                        borderRadius: '6px', 
                        background: isChecked ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                        border: isChecked ? '1px solid var(--color-brand)' : '1px solid transparent',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => handleToggleExportWeek(w)}
                        style={{ cursor: 'pointer', accentColor: 'var(--color-brand)' }}
                      />
                      <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', flex: 1 }}>
                        Settimana {fDay(mon)} - {fDay(sun)}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {countStr} ({hoursStr})
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}

        {exportType === 'custom' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                Seleziona Sessioni ({customSelectedIds.length}/{sessions.length})
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--color-brand)', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', padding: '0' }}
                  onClick={handleSelectAllCustom}
                >
                  Seleziona Tutte
                </button>
                <span style={{ color: 'var(--border-color)', fontSize: '11px' }}>|</span>
                <button 
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--color-brand)', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', padding: '0' }}
                  onClick={handleDeselectAllCustom}
                >
                  Deseleziona Tutte
                </button>
              </div>
            </div>
            
            <div className="custom-sessions-list" style={{ 
              maxHeight: '180px', 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '6px',
              paddingRight: '4px'
            }}>
              {sessions.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                  Nessuna sessione registrata.
                </div>
              ) : (
                sessions.map(s => {
                  const isChecked = customSelectedIds.includes(s.id);
                  const rHours = roundHours(Number(s.duration_hours));
                  return (
                    <label 
                      key={s.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        fontSize: '12px', 
                        cursor: 'pointer', 
                        padding: '6px 8px', 
                        borderRadius: '6px', 
                        background: isChecked ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                        border: isChecked ? '1px solid var(--color-brand)' : '1px solid transparent',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => handleToggleCustomSession(s.id)}
                        style={{ cursor: 'pointer', accentColor: 'var(--color-brand)' }}
                      />
                      <span style={{ fontWeight: 'bold', minWidth: '75px', color: 'var(--text-primary)' }}>
                        {new Date(s.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </span>
                      <span style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                        {s.notes || 'Lavoro ordinario'}
                      </span>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {rHours.toFixed(1)}h ({s.start_time.substring(0, 5)} - {getRoundedEndTime(s.start_time, rHours)})
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}

        {exportSessions.length > 0 ? (
          <div className="export-panel" style={{ border: 'none', paddingTop: '0', marginTop: '8px' }}>
            <div className="print-document-screen" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ marginBottom: '16px', borderBottom: '2px solid var(--color-brand)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Riepilogo Ore Lavorative</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {exportType === 'month' && `Periodo Mensile: ${formattedMonthLabel(exportPeriod)}`}
                    {exportType === 'week' && (
                      selectedExportWeeks.length === 1 
                        ? `Periodo: Settimana (${(() => {
                            const mon = new Date(selectedExportWeeks[0]);
                            const sun = new Date(mon);
                            sun.setDate(mon.getDate() + 6);
                            const fDay = (d) => `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleDateString('it-IT', { month: 'short' }).replace('.', '')}`;
                            return `${fDay(mon)} - ${fDay(sun)}`;
                          })()})`
                        : `Periodo: ${selectedExportWeeks.length} settimane selezionate`
                    )}
                    {exportType === 'custom' && `Periodo: Selezione Personalizzata (${exportSessions.length} sessioni)`}
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {exportSessions.length} sessioni incluse
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 4px', width: '20%' }}>Data</th>
                    <th style={{ padding: '8px 4px', width: '60%' }}>Descrizione Lavoro / Note</th>
                    <th style={{ padding: '8px 4px', width: '20%', textAlign: 'right' }}>Ore</th>
                  </tr>
                </thead>
                <tbody>
                  {exportSessions.map(s => {
                    const rHours = roundHours(Number(s.duration_hours));
                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--bg-tertiary)' }}>
                        <td style={{ padding: '10px 4px' }}>{new Date(s.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
                        <td style={{ padding: '10px 4px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>{s.notes || 'Lavoro ordinario'}</td>
                        <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 'bold' }}>
                          <div>{rHours.toFixed(1)}h</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal', marginTop: '2px' }}>
                            {s.start_time.substring(0, 5)} - {getRoundedEndTime(s.start_time, rHours)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: '20px', fontSize: '14px', lineHeight: '1.6' }}>
                <div>Totale Ore: <strong>{exportTotals.roundedHours.toFixed(1)} ore</strong></div>
                <div style={{ color: 'var(--color-brand)', fontWeight: 'bold' }}>Totale Guadagno: <strong>€{exportTotals.earnings.toFixed(2)}</strong></div>
              </div>
            </div>

            {/* PULSANTE STAMPA */}
            <button className="btn btn-primary" onClick={handlePrint} style={{ marginTop: '8px' }}>
              <Printer size={18} />
              Esporta PDF / Stampa
            </button>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px 0', fontSize: '13px' }}>
            Nessuna sessione registrata nel periodo selezionato.
          </p>
        )}
      </div>

      {/* DOCUMENTO DI STAMPA A4 INVISIBILE A SCHERMO (stampa solo tabella e totali) */}
      <div className="print-document" style={{ display: 'none', color: '#000000', fontSize: '11pt', padding: '10px' }}>
        <div style={{ borderBottom: '2px solid #000000', paddingBottom: '10px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '18pt', fontWeight: 'bold' }}>Riepilogo Ore Lavorative</h1>
            <div style={{ fontSize: '11pt', marginTop: '4px', color: '#333333' }}>
              {exportType === 'month' && `Periodo: ${formattedMonthLabel(exportPeriod)}`}
              {exportType === 'week' && (
                selectedExportWeeks.length === 1
                  ? `Periodo: Settimana (${(() => {
                      const mon = new Date(selectedExportWeeks[0]);
                      const sun = new Date(mon);
                      sun.setDate(mon.getDate() + 6);
                      const fDay = (d) => `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleDateString('it-IT', { month: 'short' }).replace('.', '')}`;
                      return `${fDay(mon)} - ${fDay(sun)}`;
                    })()})`
                  : `Periodo: Settimanale (${selectedExportWeeks.length} settimane)`
              )}
              {exportType === 'custom' && `Periodo: Personalizzato (${exportSessions.length} sessioni)`}
            </div>
          </div>
          <div style={{ fontSize: '10pt', color: '#555555' }}>
            Data report: {new Date().toLocaleDateString('it-IT')}
          </div>
        </div>

        <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ border: '1px solid #dddddd', padding: '10px 8px', fontWeight: 'bold', width: '20%' }}>Data</th>
              <th style={{ border: '1px solid #dddddd', padding: '10px 8px', fontWeight: 'bold', width: '60%' }}>Descrizione Attività / Note</th>
              <th style={{ border: '1px solid #dddddd', padding: '10px 8px', fontWeight: 'bold', width: '20%', textAlign: 'right' }}>Ore</th>
            </tr>
          </thead>
          <tbody>
            {exportSessions.map(s => {
              const rHours = roundHours(Number(s.duration_hours));
              return (
                <tr key={s.id}>
                  <td style={{ border: '1px solid #dddddd', padding: '8px' }}>{new Date(s.date).toLocaleDateString('it-IT')}</td>
                  <td style={{ border: '1px solid #dddddd', padding: '8px', fontStyle: 'italic' }}>{s.notes || 'Attività lavorativa ordinaria'}</td>
                  <td style={{ border: '1px solid #dddddd', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
                    <div>{rHours.toFixed(1)} h</div>
                    <div style={{ fontSize: '9pt', color: '#555555', fontWeight: 'normal', marginTop: '2px' }}>
                      {s.start_time.substring(0, 5)} - {getRoundedEndTime(s.start_time, rHours)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: '20px', fontSize: '12pt', lineHeight: '1.6', borderTop: '2px solid #000000', paddingTop: '10px' }}>
          <div>Totale Ore: <strong>{exportTotals.roundedHours.toFixed(1)} ore</strong></div>
          <div style={{ fontSize: '14pt', fontWeight: 'bold' }}>Totale Guadagno: <strong>€{exportTotals.earnings.toFixed(2)}</strong></div>
        </div>
      </div>
    </div>
  );
}
