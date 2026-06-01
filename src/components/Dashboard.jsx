import React, { useState, useMemo } from 'react';
import { Calendar, DollarSign, Clock, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';

// Nomi dei mesi in italiano
const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const WEEKDAYS_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

// Funzione helper per ottenere il lunedì di una data
const getMonday = (dateStr) => {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 1 = lunedì, se domenica indietreggia di 6 giorni
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// Funzione helper per formattare una data come YYYY-MM-DD
const formatDateStr = (dateObj) => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function Dashboard({ sessions }) {
  // --- STATISTICHE GENERALI (TOTALI) ---
  const totals = useMemo(() => {
    let hours = 0;
    let earnings = 0;
    sessions.forEach(s => {
      hours += Number(s.duration_hours);
      earnings += Number(s.earnings);
    });
    return { hours, earnings, count: sessions.length };
  }, [sessions]);

  // --- STATISTICHE MENSILI ---
  // Raggruppa le sessioni per mese (formato YYYY-MM)
  const monthlyData = useMemo(() => {
    const groups = {};
    sessions.forEach(s => {
      const yearMonth = s.date.substring(0, 7); // "YYYY-MM"
      if (!groups[yearMonth]) {
        groups[yearMonth] = { hours: 0, earnings: 0, sessions: [] };
      }
      groups[yearMonth].hours += Number(s.duration_hours);
      groups[yearMonth].earnings += Number(s.earnings);
      groups[yearMonth].sessions.push(s);
    });
    return groups;
  }, [sessions]);

  // Ottieni l'elenco dei mesi ordinati (dal più recente)
  const uniqueMonths = useMemo(() => {
    const months = Object.keys(monthlyData).sort((a, b) => b.localeCompare(a));
    // Se non ci sono dati, aggiungiamo il mese corrente come default
    if (months.length === 0) {
      const now = new Date();
      const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return [currentYearMonth];
    }
    return months;
  }, [monthlyData]);

  // Mese selezionato per il report mensile
  const [selectedMonth, setSelectedMonth] = useState(() => uniqueMonths[0]);

  // Aggiorna il mese selezionato se la lista dei mesi cambia (es. aggiunta nuova sessione in un mese nuovo)
  React.useEffect(() => {
    if (!uniqueMonths.includes(selectedMonth)) {
      setSelectedMonth(uniqueMonths[0]);
    }
  }, [uniqueMonths, selectedMonth]);

  // Statistiche del mese selezionato
  const selectedMonthStats = useMemo(() => {
    const data = monthlyData[selectedMonth];
    return data || { hours: 0, earnings: 0, count: 0 };
  }, [monthlyData, selectedMonth]);

  const formattedMonthLabel = (yearMonthStr) => {
    if (!yearMonthStr) return '';
    const [year, month] = yearMonthStr.split('-');
    const monthIndex = parseInt(month, 10) - 1;
    return `${MONTHS_IT[monthIndex]} ${year}`;
  };

  // --- STATISTICHE SETTIMANALI ---
  // Raggruppa le sessioni per lunedì di riferimento
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
          days: Array(7).fill(0), // Ore per Lun, Mar, Mer, Gio, Ven, Sab, Dom
          sessions: []
        };
      }
      
      groups[monStr].hours += Number(s.duration_hours);
      groups[monStr].earnings += Number(s.earnings);
      groups[monStr].sessions.push(s);
      
      // Calcola l'indice del giorno (0 = Lunedì, 6 = Domenica)
      const day = new Date(s.date).getDay();
      const dayIndex = day === 0 ? 6 : day - 1;
      groups[monStr].days[dayIndex] += Number(s.duration_hours);
    });
    
    return groups;
  }, [sessions]);

  // Elenco dei lunedì ordinati (dal più recente)
  const uniqueWeeks = useMemo(() => {
    const weeks = Object.keys(weeklyData).sort((a, b) => b.localeCompare(a));
    // Se non ci sono dati, aggiungiamo la settimana corrente
    if (weeks.length === 0) {
      const currentMon = getMonday(new Date());
      return [formatDateStr(currentMon)];
    }
    return weeks;
  }, [weeklyData]);

  // Indice della settimana selezionata
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);

  // Forza a 0 se l'indice è fuori limiti
  React.useEffect(() => {
    if (selectedWeekIndex >= uniqueWeeks.length) {
      setSelectedWeekIndex(0);
    }
  }, [uniqueWeeks, selectedWeekIndex]);

  // Settimana selezionata
  const activeWeekStr = uniqueWeeks[selectedWeekIndex] || formatDateStr(getMonday(new Date()));
  const activeWeekStats = useMemo(() => {
    const data = weeklyData[activeWeekStr];
    if (data) return data;
    
    // Ritorna struttura vuota se la settimana non ha dati
    const mon = new Date(activeWeekStr);
    return {
      mondayDate: mon,
      hours: 0,
      earnings: 0,
      days: Array(7).fill(0),
      sessions: []
    };
  }, [weeklyData, activeWeekStr]);

  // Formatta l'etichetta della settimana (es. "Lun 25 Mag - Dom 31 Mag")
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

  // Navigazione tra le settimane
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

  // Calcolo delle ore massime in questa settimana per scalare il grafico CSS
  const maxHoursInWeek = useMemo(() => {
    const max = Math.max(...activeWeekStats.days);
    return max > 0 ? max : 8; // Default a 8 ore se è vuoto per non rompere il grafico
  }, [activeWeekStats]);

  // Formatta decimali ore in ore e minuti (es. 2.5 -> "2h 30m")
  const formatHoursAndMinutes = (hoursDecimal) => {
    const totalMinutes = Math.round(hoursDecimal * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="view-content">
      {/* 1. SEZIONE TOTALI STORICI */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="card-title" style={{ marginBottom: '4px' }}>
          <TrendingUp size={18} color="var(--color-success)" />
          <span>Totale Registrato</span>
        </div>
        <div className="stats-grid">
          <div className="stat-box highlight">
            <span className="stat-lbl">Guadagno Totale</span>
            <span className="stat-val earnings">€{totals.earnings.toFixed(2)}</span>
          </div>
          <div className="stat-box">
            <span className="stat-lbl">Ore Totali</span>
            <span className="stat-val">{formatHoursAndMinutes(totals.hours)}</span>
          </div>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
          Basato su {totals.count} sessioni registrate
        </div>
      </div>

      {/* 2. REPORT SETTIMANALE CON GRAFICO */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-title" style={{ marginBottom: '0' }}>
            <Calendar size={18} color="var(--color-brand)" />
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
            <span className="stat-val earnings" style={{ fontSize: '20px' }}>€{activeWeekStats.earnings.toFixed(2)}</span>
          </div>
          <div className="stat-box" style={{ padding: '12px 14px' }}>
            <span className="stat-lbl">Ore Lavorate</span>
            <span className="stat-val" style={{ fontSize: '20px' }}>{formatHoursAndMinutes(activeWeekStats.hours)}</span>
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
                    className={`chart-bar-fill ${hasHours ? 'active' : ''}`}
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
          <DollarSign size={18} color="var(--color-success)" />
          <span>Statistiche Mensili</span>
        </div>

        {/* Barra di selezione del mese */}
        <div className="month-selector">
          {uniqueMonths.map(ym => (
            <button
              key={ym}
              className={`month-tab ${selectedMonth === ym ? 'active' : ''}`}
              onClick={() => setSelectedMonth(ym)}
            >
              {formattedMonthLabel(ym)}
            </button>
          ))}
        </div>

        {/* Statistiche per il mese scelto */}
        <div className="stats-grid" style={{ marginTop: '4px' }}>
          <div className="stat-box" style={{ padding: '14px' }}>
            <span className="stat-lbl">Totale Guadagni</span>
            <span className="stat-val earnings" style={{ fontSize: '22px' }}>
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
    </div>
  );
}
