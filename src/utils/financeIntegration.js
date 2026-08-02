import { createClient } from '@supabase/supabase-js';
import { roundHours } from './rounding';

// ============================================================================
// FINANCE TRACKER - CLIENT SUPABASE DEDICATO
// ============================================================================
// Il Finance Tracker (hopeful-salk) usa un'istanza Supabase propria.
// Creiamo un client dedicato per leggere le sue transazioni direttamente
// dal database, indipendentemente dal client usato dal Work Hours app.
// ============================================================================

const FINANCE_SUPABASE_URL = 'https://aedoncqvypsrksnqiwgh.supabase.co';
const FINANCE_SUPABASE_ANON_KEY = 'sb_publishable_ByJxMVJBtmXSFcK57r3bPg_x7C_mEK7';

let financeSupabase = null;

try {
  financeSupabase = createClient(FINANCE_SUPABASE_URL, FINANCE_SUPABASE_ANON_KEY);
} catch (err) {
  console.error('[FinanceIntegration] Errore creazione client Supabase Finance Tracker:', err);
}

// ============================================================================
// UTILITIES
// ============================================================================

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
 * - "01/07 - 15/07/26"
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
  // separati da [-–—>|]|dal|al|a|fino a|to|->
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

// ============================================================================
// FETCH TRANSAZIONI DAL FINANCE TRACKER
// ============================================================================

/**
 * Recupera le transazioni di tipo "income" dal Finance Tracker.
 * Usa il client Supabase dedicato per connettersi al database di hopeful-salk.
 * In caso di fallimento, tenta anche le chiavi LocalStorage come fallback.
 * 
 * @returns {Promise<Array>} Lista delle transazioni di entrate
 */
export const fetchFinanceTrackerIncomes = async () => {
  let allFetchedIncomes = [];
  let supabaseSuccess = false;

  // 1. Query diretta sul Supabase del Finance Tracker
  if (financeSupabase) {
    try {
      console.log('[FinanceIntegration] Connessione a Supabase Finance Tracker...');
      
      const { data, error } = await financeSupabase
        .from('transactions')
        .select('*')
        .eq('type', 'income');

      if (error) {
        console.warn('[FinanceIntegration] Errore query Supabase:', error.message);
        
        // Tentativo alternativo: scarica tutte le transazioni e filtra lato client
        const { data: allData, error: allError } = await financeSupabase
          .from('transactions')
          .select('*');
        
        if (!allError && Array.isArray(allData) && allData.length > 0) {
          console.log(`[FinanceIntegration] Fallback: caricate ${allData.length} transazioni totali da Supabase`);
          const filtered = allData.filter(t => {
            const typeStr = String(t.type || '').toLowerCase();
            return typeStr === 'income' || typeStr === 'entrata' || (!t.type && Number(t.amount) > 0);
          });
          allFetchedIncomes = [...filtered];
          supabaseSuccess = true;
        }
      } else if (Array.isArray(data)) {
        console.log(`[FinanceIntegration] Caricate ${data.length} entrate da Supabase Finance Tracker`);
        allFetchedIncomes = [...data];
        supabaseSuccess = true;
      }
    } catch (err) {
      console.warn('[FinanceIntegration] Eccezione durante la query Supabase:', err);
    }
  } else {
    console.warn('[FinanceIntegration] Client Supabase Finance Tracker non disponibile');
  }

  // 2. Fallback: LocalStorage (per entrate test/mock salvate localmente)
  const localKeys = [
    'workhours_finance_incomes',
    'workhours_local_transactions',
    'finance_tracker_transactions'
  ];

  for (const key of localKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter(t => {
            const typeStr = String(t.type || '').toLowerCase();
            return typeStr === 'income' || typeStr === 'entrata' || (!t.type && Number(t.amount) > 0);
          });
          allFetchedIncomes = [...allFetchedIncomes, ...filtered];
        }
      }
    } catch (e) {
      // Ignora errori di parsing localStorage
    }
  }

  // 3. Deduplica le entrate per ID o per combinazione (titolo, importo, data)
  const seen = new Set();
  const uniqueIncomes = [];

  allFetchedIncomes.forEach(inc => {
    const uniqueKey = inc.id 
      ? String(inc.id) 
      : `${cleanTransactionTitle(inc.title || inc.description)}-${inc.amount}-${inc.created_at || inc.date}`;
    if (!seen.has(uniqueKey)) {
      seen.add(uniqueKey);
      uniqueIncomes.push(inc);
    }
  });

  console.log(`[FinanceIntegration] Totale entrate uniche trovate: ${uniqueIncomes.length} (Supabase: ${supabaseSuccess ? 'OK' : 'FALLITO'})`);

  return uniqueIncomes;
};

/**
 * Salva o aggiorna transazioni di entrate mock in LocalStorage per testare l'integrazione
 */
export const saveMockFinanceIncomes = (incomes) => {
  localStorage.setItem('workhours_finance_incomes', JSON.stringify(incomes));
};

// ============================================================================
// MATCHING: CONFRONTO ORE LAVORATE VS PAGAMENTI RICEVUTI
// ============================================================================

/**
 * Confronta SOLO le entrate reali dal Finance Tracker con le sessioni lavorative.
 * NON genera voci sintetiche "in attesa" — quella logica è gestita dal componente.
 * 
 * Ogni match porta con sé la lista delle sessioni abbinate (matchedSessions)
 * in modo che il componente possa ricalcolare expectedEarnings in base al filtro temporale.
 * 
 * @param {Array} sessions - Tutte le sessioni di lavoro
 * @param {Array} incomes - Entrate dal Finance Tracker
 * @param {string} keyword - Parola chiave di ricerca (default: "Lavoro")
 * @returns {Array} Risultati del confronto per ogni pagamento reale
 */
export const matchWorkHoursWithFinance = (sessions, incomes, keyword = 'Lavoro') => {
  if (!Array.isArray(sessions)) sessions = [];
  if (!Array.isArray(incomes)) incomes = [];

  const lowerKw = (keyword || '').toLowerCase().trim();

  // 1. Filtra le entrate pertinenti
  const relevantIncomes = incomes.filter(inc => {
    const rawTitle = inc.title || inc.description || '';
    const cleanTitle = cleanTransactionTitle(rawTitle).toLowerCase();
    
    if (!lowerKw) return true;
    if (cleanTitle.includes(lowerKw)) return true;

    const hasDates = parseDatesFromTitle(rawTitle) !== null;
    return hasDates;
  });

  // 2. Per ogni entrata reale, trova le sessioni abbinate
  const matches = [];

  relevantIncomes.forEach(inc => {
    const rawTitle = inc.title || inc.description || 'Entrata senza titolo';
    const cleanTitle = cleanTransactionTitle(rawTitle);
    const amount = Number(inc.amount) || 0;
    const incDate = inc.created_at ? inc.created_at.substring(0, 10) : (inc.date || '');
    
    // Tenta di estrarre il range dal titolo (es: "Lavoro 01/07 - 15/07/26")
    const dateRange = parseDatesFromTitle(cleanTitle);

    let matchedSessions = [];
    let periodLabel = '';

    if (dateRange) {
      // Filtra le sessioni che ricadono nell'intervallo [startDate, endDate]
      matchedSessions = sessions.filter(s => s.date >= dateRange.startDate && s.date <= dateRange.endDate);
      periodLabel = `${dateRange.startDate} → ${dateRange.endDate}`;
    } else if (incDate) {
      // Altrimenti abbina per mese di creazione della transazione
      const monthKey = incDate.substring(0, 7);
      matchedSessions = sessions.filter(s => s.date && s.date.startsWith(monthKey));
      periodLabel = `Mese di ${incDate.substring(0, 7)}`;
    }

    // Calcola il compenso spettante per TUTTE le sessioni abbinate
    let expectedEarnings = 0;
    matchedSessions.forEach(s => {
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
      sessionsCount: matchedSessions.length,
      matchedSessions  // Portiamo le sessioni per ricalcolo nel componente
    });
  });

  return matches;
};
