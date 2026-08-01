import { supabase } from '../supabaseClient';
import { roundHours } from './rounding';

/**
 * Rimuove tutti i tag di wallet (es: "[fuori]", "[busta]") e pulisce spazi multipli
 * 
 * @param {string} title 
 * @returns {string} Titolo pulito
 */
export const cleanTransactionTitle = (title) => {
  if (!title) return '';
  return title
    .replace(/\[.*?\]/g, '') // Rimuove qualsiasi parentesi quadra col wallet
    .replace(/\s+/g, ' ')     // Normalizza gli spazi
    .trim();
};

/**
 * Tenta di estrarre un intervallo di date da vari formati di titolo:
 * - "Lavoro 01/07 - 15/07/26"
 * - "Lavoro 01/07/26 - 15/07/26"
 * - "Lavoro 1.7 - 15.7.2026"
 * - "Lavoro 01-07 -> 15-07-26"
 * - "Lavoro dal 01/07 al 15/07/26"
 * 
 * @param {string} title 
 * @param {number} defaultYear - Anno di default se non specificato (es: 2026)
 * @returns {Object|null} { startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD" } oppure null
 */
export const parseDatesFromTitle = (title, defaultYear = new Date().getFullYear()) => {
  if (!title) return null;
  const cleanStr = cleanTransactionTitle(title);

  // RegEx ultratollerante:
  // Cerca due gruppi di date del tipo D(D)[/.-]M(M)[/.-](YY o YYYY)
  // separati da [-–—]|dal|al|a|fino a|to|->
  const rangeRegex = /(\d{1,2})[\/\.\-\s]+(\d{1,2})(?:[\/\.\-\s]+(\d{2,4}))?\s*(?:[-–—>|]|dal|al|a|fino\s+a|to|->)\s*(\d{1,2})[\/\.\-\s]+(\d{1,2})(?:[\/\.\-\s]+(\d{2,4}))?/i;
  
  const match = cleanStr.match(rangeRegex);

  if (match) {
    const [, d1, m1, y1, d2, m2, y2] = match;

    let year1 = y1 ? (y1.length === 2 ? `20${y1}` : y1) : (y2 ? (y2.length === 2 ? `20${y2}` : y2) : defaultYear);
    let year2 = y2 ? (y2.length === 2 ? `20${y2}` : y2) : year1;

    const pad = (n) => String(n).padStart(2, '0');

    const startDate = `${year1}-${pad(m1)}-${pad(d1)}`;
    const endDate = `${year2}-${pad(m2)}-${pad(d2)}`;

    return { startDate, endDate };
  }

  // Se è presente solo una singola data (es: "Lavoro 15/07/26")
  const singleDateRegex = /(\d{1,2})[\/\.\-\s]+(\d{1,2})(?:[\/\.\-\s]+(\d{2,4}))?/i;
  const singleMatch = cleanStr.match(singleDateRegex);
  if (singleMatch) {
    const [, d, m, y] = singleMatch;
    const year = y ? (y.length === 2 ? `20${y}` : y) : defaultYear;
    const pad = (n) => String(n).padStart(2, '0');
    const singleDate = `${year}-${pad(m)}-${pad(d)}`;
    return { startDate: singleDate, endDate: singleDate };
  }

  return null;
};


/**
 * Recupera le transazioni da Finance Tracker.
 * Cerca prima via Supabase (se configurato e connesso), altrimenti controlla localStorage.
 * 
 * @returns {Promise<Array>} Lista delle transazioni di entrate
 */
export const fetchFinanceTrackerIncomes = async () => {
  try {
    // 1. Tenta il caricamento da Supabase se non siamo in modalità Mock
    if (supabase && !supabase.isMock) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('type', 'income')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Impossibile accedere a Supabase per Finance Tracker, fallback a local:', err);
  }

  // 2. Fallback a LocalStorage (controlla sia chiavi condivise che mock locali)
  const localKeys = ['finance_tracker_transactions', 'hopeful_salk_transactions', 'workhours_finance_incomes'];
  for (const key of localKeys) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(t => t.type === 'income' || !t.type);
        }
      } catch (e) {
        console.error('Errore parsing dati locali finance:', e);
      }
    }
  }

  // Se non si trova nessuna entrata registrata, restituiamo un array vuoto
  return [];
};

/**
 * Salva o aggiorna transazioni di entrate mock in LocalStorage per testare l'integrazione
 */
export const saveMockFinanceIncomes = (incomes) => {
  localStorage.setItem('workhours_finance_incomes', JSON.stringify(incomes));
};

/**
 * Confronta i compensi dovuti da Work Tracker con le entrate registrate in Finance Tracker.
 * 
 * @param {Array} sessions - Tutte le sessioni di lavoro
 * @param {Array} incomes - Entrate dal Finance Tracker
 * @param {string} keyword - Parola chiave di ricerca (default: "Lavoro")
 * @returns {Array} Risultati del confronto raggruppati per periodo o transazione
 */
export const matchWorkHoursWithFinance = (sessions, incomes, keyword = 'Lavoro') => {
  if (!Array.isArray(sessions)) sessions = [];
  if (!Array.isArray(incomes)) incomes = [];

  const lowerKw = (keyword || 'Lavoro').toLowerCase().trim();

  // 1. Filtra solo le entrate pertinenti che contengono o iniziano con la parola chiave
  const relevantIncomes = incomes.filter(inc => {
    const title = cleanTransactionTitle(inc.title || inc.description || '').toLowerCase();
    return title.includes(lowerKw);
  });

  // 2. Raggruppiamo le sessioni lavorative per mese o per intervallo trovabile
  // Costruiamo anche un archivio mensile dei compensi dovuti da Work Tracker
  const monthlyWorkEarnings = {};
  sessions.forEach(s => {
    const monthKey = s.date.substring(0, 7); // "YYYY-MM"
    if (!monthlyWorkEarnings[monthKey]) {
      monthlyWorkEarnings[monthKey] = {
        monthKey,
        realHours: 0,
        roundedHours: 0,
        expectedEarnings: 0,
        sessions: []
      };
    }
    const realH = Number(s.duration_hours) || 0;
    const roundedH = roundHours(realH);
    const rate = Number(s.hourly_rate) || 0;

    monthlyWorkEarnings[monthKey].realHours += realH;
    monthlyWorkEarnings[monthKey].roundedHours += roundedH;
    monthlyWorkEarnings[monthKey].expectedEarnings += roundedH * rate;
    monthlyWorkEarnings[monthKey].sessions.push(s);
  });

  // 3. Creiamo l'elenco dei confronti
  const matches = [];

  // Mappa delle entrate elaborate
  const processedIncomeIds = new Set();

  // A. Analizza ogni entrata trovata nel Finance Tracker
  relevantIncomes.forEach(inc => {
    const rawTitle = inc.title || inc.description || 'Entrata senza titolo';
    const cleanTitle = cleanTransactionTitle(rawTitle);
    const amount = Number(inc.amount) || 0;
    const incDate = inc.created_at ? inc.created_at.substring(0, 10) : (inc.date || '');
    
    // Tenta di estrarre il range dal titolo (es: "Lavoro 01/07 - 15/07/26")
    const dateRange = parseDatesFromTitle(cleanTitle);

    let matchingSessions = [];
    let expectedEarnings = 0;
    let periodLabel = '';

    if (dateRange) {
      // Filtra le sessioni che ricadono nell'intervallo [startDate, endDate]
      matchingSessions = sessions.filter(s => s.date >= dateRange.startDate && s.date <= dateRange.endDate);
      periodLabel = `${dateRange.startDate} → ${dateRange.endDate}`;
    } else if (incDate) {
      // Altrimenti abbina per mese di creazione della transazione
      const monthKey = incDate.substring(0, 7);
      if (monthlyWorkEarnings[monthKey]) {
        matchingSessions = monthlyWorkEarnings[monthKey].sessions;
      }
      periodLabel = `Mese di ${incDate.substring(0, 7)}`;
    }

    // Calcola il compenso spettante per le sessioni abbinate
    matchingSessions.forEach(s => {
      const roundedH = roundHours(Number(s.duration_hours) || 0);
      const rate = Number(s.hourly_rate) || 0;
      expectedEarnings += roundedH * rate;
    });

    const difference = amount - expectedEarnings;
    let status = 'saldato';
    if (Math.abs(difference) < 0.5) {
      status = 'saldato';
    } else if (difference > 0) {
      status = 'extra';
    } else if (amount > 0 && difference < 0) {
      status = 'parziale';
    } else {
      status = 'in_attesa';
    }

    processedIncomeIds.add(inc.id || rawTitle);

    matches.push({
      id: inc.id || `inc-${Math.random()}`,
      title: cleanTitle,
      rawTitle,
      incomeAmount: amount,
      expectedEarnings,
      difference,
      status,
      periodLabel,
      dateRange,
      incomeDate: incDate,
      sessionsCount: matchingSessions.length
    });
  });

  // B. Verifica se ci sono mesi o periodi di lavoro registrati in Work Tracker a cui non corrisponde alcuna entrata
  Object.keys(monthlyWorkEarnings).sort((a, b) => b.localeCompare(a)).forEach(monthKey => {
    const monthData = monthlyWorkEarnings[monthKey];
    // Se c'è compenso atteso ma non è stato inserito nessun incasso corrispondente
    const hasIncomeForMonth = matches.some(m => m.incomeDate && m.incomeDate.startsWith(monthKey));

    if (!hasIncomeForMonth && monthData.expectedEarnings > 0) {
      matches.push({
        id: `unpaid-${monthKey}`,
        title: `Lavoro ${monthKey}`,
        rawTitle: `Lavoro ${monthKey}`,
        incomeAmount: 0,
        expectedEarnings: monthData.expectedEarnings,
        difference: -monthData.expectedEarnings,
        status: 'in_attesa',
        periodLabel: `Mese di ${monthKey}`,
        dateRange: null,
        incomeDate: `${monthKey}-01`,
        sessionsCount: monthData.sessions.length
      });
    }
  });

  return matches;
};
