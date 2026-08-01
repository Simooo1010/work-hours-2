/**
 * Arrotonda le ore alla mezz'ora/ora decimale più vicina.
 * Esempi:
 * - 4 ore e 35 minuti (4.58 ore) -> 4.5 ore
 * - 5 ore e 54 minuti (5.90 ore) -> 6.0 ore
 * - 7 ore e 10 minuti (7.17 ore) -> 7.0 ore
 * 
 * @param {number} hours - Ore in formato decimale
 * @returns {number} Ore arrotondate al più vicino 0.5
 */
export const roundHours = (hours) => {
  if (isNaN(hours) || hours === null) return 0;
  return Math.round(Number(hours) * 2) / 2;
};

/**
 * Calcola i guadagni basati sulle ore arrotondate e sulla tariffa oraria.
 * 
 * @param {number} hours - Ore in formato decimale
 * @param {number} rate - Tariffa oraria
 * @returns {number} Guadagni arrotondati
 */
export const getRoundedEarnings = (hours, rate) => {
  if (isNaN(hours) || hours === null) return 0;
  const rounded = roundHours(hours);
  return rounded * Number(rate);
};

/**
 * Formatta le ore decimali in stringa leggibile HHh MMm
 * 
 * @param {number} hoursDecimal 
 * @returns {string} Esempio: "4h 30m"
 */
export const formatHoursAndMinutes = (hoursDecimal) => {
  if (isNaN(hoursDecimal) || hoursDecimal === null) return '0m';
  const totalMinutes = Math.round(hoursDecimal * 60);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
};

/**
 * Calcola l'orario di fine arrotondato in base alla durata arrotondata
 * ed all'orario di inizio fornito.
 * 
 * @param {string} startTime - Orario di inizio nel formato "HH:MM" o "HH:MM:SS"
 * @param {number} roundedHours - Ore arrotondate
 * @returns {string} Orario di fine arrotondato nel formato "HH:MM"
 */
export const getRoundedEndTime = (startTime, roundedHours) => {
  if (!startTime) return '';
  
  // Rimuovi i secondi se presenti e prendi ore/minuti
  const parts = startTime.split(':');
  const startH = parseInt(parts[0], 10) || 0;
  const startM = parseInt(parts[1], 10) || 0;
  
  const startMin = startH * 60 + startM;
  const roundedMin = Math.round(roundedHours * 60);
  
  let endMin = startMin + roundedMin;
  
  // Gestiamo il superamento delle 24 ore
  endMin = endMin % (24 * 60);
  
  const endH = Math.floor(endMin / 60);
  const endM = endMin % 60;
  
  const pad = (num) => String(num).padStart(2, '0');
  return `${pad(endH)}:${pad(endM)}`;
};

/**
 * Calcola le statistiche dettagliate che mettono a confronto dati reali vs arrotondati.
 * 
 * @param {Array} sessionsArray - Array di sessioni di lavoro
 * @returns {Object} Statistiche di confronto (realHours, roundedHours, deltaHours, realEarnings, roundedEarnings, deltaEarnings, etc.)
 */
export const calculateRealVsRoundedStats = (sessionsArray) => {
  if (!Array.isArray(sessionsArray) || sessionsArray.length === 0) {
    return {
      realHours: 0,
      roundedHours: 0,
      deltaHours: 0,
      deltaMinutes: 0,
      realEarnings: 0,
      roundedEarnings: 0,
      deltaEarnings: 0,
      percentageHours: 0,
      percentageEarnings: 0,
      count: 0
    };
  }

  let totalRealHours = 0;
  let totalRoundedHours = 0;
  let totalRealEarnings = 0;
  let totalRoundedEarnings = 0;

  sessionsArray.forEach(s => {
    const realH = Number(s.duration_hours) || 0;
    const rate = Number(s.hourly_rate) || 0;
    const roundedH = roundHours(realH);

    totalRealHours += realH;
    totalRoundedHours += roundedH;

    // Guadagni reali: ore reali * tariffa oraria
    totalRealEarnings += realH * rate;
    // Guadagni arrotondati: ore arrotondate * tariffa oraria
    totalRoundedEarnings += roundedH * rate;
  });

  const deltaHours = totalRoundedHours - totalRealHours;
  const deltaMinutes = Math.round(deltaHours * 60);
  const deltaEarnings = totalRoundedEarnings - totalRealEarnings;

  const percentageHours = totalRealHours > 0 ? (deltaHours / totalRealHours) * 100 : 0;
  const percentageEarnings = totalRealEarnings > 0 ? (deltaEarnings / totalRealEarnings) * 100 : 0;

  return {
    realHours: totalRealHours,
    roundedHours: totalRoundedHours,
    deltaHours,
    deltaMinutes,
    realEarnings: totalRealEarnings,
    roundedEarnings: totalRoundedEarnings,
    deltaEarnings,
    percentageHours,
    percentageEarnings,
    count: sessionsArray.length
  };
};


